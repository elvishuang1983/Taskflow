export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED'
}

export enum ReportingFrequency {
  NONE = 'NONE',
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

// Kept for backward compatibility or different usage
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
  password?: string; // Optional for backward compatibility, but required for new flow
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
  managerReply?: string; // Manager's comment
  managerReplyAt?: number; // Timestamp of the reply
}

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
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
  reminderFrequency: ReminderFrequency; // Deprecated, replaced by reportingFrequency
  reportingFrequency: ReportingFrequency; // New field for reporting requirement
  lastReportedAt?: number; // Timestamp of last report
  missedReportCount?: number; // Counter for missed reports
  missedReportHistory?: { date: number; count: number }[]; // Trend data
  status: TaskStatus;
  progress: number; // 0 to 100
  logs: ProgressLog[];
  subtasks?: SubTask[];
}
