import { Task, User, Group, TaskStatus, ReportingFrequency } from '../types';
import { db } from './firebaseConfig';
import {
  collection, doc, setDoc, deleteDoc, updateDoc,
  onSnapshot, query, where, getDocs, orderBy
} from 'firebase/firestore';

// Collection References
const USERS_COL = 'users';
const GROUPS_COL = 'groups';
const TASKS_COL = 'tasks';
const CONFIG_COL = 'system_config';

export interface SystemConfig {
  emailJsServiceId: string;
  emailJsTemplateId: string;
  emailJsPublicKey: string;
  systemBaseUrl?: string;
}

export const dataService = {
  // --- REAL-TIME SUBSCRIPTIONS ---

  subscribeToUsers: (callback: (users: User[]) => void) => {
    const q = query(collection(db, USERS_COL));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data() as User);
      callback(users);
    });
  },

  subscribeToGroups: (callback: (groups: Group[]) => void) => {
    const q = query(collection(db, GROUPS_COL));
    return onSnapshot(q, (snapshot) => {
      const groups = snapshot.docs.map(doc => doc.data() as Group);
      callback(groups);
    });
  },

  subscribeToTasks: (callback: (tasks: Task[]) => void) => {
    const q = query(collection(db, TASKS_COL), orderBy('dueDate', 'asc')); // Default sorting
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => doc.data() as Task);
      callback(tasks);
    });
  },

  subscribeToConfig: (callback: (config: SystemConfig) => void) => {
    return onSnapshot(doc(db, CONFIG_COL, 'main'), (doc) => {
      if (doc.exists()) {
        callback(doc.data() as SystemConfig);
      } else {
        callback({
          emailJsServiceId: '',
          emailJsTemplateId: '',
          emailJsPublicKey: '',
          systemBaseUrl: ''
        });
      }
    });
  },

  // --- ASYNC ACTIONS ---

  // Users
  addUser: async (user: User) => {
    await setDoc(doc(db, USERS_COL, user.id), user);
  },
  updateUser: async (user: User) => {
    await setDoc(doc(db, USERS_COL, user.id), user, { merge: true });
  },
  deleteUser: async (id: string) => {
    await deleteDoc(doc(db, USERS_COL, id));
  },

  // Groups
  addGroup: async (group: Group) => {
    await setDoc(doc(db, GROUPS_COL, group.id), group);
  },
  deleteGroup: async (id: string) => {
    await deleteDoc(doc(db, GROUPS_COL, id));
  },

  // Tasks
  addTask: async (task: Task) => {
    await setDoc(doc(db, TASKS_COL, task.id), task);
  },
  updateTask: async (task: Task) => {
    await setDoc(doc(db, TASKS_COL, task.id), task, { merge: true });
  },
  deleteTask: async (id: string) => {
    await deleteDoc(doc(db, TASKS_COL, id));
  },

  // Helpers (Logic mostly remains, but checking missed reports is pure logic)
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
  },

  // One-off fetch (if needed, though we prefer subscriptions)
  getTaskById: async (id: string): Promise<Task | undefined> => {
    // Implementation if really needed, but usually we filter from subscribed list app-side
    // blocking for now to avoid refactoring EVERYTHING at once
    return undefined;
  },

  saveConfig: async (config: SystemConfig) => {
    await setDoc(doc(db, CONFIG_COL, 'main'), config);
  }
};