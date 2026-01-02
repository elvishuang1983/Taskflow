import React, { useState } from 'react';
import { Task, TaskStatus, ProgressLog, User } from '../types';
import { Send, Upload, Clock, AlertTriangle, ArrowLeft, FileText, Image as ImageIcon, MessageSquare, Save } from 'lucide-react';

interface ExecutorViewProps {
  task: Task;
  currentUser: User;
  onUpdateTask: (task: Task) => Promise<void> | void;
  onBack: () => void;
}

export const ExecutorView: React.FC<ExecutorViewProps> = ({ task, currentUser, onUpdateTask, onBack }) => {
  const [progress, setProgress] = useState(task.progress);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [hoursSpent, setHoursSpent] = useState(0);
  const [comment, setComment] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileData, setFileData] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manager Reply State
  const [replyingLogId, setReplyingLogId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileName(file.name);

      // Convert to Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newLog: ProgressLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      hoursSpent: Number(hoursSpent),
      comment,
      attachmentName: fileName || null,
      attachmentData: fileData || null
    };

    // Basic Size Check (approx 800KB limit for safety, Firestore is 1MB)
    if (fileData && fileData.length > 800 * 1024) {
      alert('附件檔案過大！請上傳小於 800KB 的圖片/文件。');
      setIsSubmitting(false);
      return;
    }

    const updatedTask: Task = {
      ...task,
      progress: Number(progress),
      status,
      logs: [newLog, ...task.logs]
    };

    try {
      setIsSubmitting(true);
      await onUpdateTask(updatedTask);

      // Reset form
      setHoursSpent(0);
      setComment('');
      setFileName(null);
      setFileData(undefined);
      alert('進度回報成功！');
    } catch (error) {
      alert('進度回報失敗，請重試。');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (logId: string) => {
    if (!replyText.trim()) return;

    const updatedLogs = task.logs.map(log => {
      if (log.id === logId) {
        return {
          ...log,
          managerReply: replyText,
          managerReplyAt: Date.now()
        };
      }
      return log;
    });

    const updatedTask = { ...task, logs: updatedLogs };
    await onUpdateTask(updatedTask);

    setReplyingLogId(null);
    setReplyText('');
  };

  /* Logic Improvements for "Foolproof" reporting */
  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus);
    if (newStatus === TaskStatus.COMPLETED) {
      setProgress(100);
    }
  };

  const handleProgressChange = (newProgress: number) => {
    setProgress(newProgress);
    if (newProgress === 100) {
      setStatus(TaskStatus.COMPLETED);
    } else if (status === TaskStatus.COMPLETED && newProgress < 100) {
      // If user lowers progress, revert status to In Progress
      setStatus(TaskStatus.IN_PROGRESS);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <button onClick={onBack} className="flex items-center text-sm text-gray-500 hover:text-blue-600 mb-4 transition">
          <ArrowLeft size={16} className="mr-1" /> 返回任務列表
        </button>

        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold text-gray-800">{task.title}</h1>
          <div className={`px-4 py-2 rounded-lg font-bold text-white text-sm
            ${task.status === TaskStatus.COMPLETED ? 'bg-green-500' :
              task.status === TaskStatus.BLOCKED ? 'bg-red-500' : 'bg-blue-500'}`}>
            {task.status === TaskStatus.COMPLETED ? '已完成' :
              task.status === TaskStatus.BLOCKED ? '卡關中' :
                task.status === TaskStatus.IN_PROGRESS ? '進行中' : '待處理'}
          </div>
        </div>
        <p className="text-gray-500 mt-2 bg-gray-50 p-4 rounded-lg">{task.description}</p>
        <div className="flex gap-6 mt-4 text-sm text-gray-600">
          <span className="flex items-center"><Clock size={16} className="mr-1" /> 截止: {new Date(task.dueDate).toLocaleDateString()}</span>
          <span className="flex items-center"><AlertTriangle size={16} className="mr-1" /> 預估: {task.estimatedDuration} 小時</span>
        </div>

        {/* Warning if already completed */}
        {task.status === TaskStatus.COMPLETED && (
          <div className="mt-4 bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-200 flex items-center">
            <Clock size={16} className="mr-2" /> 此任務已標記為完成。若需繼續回報，請更新狀態或添加紀錄。
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Report Form */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <Send size={20} className="mr-2 text-blue-600" /> 回報進度
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">本次花費工時 (小時)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={hoursSpent}
                  onChange={e => setHoursSpent(parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">當前任務狀態</label>
                <select
                  value={status}
                  onChange={e => handleStatusChange(e.target.value as TaskStatus)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value={TaskStatus.IN_PROGRESS}>進行中</option>
                  <option value={TaskStatus.BLOCKED}>遇到困難 (Blocked)</option>
                  <option value={TaskStatus.COMPLETED}>已完成</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">總體完成進度 ({progress}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                value={progress}
                onChange={e => handleProgressChange(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">進度說明 / 困難回報</label>
              <textarea
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                placeholder="請描述您完成了什麼，或是遇到了什麼問題..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">附件上傳 (圖片/文件)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                <Upload className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">
                  {fileName ? <span className="text-blue-600 font-medium">{fileName}</span> : '點擊或拖放檔案至此'}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  處理中...
                </>
              ) : (
                '提交回報'
              )}
            </button>
          </form>
        </div>

        {/* History Log with File Preview and Manager Reply */}
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-lg font-bold text-gray-800">歷史紀錄</h3>
          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
            {task.logs.length === 0 && <p className="text-gray-400 text-sm">暫無回報紀錄</p>}
            {task.logs.map(log => (
              <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative pl-6">
                <div className="absolute left-0 top-4 bottom-4 w-1 bg-gray-200 rounded-r"></div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                  <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">+{log.hoursSpent} hr</span>
                </div>
                <p className="text-gray-700 text-sm mb-2 whitespace-pre-wrap">{log.comment}</p>
                {log.attachmentName && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center text-xs text-blue-500 mb-2">
                      <FileText size={12} className="mr-1" /> {log.attachmentName}
                    </div>
                    {/* Show Image Preview if it is an image */}
                    {log.attachmentData && log.attachmentData.startsWith('data:image') && (
                      <div className="rounded overflow-hidden border border-gray-200">
                        <img src={log.attachmentData} alt="attachment" className="w-full h-auto object-cover max-h-32" />
                      </div>
                    )}
                  </div>
                )}

                {/* Manager Reply Display */}
                {log.managerReply && (
                  <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div className="flex items-center text-xs text-blue-600 font-bold mb-1">
                      <MessageSquare size={12} className="mr-1" /> 主管回復
                    </div>
                    <p className="text-sm text-gray-700">{log.managerReply}</p>
                  </div>
                )}

                {/* Manager Reply Action */}
                {currentUser.role === 'MANAGER' && !log.managerReply && replyingLogId !== log.id && (
                  <button
                    onClick={() => setReplyingLogId(log.id)}
                    className="mt-2 text-xs text-gray-400 hover:text-blue-600 flex items-center transition"
                  >
                    <MessageSquare size={12} className="mr-1" /> 回復
                  </button>
                )}

                {/* Reply Input Form */}
                {replyingLogId === log.id && (
                  <div className="mt-2 animate-fade-in-up">
                    <textarea
                      className="w-full p-2 text-sm border border-blue-200 rounded focus:ring-2 focus:ring-blue-100 outline-none"
                      rows={2}
                      placeholder="輸入回復內容..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      autoFocus
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={() => { setReplyingLogId(null); setReplyText(''); }}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleReplySubmit(log.id)}
                        className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700 flex items-center"
                      >
                        <Save size={12} className="mr-1" /> 儲存
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
