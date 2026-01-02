export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED'
}

export enum ReminderFrequency {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'MANAGER' | 'EXECUTOR';
  avatar?: string;
}

export interface Group {
  id: string;
  name: string;
  memberIds: string[];
}

export interface ProgressLog {
  id: string;
  timestamp: number;
  hoursSpent: number;
  comment: string;
  attachmentName?: string;
  attachmentData?: string; // Base64 string for local storage persistence
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string; // Can be User ID or Group ID
  assigneeType: 'USER' | 'GROUP';
  startDate: number;
  dueDate: number;
  estimatedDuration: number; // in hours
  reminderFrequency: ReminderFrequency;
  status: TaskStatus;
  progress: number; // 0 to 100
  logs: ProgressLog[];
}
