import React, { useState, useEffect } from 'react';
import { LayoutDashboard, PlusCircle, Users, LogOut, Briefcase, UserCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TaskForm } from './components/TaskForm';
import { ExecutorView } from './components/ExecutorView';
import { ExecutorTaskList } from './components/ExecutorTaskList';
import { UserManagement } from './components/UserManagement';
import { dataService } from './services/dataService';
import { Task, User, Group } from './types';

// App Modes
type ViewMode = 'DASHBOARD' | 'CREATE_TASK' | 'USER_MANAGEMENT' | 'TASK_DETAIL';

// 1. Setup Screen (For first time use / empty system)
const SetupScreen = ({ onSetup }: { onSetup: (name: string, email: string, password: string) => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && password) onSetup(name, email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-blue-200">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">系統初始化</h1>
          <p className="text-gray-500 mt-2">歡迎使用 TaskFlow Pro。<br />系統偵測到尚無使用者，請建立第一個<b>管理員帳號</b>。</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">管理員姓名</label>
            <input
              required
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="例如: Admin User"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              required
              type="email"
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="admin@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center"
          >
            建立帳號並進入系統 <ArrowRight size={18} className="ml-2" />
          </button>
        </form>
      </div>
    </div>
  );
};

// 2. Login Component (Only shows if users exist)
const LoginScreen = ({ users, onLogin, pendingTaskId }: { users: User[], onLogin: (user: User) => void, pendingTaskId: string | null }) => {
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || '');
  const [inputPassword, setInputPassword] = useState('');

  // Update selection if users change
  useEffect(() => {
    if (users.length > 0 && !users.find(u => u.id === selectedUserId)) {
      setSelectedUserId(users[0].id);
    }
  }, [users]);

  const handleAttemptLogin = () => {
    const u = users.find(user => user.id === selectedUserId);
    if (u) {
      // If user has password, Verify it
      if (u.password && u.password !== inputPassword) {
        alert('密碼錯誤！');
        return;
      }
      // Backward compatibility: if no password set (legacy users), assume okay or prompt?
      // For security upgrade, we just allow login but maybe prompt to set password later.
      onLogin(u);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
            <Briefcase size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">TaskFlow Pro</h1>
          <p className="text-gray-500">任務分配與追蹤系統</p>
          {pendingTaskId && (
            <div className="mt-4 bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm border border-yellow-200">
              <strong>注意：</strong> 您正在嘗試存取特定任務。請登入以繼續。
            </div>
          )}
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">選擇登入身份</label>
          <div className="relative">
            <select
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.role === 'MANAGER' ? '主管' : '執行者'}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-3.5 pointer-events-none text-gray-500">
              <UserCircle2 size={20} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
            <input
              type="password"
              className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="請輸入密碼"
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAttemptLogin()}
            />
          </div>

          <button
            onClick={handleAttemptLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            登入系統
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Main App Component
export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // URL Param Handling
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  // Manager State
  const [view, setView] = useState<ViewMode>('DASHBOARD');

  // Executor State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // Load initial data and check URL
  useEffect(() => {
    refreshData();

    // Check for task ID in URL
    const params = new URLSearchParams(window.location.search);
    const tid = params.get('taskId');
    if (tid) {
      setPendingTaskId(tid);
    }
  }, []);

  const refreshData = () => {
    setTasks(dataService.getTasks());
    setUsers(dataService.getUsers());
    setGroups(dataService.getGroups());
  };

  const handleSetupAdmin = (name: string, email: string) => {
    const newAdmin: User = {
      id: `admin-${Date.now()}`,
      name: name,
      email: email,
      role: 'MANAGER'
    };
    dataService.addUser(newAdmin);
    refreshData();
    // Automatically login
    setCurrentUser(newAdmin);
    setView('USER_MANAGEMENT'); // Direct to user management to add employees
    alert(`歡迎 ${name}！系統已初始化。請先至「人員與群組」新增您的團隊成員。`);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);

    // Handle Pending Task Redirect
    if (pendingTaskId) {
      const task = dataService.getTaskById(pendingTaskId);
      if (task) {
        if (user.role === 'EXECUTOR') {
          // Validate assignment
          const isAssigned = task.assigneeType === 'USER' ? task.assigneeId === user.id :
            groups.find(g => g.id === task.assigneeId)?.memberIds.includes(user.id);

          if (isAssigned) {
            setSelectedTask(task);
            window.history.replaceState({}, '', window.location.pathname);
            setPendingTaskId(null);
            return;
          } else {
            alert('您沒有權限查看此任務，或任務非指派給您。');
          }
        } else {
          alert(`主管模式：已檢測到任務連結 (${task.title})，正在前往儀表板。`);
        }
      }
      window.history.replaceState({}, '', window.location.pathname);
      setPendingTaskId(null);
    }

    // Default Routing
    setView('DASHBOARD');
    setSelectedTask(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPendingTaskId(null);
    window.history.replaceState({}, '', window.location.pathname);
  };

  // Manager Actions
  const handleCreateTask = (task: Task) => {
    dataService.addTask(task);
    refreshData();
    // Do NOT reset view here, wait for modal in TaskForm to close
    // TaskForm handles onCancel which sets view to Dashboard
  };

  const handleUserAdd = (user: User) => {
    dataService.addUser(user);
    refreshData();
  };

  const handleUserUpdate = (user: User) => {
    dataService.updateUser(user);
    refreshData();
  };



  const handleUserDelete = (id: string) => {
    if (confirm('確定要刪除此使用者嗎？')) {
      dataService.deleteUser(id);
      refreshData();
      if (currentUser?.id === id) {
        handleLogout();
      }
    }
  };

  const handleGroupAdd = (group: Group) => {
    dataService.addGroup(group);
    refreshData();
  };

  const handleGroupDelete = (id: string) => {
    if (confirm('確定要刪除此群組嗎？')) {
      dataService.deleteGroup(id);
      refreshData();
    }
  };


  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setView('TASK_DETAIL');
  };

  // Executor Actions
  const handleTaskUpdate = (updatedTask: Task) => {
    dataService.updateTask(updatedTask);
    refreshData();
    setSelectedTask(updatedTask);
  };

  // --- Render Logic ---

  if (users.length === 0) {
    return <SetupScreen onSetup={handleSetupAdmin} />;
  }

  if (!currentUser) {
    return <LoginScreen users={users} onLogin={handleLogin} pendingTaskId={pendingTaskId} />;
  }

  if (currentUser.role === 'EXECUTOR') {
    if (selectedTask) {
      return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <ExecutorView
            task={selectedTask}
            onUpdateTask={handleTaskUpdate}
            onBack={() => setSelectedTask(null)}
          />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gray-50">
        <ExecutorTaskList
          currentUser={currentUser}
          tasks={dataService.getTasksForUser(currentUser.id)}
          groups={groups}
          onSelectTask={setSelectedTask}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  // MANAGER VIEW
  const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-6 py-4 transition-colors ${active ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
        }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl z-10 flex flex-col hidden md:flex fixed h-full">
        <div className="p-6 border-b flex items-center space-x-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Briefcase size={24} />
          </div>
          <span className="text-xl font-bold text-gray-800 tracking-tight">TaskFlow Pro</span>
        </div>

        <nav className="flex-1 py-6 space-y-2">
          <SidebarItem
            icon={LayoutDashboard}
            label="總覽儀表板"
            active={view === 'DASHBOARD'}
            onClick={() => setView('DASHBOARD')}
          />
          <SidebarItem
            icon={PlusCircle}
            label="分配新任務"
            active={view === 'CREATE_TASK'}
            onClick={() => setView('CREATE_TASK')}
          />
          <SidebarItem
            icon={Users}
            label="人員與群組"
            active={view === 'USER_MANAGEMENT'}
            onClick={() => setView('USER_MANAGEMENT')}
          />
        </nav>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <UserCircle2 size={24} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-800 truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500">主管權限</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-red-500 text-sm hover:text-red-700 transition"
          >
            <LogOut size={16} className="mr-2" /> 登出系統
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">

              {view === 'DASHBOARD' ? '專案進度總覽' :
                view === 'CREATE_TASK' ? '任務分配中心' :
                  view === 'USER_MANAGEMENT' ? '系統人員管理' : '任務詳細資訊'}
            </h1>

            <p className="text-gray-500 text-sm mt-1">
              {new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
          </div>
        </header>

        <div className="animate-fade-in-up">
          {view === 'DASHBOARD' && (
            <Dashboard tasks={tasks} users={users} groups={groups} onTaskClick={handleTaskClick} />
          )}
          {view === 'CREATE_TASK' && (
            <TaskForm
              users={users}
              groups={groups}
              onSubmit={handleCreateTask}
              onCancel={() => setView('DASHBOARD')}
            />
          )}
          {view === 'USER_MANAGEMENT' && (
            <UserManagement
              users={users}
              groups={groups}
              onAddUser={handleUserAdd}
              onUpdateUser={handleUserUpdate}
              onDeleteUser={handleUserDelete}
              onAddGroup={handleGroupAdd}
              onDeleteGroup={handleGroupDelete}
            />
          )}
          {view === 'TASK_DETAIL' && selectedTask && (
            <ExecutorView
              task={selectedTask}
              onUpdateTask={handleTaskUpdate}
              onBack={() => { setSelectedTask(null); setView('DASHBOARD'); }}
            />
          )}
        </div>
      </main>
    </div>
  );
}