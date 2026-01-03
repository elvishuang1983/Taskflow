import React, { useState, useEffect } from 'react';
import { Save, Settings, Mail, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { dataService, SystemConfig } from '../services/dataService';
import emailjs from '@emailjs/browser';

export const SystemSettings: React.FC = () => {
    const [config, setConfig] = useState<SystemConfig>({
        emailJsServiceId: '',
        emailJsTemplateId: '',
        emailJsPublicKey: '',
        systemBaseUrl: ''
    });

    const [status, setStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS'>('IDLE');
    const [testStatus, setTestStatus] = useState<'IDLE' | 'SENDING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [testEmail, setTestEmail] = useState('');

    useEffect(() => {
        // Corrected to use subscription
        const unsubscribe = dataService.subscribeToConfig((saved) => {
            setConfig(saved);
            // Initialize if keys exist
            if (saved.emailJsPublicKey) emailjs.init(saved.emailJsPublicKey);
        });

        return () => unsubscribe();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('SAVING');

        // Save is async now
        await dataService.saveConfig(config);

        if (config.emailJsPublicKey) {
            emailjs.init(config.emailJsPublicKey);
        }

        setTimeout(() => {
            setStatus('SUCCESS');
            setTimeout(() => setStatus('IDLE'), 2000);
        }, 500);
    };

    const handleTestEmail = async () => {
        if (!testEmail) {
            alert('請輸入測試用的收件信箱');
            return;
        }

        // 1. Outlook Mode Test
        if (config.notificationPreference === 'OUTLOOK') {
            const subject = encodeURIComponent('TaskFlow Pro 系統測試信');
            const body = encodeURIComponent(`這是一封測試郵件。\n\n如果您看到此視窗，代表您的 Outlook/手動開啟功能正常。\n\n收件人: ${testEmail}`);
            window.location.href = `mailto:${testEmail}?subject=${subject}&body=${body}`;
            setTestStatus('SUCCESS');
            setTimeout(() => setTestStatus('IDLE'), 2000);
            return;
        }

        // 2. EmailJS Mode Test
        if (!config.emailJsServiceId || !config.emailJsTemplateId || !config.emailJsPublicKey) {
            alert('請先填寫並「儲存」完整的設定資訊 (Service ID, Template ID, Public Key)');
            return;
        }

        setTestStatus('SENDING');

        // Prepare test params
        const templateParams = {
            to_name: '測試人員',
            to_email: testEmail,
            message: '這是一封來自 TaskFlow Pro 的測試郵件。如果您收到此信，代表您的 Gmail (或 SMTP) 設定已成功！',
            task_link: window.location.href,
        };

        try {
            await emailjs.send(
                config.emailJsServiceId,
                config.emailJsTemplateId,
                templateParams,
                config.emailJsPublicKey // Pass Public Key explicitly
            );
            setTestStatus('SUCCESS');
            alert('測試郵件發送成功！請檢查您的信箱。');
        } catch (error: any) {
            console.error(error);
            setTestStatus('ERROR');
            // Show specific error from EmailJS if available
            const errorMsg = error?.text || error?.message || '未知錯誤';
            alert(`測試發送失敗。\n\n錯誤詳情: ${errorMsg}\n\n請檢查 Service ID 是否正確，或是否已在 EmailJS 後台連結 Gmail 帳號。`);
        } finally {
            setTimeout(() => setTestStatus('IDLE'), 3000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center text-gray-800">
                <Settings size={28} className="mr-3 text-blue-600" />
                <h2 className="text-2xl font-bold">系統通知設定 (Gmail 整合)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Form */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg mb-4 text-gray-800">EmailJS 金鑰設定</h3>
                    <form onSubmit={handleSave} className="space-y-6">
                        {/* Notification Mode Selector */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <label className="block text-sm font-bold text-gray-700 mb-3">預設通知方式</label>
                            <div className="flex space-x-4">
                                <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center transition
                                    ${config.notificationPreference !== 'OUTLOOK' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-600'}`}>
                                    <input
                                        type="radio"
                                        name="notifMode"
                                        className="hidden"
                                        checked={config.notificationPreference !== 'OUTLOOK'}
                                        onChange={() => setConfig({ ...config, notificationPreference: 'EMAILJS' })}
                                    />
                                    <div className="flex items-center">
                                        <Mail size={18} className="mr-2" />
                                        <span className="font-bold">EmailJS 自動寄信</span>
                                    </div>
                                </label>
                                <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center transition
                                    ${config.notificationPreference === 'OUTLOOK' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-600'}`}>
                                    <input
                                        type="radio"
                                        name="notifMode"
                                        className="hidden"
                                        checked={config.notificationPreference === 'OUTLOOK'}
                                        onChange={() => setConfig({ ...config, notificationPreference: 'OUTLOOK' })}
                                    />
                                    <div className="flex items-center">
                                        <ExternalLink size={18} className="mr-2" />
                                        <span className="font-bold">Outlook 手動開啟</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Service ID (Gmail)</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="例如: service_gmail"
                                value={config.emailJsServiceId}
                                onChange={e => setConfig({ ...config, emailJsServiceId: e.target.value })}
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                在 EmailJS 新增 Service 時選擇 "Gmail"，建立後即可取得 ID。
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Template ID (一般預設)</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="例如: template_welcome"
                                value={config.emailJsTemplateId}
                                onChange={e => setConfig({ ...config, emailJsTemplateId: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Template ID (逾期催繳)</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="例如: template_overdue (選填)"
                                value={config.emailJsReminderTemplateId || ''}
                                onChange={e => setConfig({ ...config, emailJsReminderTemplateId: e.target.value })}
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                若未提供，將自動使用上方的預設 Template ID。
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="例如: user_xxxxx"
                                value={config.emailJsPublicKey}
                                onChange={e => setConfig({ ...config, emailJsPublicKey: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'SAVING'}
                            className={`w-full py-3 rounded-lg font-bold text-white transition flex items-center justify-center
                    ${status === 'SUCCESS' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}
                `}
                        >
                            {status === 'SAVING' ? '儲存中...' : status === 'SUCCESS' ? '設定已儲存！' : (
                                <><Save size={18} className="mr-2" /> 儲存設定</>
                            )}
                        </button>
                    </form>
                </div>

                {/* Right Column: Instructions & Test */}
                <div className="space-y-6">
                    {/* Guide */}
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-sm text-blue-800">
                        <h4 className="font-bold text-base mb-3 flex items-center">
                            <AlertCircle size={18} className="mr-2" /> 如何連結 Gmail?
                        </h4>
                        <ol className="list-decimal pl-5 space-y-2">
                            <li>前往 <a href="https://www.emailjs.com/" target="_blank" className="underline font-bold inline-flex items-center">EmailJS 官網 <ExternalLink size={12} className="ml-1" /></a> 並註冊帳號。</li>
                            <li>在 <strong>Email Services</strong> 頁籤，點擊 "Add New Service"。</li>
                            <li>選擇 <strong>Gmail</strong>，然後點擊 "Connect Account" 登入您的 Google 帳號授權。</li>
                            <li>將產生的 <strong>Service ID</strong> 填入左側欄位。</li>
                            <li>在 <strong>Email Templates</strong> 建立一個新模板，確保內容包含變數：<br /><code>{`{{to_name}}`}</code>, <code>{`{{to_email}}`}</code>, <code>{`{{message}}`}</code>, <code>{`{{task_link}}`}</code>。</li>
                        </ol>
                    </div>

                    {/* Test Area */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <h4 className="font-bold text-base mb-3 text-gray-800 flex items-center">
                            <Mail size={18} className="mr-2" /> 連線測試
                        </h4>
                        <p className="text-xs text-gray-500 mb-3">儲存設定後，輸入您的信箱進行測試。</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="輸入您的 Email"
                                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                value={testEmail}
                                onChange={e => setTestEmail(e.target.value)}
                            />
                            <button
                                onClick={handleTestEmail}
                                disabled={testStatus === 'SENDING'}
                                className={`px-4 py-2 rounded-lg text-white text-sm font-bold transition flex items-center
                            ${testStatus === 'SUCCESS' ? 'bg-green-600' : testStatus === 'ERROR' ? 'bg-red-500' : 'bg-gray-800 hover:bg-gray-900'}
                        `}
                            >
                                {testStatus === 'SENDING' ? <Loader2 size={16} className="animate-spin" /> :
                                    testStatus === 'SUCCESS' ? <CheckCircle2 size={16} /> : '發送測試'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};