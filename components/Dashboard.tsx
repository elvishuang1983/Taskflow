import React, { useMemo, useState, useEffect } from 'react';
import { Task, User, Group, TaskStatus, ReportingFrequency } from '../types';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { dataService, SystemConfig } from '../services/dataService';
import { GanttChart } from './GanttChart';
import { CheckCircle2, AlertCircle, Clock, Loader2, Trash2, Mail } from 'lucide-react';
import emailjs from '@emailjs/browser';

interface DashboardProps {
  tasks: Task[];
  users: User[];
  groups: Group[];
  currentUser: User;
  onTaskClick: (task: Task) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ tasks, users, groups, currentUser, onTaskClick }) => {
  // Bulk Delete State
  const [selectedTaskIds, setSelectTaskIds] = useState<Set<string>>(new Set());

  // Email Reminders State
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [config, setConfig] = useState<SystemConfig | null>(null);

  useEffect(() => {
    const unsub = dataService.subscribeToConfig(setConfig);
    return () => unsub();
  }, []);

  const toggleSelectTask = (id: string) => {
    const newSet = new Set(selectedTaskIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectTaskIds(newSet);
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.size === 0) return;
    if (confirm(`確定要刪除選取的 ${selectedTaskIds.size} 個任務嗎？`)) {
      for (const id of Array.from(selectedTaskIds)) {
        await dataService.deleteTask(id);
      }
      setSelectTaskIds(new Set());
    }
  };

  const sendSingleReminder = async (task: Task, isSilent = false) => {
    if (!config || !config.emailJsServiceId) {
      if (!isSilent) alert('請先至系統設定配置 EmailJS');
      return false;
    }

    let emailTo = '';
    let name = '';
    if (task.assigneeType === 'USER') {
      const u = users.find(user => user.id === task.assigneeId);
      emailTo = u?.email || '';
      name = u?.name || 'User';
    } else {
      const group = groups.find(g => g.id === task.assigneeId);
      const firstMemberId = group?.memberIds[0];
      const u = users.find(user => user.id === firstMemberId);
      emailTo = u?.email || '';
      name = u?.name || group?.name || 'Group';
    }

    if (!emailTo) return false;

    try {
      await emailjs.send(
        config.emailJsServiceId,
        config.emailJsTemplateId,
        {
          to_name: name,
          to_email: emailTo,
          subject: `【任務進度急催】逾期回報警告 - ${task.title}`,
          message: `【逾期回報催繳通知】\n\n您好 $recipientName，\n\n您的任務「${task.title}」已嚴重超過預定的回報頻率。目前系統偵測到您尚未提交最新的進度報告。\n\n請務必於收到此信後立即登入系統並提交回報，以利專案進度追蹤。\n\n任務連結：${config.systemBaseUrl || window.location.origin}/?taskId=${task.id}\n\n截止日期：${new Date(task.dueDate).toLocaleDateString()}\n回報頻率：${{
            'HOURLY': '每小時',
            'DAILY': '每天',
            'WEEKLY': '每週',
            'MONTHLY': '每月'
          }[task.reportingFrequency] || '一般'}\n\n這是一封自動發出的催繳通知，請儘速處理。`,
          task_link: `${config.systemBaseUrl || window.location.origin}/?taskId=${task.id}`,
          task_title: task.title,
          submitter: '系統自動催繳'
        },
        config.emailJsPublicKey
      );
      // Update the task with the last reminder timestamp
      await dataService.updateTask(task.id, {
        lastReminderSentAt: Date.now(),
        lastReportedAfterReminder: false // Reset until they report
      });
      return true;
    } catch (e) {
      console.error("Reminder failed", e);
      return false;
    }
  };

  const handleSendReminders = async () => {
    const overdueTasks = tasks.filter(t => dataService.checkMissedReports(t));
    if (overdueTasks.length === 0) {
      alert('目前沒有逾期任務');
      return;
    }

    setIsSendingReminders(true);
    let sentCount = 0;

    for (const task of overdueTasks) {
      const success = await sendSingleReminder(task, true);
      if (success) sentCount++;
    }

    setIsSendingReminders(false);
    alert(`已發送 ${sentCount} 封催繳信！`);
    // After manual mass send, update auto-check timestamp to avoid redundant triggers
    dataService.updateConfig({ lastAutoReminderSentAt: Date.now() });
  };

  // Automated Daily Check
  useEffect(() => {
    if (currentUser.role === 'MANAGER' && config && tasks.length > 0) {
      const lastCheck = config.lastAutoReminderSentAt || 0;
      const todayStart = new Date().setHours(0, 0, 0, 0);

      if (lastCheck < todayStart) {
        const overdueTasks = tasks.filter(t => dataService.checkMissedReports(t));
        if (overdueTasks.length > 0) {
          console.log("Running daily automated reminders...");
          handleSendReminders();
        } else {
          // Even if no overdue, update flag to avoid checking every mount today
          dataService.updateConfig({ lastAutoReminderSentAt: Date.now() });
        }
      }
    }
  }, [config, currentUser, tasks]);

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

  // Workload by User (Stacked Bar Chart with Hours)
  const workloadData = useMemo(() => {
    const userStats: Record<string, { name: string; estimated: number; actual: number; taskCount: number }> = {};

    // Initialize all users
    users.forEach(u => {
      userStats[u.id] = { name: u.name, estimated: 0, actual: 0, taskCount: 0 };
    });

    tasks.forEach(task => {
      if (task.assigneeType === 'USER' && userStats[task.assigneeId]) {
        const stats = userStats[task.assigneeId];
        stats.estimated += task.estimatedDuration || 0;
        stats.taskCount++;

        // Sum actual hours from logs
        const actual = task.logs.reduce((sum, log) => sum + (log.hoursSpent || 0), 0);
        stats.actual += actual;
      }
      // For Groups, we skip or could split (simplified for now to just show Users)
    });

    return Object.values(userStats).filter(s => s.taskCount > 0);
  }, [tasks, users]);


  const overdueTasksCount = missedReportsData.reduce((acc, cur) => acc + cur.count, 0);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleDeleteTask = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation(); // Prevent row click
    if (confirm('確定要刪除此任務嗎？此動作無法復原。')) {
      try {
        await dataService.deleteTask(taskId);
      } catch (error) {
        console.error('Delete failed', error);
        alert('刪除失敗');
      }
    }
  };

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
            <h3 className="text-gray-500 text-sm">回報逾期</h3>
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

        {/* Task List Preview (With Bulk Delete) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2 overflow-y-auto max-h-[400px] relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">近期任務概覽</h3>
            {selectedTaskIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow hover:bg-red-700 transition flex items-center"
              >
                <Trash2 size={16} className="mr-1" />
                刪除 ({selectedTaskIds.size})
              </button>
            )}
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 rounded-l-lg w-10">
                  <input
                    type="checkbox"
                    checked={tasks.length > 0 && selectedTaskIds.size === tasks.length}
                    onChange={e => {
                      if (e.target.checked) setSelectTaskIds(new Set(tasks.map(t => t.id)));
                      else setSelectTaskIds(new Set());
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3">任務名稱</th>
                <th className="px-4 py-3">負責人/組</th>
                <th className="px-4 py-3">截止日</th>
                <th className="px-4 py-3">進度</th>
                <th className="px-4 py-3 rounded-r-lg">狀態</th>
                <th className="px-4 py-3">操作</th>
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
                    className="border-b last:border-0 hover:bg-gray-50 transition-colors cursor-pointer group">
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.has(task.id)}
                        onChange={() => toggleSelectTask(task.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      <div>{task.title}</div>
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="text-[10px] text-gray-400 flex items-center mt-0.5">
                          <CheckCircle2 size={10} className="mr-1" />
                          子任務: {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{assigneeName}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(task.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${task.status === TaskStatus.COMPLETED ? 'bg-green-500' :
                            task.status === TaskStatus.BLOCKED ? 'bg-red-500' :
                              task.progress >= 100 ? 'bg-green-500' : 'bg-blue-600'
                            }`}
                          style={{ width: `${task.progress}%` }}
                        ></div>
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
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => handleDeleteTask(e, task.id)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition opacity-0 group-hover:opacity-100"
                        title="刪除任務"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Workload Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">人員工作量統計 (Hours by User)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workloadData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="estimated" name="預估總工時" fill="#9CA3AF" barSize={30} />
              <Bar dataKey="actual" name="實際總工時" fill="#3B82F6" barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* Missed Reports Trend */}
      {overdueTasksCount > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <div>
              <h3 className="text-lg font-bold text-red-600 flex items-center">
                <AlertCircle size={20} className="mr-2" /> 未回報/逾期趨勢
              </h3>
              <span className="text-sm text-gray-500">統計目前所有逾期未更新進度的任務</span>
            </div>
            <button
              onClick={handleSendReminders}
              disabled={isSendingReminders}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-red-700 transition flex items-center disabled:opacity-50"
            >
              {isSendingReminders ? <Loader2 className="animate-spin mr-2" size={18} /> : <Mail size={18} className="mr-2" />}
              一鍵發送催繳信 (Email)
            </button>
          </div>
          <div className="space-y-3">
            {tasks.filter(t => dataService.checkMissedReports(t)).map(task => {
              const assigneeName = task.assigneeType === 'USER'
                ? users.find(u => u.id === task.assigneeId)?.name
                : groups.find(g => g.id === task.assigneeId)?.name;

              return (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{task.title}</span>
                      {task.lastReminderSentAt && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded flex items-center">
                          最後催繳: {new Date(task.lastReminderSentAt).toLocaleString()}
                        </span>
                      )}
                      {task.lastReportedAfterReminder && (
                        <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded flex items-center">
                          催繳後已回報
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      負責人: {users.find(u => u.id === task.assigneeId)?.name || '未知'} | 頻率: {task.reportingFrequency}
                    </p>
                  </div>
                  <button
                    onClick={() => sendSingleReminder(task)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="發送催繳信"
                  >
                    <Mail size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gantt Chart Component */}
      <GanttChart tasks={tasks} users={users} groups={groups} />
    </div>
  );
};
