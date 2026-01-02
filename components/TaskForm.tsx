import React, { useState, useEffect } from 'react';
import { User, Group, Task, TaskStatus, ReminderFrequency } from '../types';
import { Calendar, Clock, User as UserIcon, Users, Mail, CheckCircle, Copy, Link as LinkIcon, Save } from 'lucide-react';
import { dataService } from '../services/dataService';

interface TaskFormProps {
  users: User[];
  groups: Group[];
  onSubmit: (task: Task) => void;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ users, groups, onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeType, setAssigneeType] = useState<'USER' | 'GROUP'>('USER');
  const [assigneeId, setAssigneeId] = useState<string>(users[0]?.id || '');
  const [dueDate, setDueDate] = useState('');
  const [duration, setDuration] = useState(8);
  const [reminder, setReminder] = useState<ReminderFrequency>(ReminderFrequency.DAILY);

  // Success Modal State
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdTask, setCreatedTask] = useState<Task | null>(null);
  
  // URL State
  const [baseUrl, setBaseUrl] = useState('');

  // Load Base URL from Config on Mount or Detect automatically
  useEffect(() => {
    const config = dataService.getConfig();
    if (config.systemBaseUrl) {
        setBaseUrl(config.systemBaseUrl);
    } else {
        // Smart Detection: Get current URL without query params
        // This supports GitHub Pages which usually lives in a subdirectory (e.g. /my-repo/)
        const currentUrl = window.location.href.split('?')[0];
        // Remove trailing slash for consistency
        const cleanUrl = currentUrl.endsWith('/') ? currentUrl.slice(0, -1) : currentUrl;
        setBaseUrl(cleanUrl);
    }
  }, []);

  const handleBaseUrlChange = (newUrl: string) => {
    setBaseUrl(newUrl);
    // Auto-save the new URL preference
    const config = dataService.getConfig();
    dataService.saveConfig({
        ...config,
        systemBaseUrl: newUrl
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
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
      reminderFrequency: reminder,
      status: TaskStatus.PENDING,
      progress: 0,
      logs: []
    };

    // Save task immediately
    onSubmit(newTask);
    setCreatedTask(newTask);
    setShowSuccess(true);
  };

  // Dynamic Link Generation based on editable Base URL
  const getNotificationData = () => {
    if (!createdTask) return { link: '', mailto: '', assigneeName: '' };

    // Handle trailing slash just in case user input has it
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Simply append the query param. 
    // We trust baseUrl is the full entry point (e.g., https://user.github.io/repo)
    const taskLink = `${cleanBaseUrl}?taskId=${createdTask.id}`;
    
    let emailTo = '';
    let assigneeName = '';

    if (createdTask.assigneeType === 'USER') {
        const user = users.find(u => u.id === createdTask.assigneeId);
        emailTo = user?.email || '';
        assigneeName = user?.name || '';
    } else {
        const group = groups.find(g => g.id === createdTask.assigneeId);
        assigneeName = group?.name || '';
        const memberEmails = group?.memberIds.map(mid => users.find(u => u.id === mid)?.email).filter(Boolean);
        emailTo = memberEmails?.join(',') || '';
    }

    const subject = encodeURIComponent(`[任務指派] ${createdTask.title}`);
    const body = encodeURIComponent(`你好，\n\n您已被指派一項新任務，請查收。\n\n任務名稱: ${createdTask.title}\n截止日期: ${new Date(createdTask.dueDate).toLocaleDateString()}\n\n請點擊以下連結回報進度:\n${taskLink}\n\nTaskFlow Pro 系統通知`);
    
    const mailto = `mailto:${emailTo}?subject=${subject}&body=${body}`;

    return { link: taskLink, mailto, assigneeName };
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
    onCancel(); 
  };

  if (showSuccess && createdTask) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 text-center animate-fade-in-up">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">任務建立成功！</h3>
          <p className="text-gray-500 mb-4">
            任務已分配給 <span className="font-bold text-gray-700">{notificationData.assigneeName}</span>。
          </p>

          {/* URL Correction Field */}
          <div className="bg-orange-50 p-4 rounded-lg mb-6 text-left border border-orange-100 shadow-inner">
             <label className="block text-xs font-bold text-orange-800 mb-2 flex items-center justify-between">
                <span className="flex items-center"><LinkIcon size={12} className="mr-1"/> 系統發布網址 (Base URL)</span>
                <span className="text-[10px] bg-orange-200 px-2 py-0.5 rounded text-orange-800 flex items-center">
                    <Save size={8} className="mr-1"/> 自動儲存
                </span>
             </label>
             <input 
                type="text" 
                value={baseUrl}
                onChange={(e) => handleBaseUrlChange(e.target.value)}
                className="w-full text-sm p-2 border border-orange-200 rounded text-gray-600 focus:outline-none focus:border-orange-400 bg-white"
                placeholder="例如: https://username.github.io/taskflow"
             />
             <div className="mt-2 text-[11px] text-orange-700 leading-relaxed">
                <strong>網址設定說明：</strong>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>如果您部署到 <strong>GitHub Pages</strong>，系統通常會自動偵測到正確網址。</li>
                    <li>若自動偵測不正確，請手動輸入您的正式網址（包含專案名稱）。</li>
                    <li>目前設定的連結預覽：<br/><code className="bg-orange-100 px-1 rounded text-orange-900">{notificationData.link}</code></li>
                </ul>
             </div>
          </div>

          <div className="space-y-3">
            <a 
              href={notificationData.mailto}
              className="flex items-center justify-center w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
            >
              <Mail size={18} className="mr-2" />
              開啟郵件軟體發送通知
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
                className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-medium transition ${
                  assigneeType === 'USER' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 border'
                }`}
              >
                <UserIcon size={16} className="mr-2" /> 個人
              </button>
              <button
                type="button"
                onClick={() => setAssigneeType('GROUP')}
                className={`flex-1 flex items-center justify-center py-2 rounded-md text-sm font-medium transition ${
                  assigneeType === 'GROUP' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 border'
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
                <Calendar size={16} className="mr-2"/> 截止日期
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
                <Clock size={16} className="mr-2"/> 預估工時 (小時)
              </label>
              <input
                type="number"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={duration}
                onChange={e => setDuration(parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            取消
          </button>
          <button
            type="submit"
            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition"
          >
            分配任務
          </button>
        </div>
      </form>
    </div>
  );
};