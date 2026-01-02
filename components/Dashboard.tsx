import React, { useMemo } from 'react';
import { Task, User, Group, TaskStatus } from '../types';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { GanttChart } from './GanttChart';
import { CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  users: User[];
  groups: Group[];
}

export const Dashboard: React.FC<DashboardProps> = ({ tasks, users, groups }) => {
  
  const statusCounts = useMemo(() => {
    return [
      { name: '待處理', value: tasks.filter(t => t.status === TaskStatus.PENDING).length, color: '#9CA3AF' },
      { name: '進行中', value: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, color: '#3B82F6' },
      { name: '已完成', value: tasks.filter(t => t.status === TaskStatus.COMPLETED).length, color: '#22C55E' },
      { name: '卡關/困難', value: tasks.filter(t => t.status === TaskStatus.BLOCKED).length, color: '#EF4444' },
    ];
  }, [tasks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">總任務數</p>
            <p className="text-2xl font-bold text-gray-800">{totalTasks}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-lg text-green-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">完成率</p>
            <p className="text-2xl font-bold text-gray-800">{completionRate}%</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 rounded-lg text-yellow-600">
            <Loader2 size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">進行中</p>
            <p className="text-2xl font-bold text-gray-800">{statusCounts.find(s => s.name === '進行中')?.value || 0}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-100 rounded-lg text-red-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">卡關/困難</p>
            <p className="text-2xl font-bold text-gray-800">{statusCounts.find(s => s.name === '卡關/困難')?.value || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
          <h3 className="text-lg font-bold text-gray-800 mb-4">任務狀態分佈</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusCounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task List Preview */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2 overflow-y-auto max-h-[400px]">
          <h3 className="text-lg font-bold text-gray-800 mb-4">近期任務概覽</h3>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">任務名稱</th>
                <th className="px-4 py-3">負責人/組</th>
                <th className="px-4 py-3">截止日</th>
                <th className="px-4 py-3">進度</th>
                <th className="px-4 py-3 rounded-r-lg">狀態</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => {
                const assigneeName = task.assigneeType === 'USER' 
                  ? users.find(u => u.id === task.assigneeId)?.name 
                  : groups.find(g => g.id === task.assigneeId)?.name;

                return (
                  <tr key={task.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{task.title}</td>
                    <td className="px-4 py-3 text-gray-600">{assigneeName}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(task.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${task.progress}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 inline-block">{task.progress}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${task.status === TaskStatus.COMPLETED ? 'bg-green-100 text-green-700' : 
                          task.status === TaskStatus.BLOCKED ? 'bg-red-100 text-red-700' :
                          task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'}`}>
                        {task.status === TaskStatus.COMPLETED ? '已完成' : 
                         task.status === TaskStatus.BLOCKED ? '卡關' :
                         task.status === TaskStatus.IN_PROGRESS ? '進行中' : '待處理'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gantt Chart Component */}
      <GanttChart tasks={tasks} users={users} groups={groups} />
    </div>
  );
};
