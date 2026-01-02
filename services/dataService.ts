import { Task, User, Group, TaskStatus, ReminderFrequency } from '../types';

// Changed keys to ensure a fresh start for the "Real" version
const TASKS_KEY = 'taskflow_tasks_prod';
const USERS_KEY = 'taskflow_users_prod';
const GROUPS_KEY = 'taskflow_groups_prod';
const CONFIG_KEY = 'taskflow_config_prod';

export interface SystemConfig {
  emailJsServiceId: string; // Kept for backward compatibility if needed later
  emailJsTemplateId: string;
  emailJsPublicKey: string;
  systemBaseUrl?: string;   // New: Persist the deployed URL (e.g., Vercel or Google Sites)
}

// Helpers
const getStorage = <T>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);
  // In production, we default to the empty initial state provided
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
};

const setStorage = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const dataService = {
  // Config
  getConfig: (): SystemConfig => getStorage(CONFIG_KEY, {
    emailJsServiceId: '',
    emailJsTemplateId: '',
    emailJsPublicKey: '',
    systemBaseUrl: ''
  }),
  saveConfig: (config: SystemConfig) => setStorage(CONFIG_KEY, config),

  // Users - Start EMPTY
  getUsers: (): User[] => getStorage(USERS_KEY, []),
  addUser: (user: User) => {
    const users = getStorage<User[]>(USERS_KEY, []);
    setStorage(USERS_KEY, [...users, user]);
  },
  updateUser: (updatedUser: User) => {
    const users = getStorage<User[]>(USERS_KEY, []);
    const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setStorage(USERS_KEY, newUsers);
  },
  deleteUser: (id: string) => {
    const users = getStorage<User[]>(USERS_KEY, []);
    setStorage(USERS_KEY, users.filter(u => u.id !== id));
  },

  // Groups - Start EMPTY
  getGroups: (): Group[] => getStorage(GROUPS_KEY, []),
  addGroup: (group: Group) => {
    const groups = getStorage<Group[]>(GROUPS_KEY, []);
    setStorage(GROUPS_KEY, [...groups, group]);
  },
  deleteGroup: (id: string) => {
    const groups = getStorage<Group[]>(GROUPS_KEY, []);
    setStorage(GROUPS_KEY, groups.filter(g => g.id !== id));
  },

  // Tasks - Start EMPTY
  getTasks: (): Task[] => getStorage(TASKS_KEY, []),
  addTask: (task: Task) => {
    const tasks = getStorage<Task[]>(TASKS_KEY, []);
    setStorage(TASKS_KEY, [task, ...tasks]);
  },
  updateTask: (updatedTask: Task) => {
    const tasks = getStorage<Task[]>(TASKS_KEY, []);
    const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setStorage(TASKS_KEY, newTasks);
  },
  getTaskById: (id: string): Task | undefined => {
    return getStorage<Task[]>(TASKS_KEY, []).find(t => t.id === id);
  },

  // Helper to find tasks relevant to a specific user (assigned directly OR to their group)
  getTasksForUser: (userId: string): Task[] => {
    const allTasks = getStorage<Task[]>(TASKS_KEY, []);
    const allGroups = getStorage<Group[]>(GROUPS_KEY, []);

    // Find groups this user belongs to
    const userGroupIds = allGroups.filter(g => g.memberIds.includes(userId)).map(g => g.id);

    return allTasks.filter(task => {
      if (task.assigneeType === 'USER' && task.assigneeId === userId) return true;
      if (task.assigneeType === 'GROUP' && userGroupIds.includes(task.assigneeId)) return true;
      if (task.assigneeType === 'GROUP' && userGroupIds.includes(task.assigneeId)) return true;
      return false;
    });
  },

  // Helper: Check for missed reports
  checkMissedReports: (task: Task): boolean => {
    if (task.status === TaskStatus.COMPLETED || !task.reportingFrequency || task.reportingFrequency === 'NONE') return false;

    const now = Date.now();
    const lastReport = task.lastReportedAt || task.startDate;
    const diff = now - lastReport;

    const MS_PER_HOUR = 3600 * 1000;
    const MS_PER_DAY = 24 * MS_PER_HOUR;

    switch (task.reportingFrequency) {
      case 'HOURLY': return diff > MS_PER_HOUR;
      case 'DAILY': return diff > MS_PER_DAY;
      case 'WEEKLY': return diff > 7 * MS_PER_DAY;
      case 'MONTHLY': return diff > 30 * MS_PER_DAY;
      default: return false;
    }
  }
};