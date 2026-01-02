import React, { useState, useEffect } from 'react';
import { User, Group, Task, TaskStatus, ReportingFrequency } from '../types';
import { Calendar, Clock, User as UserIcon, Users, Mail, CheckCircle, Copy, Link as LinkIcon } from 'lucide-react';
import { dataService } from '../services/dataService';
import emailjs from '@emailjs/browser';

interface TaskFormProps {
  users: User[];
  groups: Group[];
  onSubmit: (task: Task) => Promise<void> | void;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ users, groups, onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeType, setAssigneeType] = useState<'USER' | 'GROUP'>('USER');
  const [assigneeId, setAssigneeId] = useState<string>(users[0]?.id || '');
  const [dueDate, setDueDate] = useState('');
  const [duration, setDuration] = useState(8);
  const [reminder, setReminder] = useState<ReportingFrequency>(ReportingFrequency.DAILY);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Modal State
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdTask, setCreatedTask] = useState<Task | null>(null);

  // Email sending state
  const [emailStatus, setEmailStatus] = useState<'IDLE' | 'SENDING' | 'SUCCESS' | 'ERROR'>('IDLE');

  // URL State
  const [baseUrl, setBaseUrl] = useState('');
  const [config, setConfig] = useState<any>({});

  // Load Base URL and Config on Mount
  useEffect(() => {
    const unsubscribe = dataService.subscribeToConfig((loadedConfig) => {
      setConfig(loadedConfig);
      if (loadedConfig.systemBaseUrl) {
        setBaseUrl(loadedConfig.systemBaseUrl);
      } else {
        const currentUrl = window.location.href.split('?')[0];
        const cleanUrl = currentUrl.endsWith('/') ? currentUrl.slice(0, -1) : currentUrl;
        setBaseUrl(cleanUrl);
      }

      // Init EmailJS if config is present
      if (loadedConfig.emailJsPublicKey) {
        try {
          emailjs.init(loadedConfig.emailJsPublicKey);
        } catch (e) {
          console.error("EmailJS init failed", e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleBaseUrlChange = (newUrl: string) => {
    setBaseUrl(newUrl);
  };

  const getRecipientInfo = (task: Task) => {
    let emailTo = '';
    let recipientName = '';

    if (task.assigneeType === 'USER') {
      const user = users.find(u => u.id === task.assigneeId);
      emailTo = user?.email || '';
      recipientName = user?.name || 'User';
    } else {
      const group = groups.find(g => g.id === task.assigneeId);
      recipientName = group?.name || 'Group';
      // For groups, we might want to email all members? 
      // EmailJS free tier often limits TO field. 
      // For MVP, we'll try to join them if it supports it, or just warn user.
      // Let's grab all emails.
      const memberEmails = group?.memberIds.map(mid => users.find(u => u.id === mid)?.email).filter(Boolean);
      emailTo = memberEmails?.join(',') || '';
    }
    return { emailTo, recipientName };
  };

  const sendAutoEmail = async (task: Task) => {
    if (!config.emailJsServiceId || !config.emailJsTemplateId || !config.emailJsPublicKey) {
      console.log("EmailJS not configured, skipping auto-send.");
      return;
    }

    const { emailTo, recipientName } = getRecipientInfo(task);
    if (!emailTo) return;

    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const taskLink = `${cleanBaseUrl}?taskId=${task.id}`;

    setEmailStatus('SENDING');
    try {
      await emailjs.send(
        config.emailJsServiceId,
        config.emailJsTemplateId,
        {
          to_name: recipientName,
          to_email: emailTo,
          message: `您已被指派新任務：${task.title}\n\n描述：${task.description || '無'}\n截止：${new Date(task.dueDate).toLocaleDateString()}`,
          task_link: taskLink
        }
      );
      setEmailStatus('SUCCESS');
    } catch (error) {
      console.error("Auto email failed", error);
      setEmailStatus('ERROR');
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assigneeId || !dueDate) return;

    const newTaskId = `task-${Date.now()}`;
    const newTask: Task = {
      id: newTaskId,
      title,
      description,
      assigneeId,
      assigneeType,
      startDate: Date.now(),
      dueDate: new Date(dueDate).getTime(),
      estimatedDuration: Number(duration),
      reminderFrequency: reminder as any,
      reportingFrequency: reminder,
      status: TaskStatus.PENDING,
      progress: 0,
      logs: []
    };

    try {
      setIsSubmitting(true);

      // 1. Save Task
      await onSubmit(newTask);
      setCreatedTask(newTask);

      // 2. Try Auto-Send Email
      // We do this concurrently or after? After is safer for "success" modal.
      await sendAutoEmail(newTask);

      setShowSuccess(true);
    } catch (error) {
      alert('任務建立失敗，請重試。');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic Link Generation based on editable Base URL
  const getNotificationData = () => {
    if (!createdTask) return { link: '', mailto: '', assigneeName: '' };

    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const taskLink = `${cleanBaseUrl}?taskId=${createdTask.id}`;
    const { emailTo, recipientName } = getRecipientInfo(createdTask);

    const subject = `[TaskFlow] ${createdTask.title}`;
    const bodyText = `您好，

您已被指派一項新任務：

任務名稱：${createdTask.title}
截止日期：${new Date(createdTask.dueDate).toLocaleDateString('zh-TW')}

請點擊以下連結查看任務詳情：
${taskLink}

---
TaskFlow Pro 系統通知`;

    const mailto = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

    return { link: taskLink, mailto, assigneeName: recipientName };
  };

  const notificationData = getNotificationData();

  const copyToClipboard = () => {
    if (notificationData.link) {
      navigator.clipboard.writeText(notificationData.link);
      alert('連結已複製到剪貼簿');
    }
  };

  const closeSuccessModal = () => {
    setShowSuccess(false);
    onCancel(); // Use onCancel to return to dashboard
  };

  if (showSuccess && createdTask) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 text-center animate-fade-in-up">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">任務建立成功！</h3>

          {/* Auto Email Status Feedback */}
          {emailStatus === 'SUCCESS' && (
            <p className="text-sm text-green-600 font-bold mb-2 bg-green-50 p-2 rounded">
              ✓ 已透過系統設定的郵件服務 (EmailJS) 發送通知。<br />
              <span className="text-xs font-normal text-gray-500 block mt-1">(注意：此郵件不會出現在您的個人寄件備份中，除非您在 EmailJS 綁定該帳號)</span>
            </p>
          )}
          {emailStatus === 'ERROR' && (
            <p className="text-sm text-red-500 mb-2 bg-red-50 p-2 rounded">
              ⚠ 自動發信失敗 (可能是超過每月免費額度)，請使用下方按鈕手動通知
            </p>
          )}
          {emailStatus === 'IDLE' && !config.emailJsServiceId && (
            <p className="text-xs text-gray-400 mb-2">
              (未設定自動發信，請手動通知)
            </p>
          )}

          <p className="text-gray-500 mb-4">
            任務已分配給 <span className="font-bold text-gray-700">{notificationData.assigneeName}</span>。
          </p>

          <div className="bg-orange-50 p-4 rounded-lg mb-6 text-left border border-orange-100 shadow-inner">
            <label className="block text-xs font-bold text-orange-800 mb-2 flex items-center justify-between">
              <span className="flex items-center"><LinkIcon size={12} className="mr-1" /> 系統發布網址 (Base URL)</span>
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => handleBaseUrlChange(e.target.value)}
              className="w-full text-sm p-2 border border-orange-200 rounded text-gray-600 focus:outline-none focus:border-orange-400 bg-white"
              placeholder="例如: https://username.github.io/taskflow"
            />
            <div className="mt-2 text-[11px] text-orange-700 leading-relaxed">
              目前設定的連結預覽：<br /><code className="bg-orange-100 px-1 rounded text-orange-900">{notificationData.link}</code>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href={notificationData.mailto}
              className="flex items-center justify-center w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
            >
              <Mail size={18} className="mr-2" />
              開啟郵件軟體發送通知 (手動)
            </a>

            <button
              onClick={copyToClipboard}
              className="flex items-center justify-center w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              <Copy size={18} className="mr-2" />
              複製任務連結
            </button>
          </div>

          <button
            onClick={closeSuccessModal}
            className="mt-6 text-gray-400 hover:text-gray-600 text-sm"
          >
            關閉視窗並返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">建立新任務</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">任務名稱</label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            placeholder="請輸入任務名稱"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">任務描述</label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition h-32 resize-none"
            placeholder="詳細說明任務內容..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assignee Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-3">指派對象</label>
            <div className="flex space-x-4 mb-3">
              <button
                type="button"
                onClick={() => setAssigneeType('USER')}
                className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-medium transition ${assigneeType === 'USER' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 border'
                  }`}
              >
                <UserIcon size={16} className="mr-2" /> 個人
              </button>
              <button
                type="button"
                onClick={() => setAssigneeType('GROUP')}
                className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-medium transition ${assigneeType === 'GROUP' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 border'
                  }`}
              >
                <Users size={16} className="mr-2" /> 群組
              </button>
            </div>

            <select
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {assigneeType === 'USER' ? (
                users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)
              ) : (
                groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)
              )}
            </select>
          </div>

          {/* Time & Settings */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Calendar size={16} className="mr-2" /> 截止日期
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Clock size={16} className="mr-2" /> 預估工時 (小時)
              </label>
              <input
                type="number"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={duration}
                onChange={e => setDuration(parseInt(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Clock size={16} className="mr-2" /> 回報頻率要求
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={reminder}
                onChange={e => setReminder(e.target.value as ReportingFrequency)}
              >
                <option value="NONE">不強制</option>
                <option value="HOURLY">每小時</option>
                <option value="DAILY">每天</option>
                <option value="WEEKLY">每週</option>
                <option value="MONTHLY">每月</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                處理中...
              </>
            ) : (
              '分配任務'
            )}
          </button>
        </div>
      </form >
    </div >
  );
};