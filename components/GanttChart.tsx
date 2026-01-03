import React from 'react';
import { Task, User, Group } from '../types';

interface GanttChartProps {
  tasks: Task[];
  users: User[];
  groups: Group[];
}

export const GanttChart: React.FC<GanttChartProps> = ({ tasks, users, groups }) => {
  if (tasks.length === 0) return <div className="text-gray-500 text-center py-10">目前沒有任務數據</div>;

  // Calculate timeline bounds
  const minDate = Math.min(...tasks.map(t => t.startDate));
  const maxDate = Math.max(...tasks.map(t => t.dueDate));
  const totalDuration = maxDate - minDate;

  // Buffer for display
  const timelineStart = minDate - 86400000;
  const timelineEnd = maxDate + 86400000;
  const timelineDuration = timelineEnd - timelineStart;

  const getAssigneeName = (task: Task) => {
    if (task.assigneeType === 'USER') {
      return users.find(u => u.id === task.assigneeId)?.name || '未知人員';
    }
    return groups.find(g => g.id === task.assigneeId)?.name || '未知群組';
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' });

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <h3 className="text-lg font-bold text-gray-800 mb-6">任務進度甘特圖</h3>

      <div className="min-w-[800px]">
        {/* Timeline Header */}
        <div className="flex border-b pb-2 mb-4">
          <div className="w-1/4 font-semibold text-gray-500 pl-2">任務名稱</div>
          <div className="w-3/4 relative h-6">
            <span className="absolute left-0 text-xs text-gray-400">{formatDate(timelineStart)}</span>
            <span className="absolute right-0 text-xs text-gray-400">{formatDate(timelineEnd)}</span>
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-4">
          {tasks.map(task => {
            const left = ((task.startDate - timelineStart) / timelineDuration) * 100;
            const width = ((task.dueDate - task.startDate) / timelineDuration) * 100;

            let colorClass = 'bg-blue-500';
            if (task.status === 'COMPLETED') colorClass = 'bg-green-500';
            else if (task.status === 'BLOCKED') colorClass = 'bg-red-500';
            else if (task.progress >= 100) colorClass = 'bg-green-500'; // Auto green if 100%
            else if (new Date().getTime() > task.dueDate) colorClass = 'bg-red-400'; // Overdue but active
            else colorClass = 'bg-blue-600';

            const todayLeft = ((Date.now() - timelineStart) / timelineDuration) * 100;

            return (
              <div key={task.id} className="flex items-center group relative py-1">
                <div className="w-1/4 pr-4">
                  <div className="font-medium text-gray-800 truncate" title={task.title}>{task.title}</div>
                  <div className="text-xs text-gray-500">{getAssigneeName(task)}</div>
                </div>
                <div className="w-3/4 relative h-8">
                  {/* Today Marker Line */}
                  <div className="absolute top-0 bottom-0 border-l border-dashed border-red-400 z-10 opacity-30 pointer-events-none" style={{ left: `${todayLeft}%` }}></div>

                  {/* Task Duration Bar (The Container) */}
                  <div
                    className="absolute h-6 top-1 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-inner"
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    {/* The Progress Fill */}
                    <div
                      className={`h-full ${colorClass} transition-all duration-700 flex items-center justify-end pr-1.5 shadow-sm relative`}
                      style={{
                        width: `${task.progress}%`,
                        minWidth: task.progress === 0 ? '4px' : '0',
                        opacity: task.progress === 0 ? 0.3 : 1
                      }}
                    >
                      {task.progress > 20 && (
                        <span className="text-[10px] text-white font-bold drop-shadow-sm">{task.progress}%</span>
                      )}
                    </div>

                    {/* Progress Label for small percentages */}
                    {task.progress <= 20 && (
                      <div className="absolute inset-y-0 flex items-center pl-1" style={{ left: `${Math.max(task.progress, 2)}%` }}>
                        <span className="text-[10px] text-gray-500 font-bold">{task.progress}%</span>
                      </div>
                    )}
                  </div>

                  {/* Due Date Indicator (Dashed line at the end of the bar) */}
                  <div className="absolute top-0 bottom-0 border-r-2 border-dashed border-red-500 z-20" style={{ left: `${left + width}%` }} title="截止日期"></div>
                </div>

                {/* Tooltip on hover */}
                <div className="absolute left-1/2 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-30 whitespace-nowrap">
                  {formatDate(task.startDate)} - {formatDate(task.dueDate)} | 進度: {task.progress}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
