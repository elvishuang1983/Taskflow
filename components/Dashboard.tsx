import React, { useMemo } from 'react';
import { Task, User, Group, TaskStatus, ReportingFrequency } from '../types';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { dataService } from '../services/dataService';
import { GanttChart } from './GanttChart';
import { CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  users: User[];
  groups: Group[];
  onTaskClick: (task: Task) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ tasks, users, groups, onTaskClick }) => {

  const statusCounts = useMemo(() => {
    return [
      { name: '待處理', value: tasks.filter(t => t.status === TaskStatus.PENDING).length, color: '#9CA3AF' },
      { name: '進行中', value: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length, color: '#3B82F6' },
      { name: '已完成', value: tasks.filter(t => t.status === TaskStatus.COMPLETED).length, color: '#22C55E' },
      { name: '卡關/困難', value: tasks.filter(t => t.status === TaskStatus.BLOCKED).length, color: '#EF4444' },
    ];
  }, [tasks]);

  // Calculate Missed Reports
  const missedReportsData = useMemo(() => {
    const overdueTasks = tasks.filter(t => dataService.checkMissedReports(t));

    // Group by Assignee for the chart
    const reportsByAssignee: Record<string, number> = {};
    overdueTasks.forEach(t => {
      let name = 'Unknown';
      if (t.assigneeType === 'USER') {
        name = users.find(u => u.id === t.assigneeId)?.name || 'Unknown User';
      } else {
        name = groups.find(g => g.id === t.assigneeId)?.name || 'Unknown Group';
      }
      reportsByAssignee[name] = (reportsByAssignee[name] || 0) + 1;
    });

    return Object.keys(reportsByAssignee).map(name => ({
      name,
      count: reportsByAssignee[name]
    }));
  }, [tasks, users, groups]);

  const overdueTasksCount = missedReportsData.reduce((acc, cur) => acc + cur.count, 0);

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
          <div className={`p-3 rounded-lg ${overdueTasksCount > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">回報逾期</p>
            <p className={`text-2xl font-bold ${overdueTasksCount > 0 ? 'text-red-600' : 'text-gray-800'}`}>{overdueTasksCount}</p>
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
                <Legend verticalAlign="bottom" height={36} />
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
                  <tr key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="border-b last:border-0 hover:bg-gray-50 transition-colors cursor-pointer">
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

      {/* Missed Reports Trend */}
      {overdueTasksCount > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-red-600 flex items-center">
              <AlertCircle size={20} className="mr-2" /> 未回報/逾期趨勢
            </h3>
            <span className="text-sm text-gray-500">統計目前所有逾期未更新進度的任務</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={missedReportsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="count" name="逾期任務數" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Gantt Chart Component */}
      <GanttChart tasks={tasks} users={users} groups={groups} />
    </div>
  );
};
