import React from 'react';
import { Task, TaskStatus, User, Group } from '../types';
import { Clock, CheckCircle2, AlertCircle, PlayCircle, ArrowRight } from 'lucide-react';

interface ExecutorTaskListProps {
  currentUser: User;
  tasks: Task[];
  groups: Group[];
  onSelectTask: (task: Task) => void;
  onLogout: () => void;
}

export const ExecutorTaskList: React.FC<ExecutorTaskListProps> = ({ currentUser, tasks, groups, onSelectTask, onLogout }) => {
  const myTasks = tasks; // Passed in pre-filtered
  
  const getStatusColor = (status: TaskStatus) => {
    switch(status) {
      case TaskStatus.COMPLETED: return 'bg-green-100 text-green-700';
      case TaskStatus.BLOCKED: return 'bg-red-100 text-red-700';
      case TaskStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch(status) {
      case TaskStatus.COMPLETED: return '已完成';
      case TaskStatus.BLOCKED: return '卡關中';
      case TaskStatus.IN_PROGRESS: return '進行中';
      default: return '待處理';
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">你好, {currentUser.name}</h1>
          <p className="text-gray-500">以下是分配給您或您所屬群組的任務</p>
        </div>
        <button onClick={onLogout} className="text-gray-500 hover:text-red-600 text-sm font-medium transition">
          登出系統
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myTasks.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            目前沒有分配給您的任務。
          </div>
        )}
        
        {myTasks.map(task => {
          const isGroupTask = task.assigneeType === 'GROUP';
          const groupName = isGroupTask ? groups.find(g => g.id === task.assigneeId)?.name : '';

          return (
            <div key={task.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
              onClick={() => onSelectTask(task)}
            >
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                  {isGroupTask && (
                    <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded border border-purple-100">
                      群組: {groupName}
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">{task.title}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-3">{task.description}</p>
                
                <div className="flex items-center text-sm text-gray-400 mb-2">
                  <Clock size={14} className="mr-1"/> 
                  截止: {new Date(task.dueDate).toLocaleDateString()}
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>進度</span>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${task.progress}%` }}></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center text-blue-600 text-sm font-medium">
                填寫進度回報 <ArrowRight size={16} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
