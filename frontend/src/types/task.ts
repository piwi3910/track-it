// Task status types
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'in_review' | 'done';

// Task priority types
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Subtask interface
export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

// Recurrence types for tasks
export type RecurrencePattern = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

// Recurrence interface
export interface TaskRecurrence {
  pattern: RecurrencePattern;
  interval?: number; // Default is 1 (e.g., every 1 week)
  endDate?: string | null; // When recurrence should end
  daysOfWeek?: number[]; // For weekly: 0 (Sunday) to 6 (Saturday)
  dayOfMonth?: number; // For monthly (1-31)
  monthOfYear?: number; // For yearly (1-12)
}

// Time tracking session interface
export interface TimeTrackingSession {
  id: string;
  taskId: string;
  userId?: string;
  startTimestamp: string;
  endTimestamp: string;
  durationSeconds: number;
  notes?: string;
}

// Task interface
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  weight?: number; // Task weight (0-10)
  tags?: string[];
  dueDate?: string | null;
  startDate?: string | null; // Start date for multi-day tasks
  endDate?: string | null; // End date for multi-day tasks
  isMultiDay?: boolean; // Flag to indicate this is a multi-day task
  createdAt?: string;
  updatedAt?: string;
  assigneeId?: string | null;
  reporterId?: string | null;
  estimatedHours?: number;
  actualHours?: number;
  // Time tracking properties
  timeTrackingActive?: boolean; // Whether time tracking is currently active
  trackingTimeSeconds?: number; // Current tracking time in seconds
  startTrackedTimestamp?: string; // When the current tracking session started
  lastTrackedTimestamp?: string; // When the last tracking session ended
  lastSavedTimestamp?: string; // When the tracking data was last saved
  timeTrackingHistory?: TimeTrackingSession[]; // History of tracking sessions
  // Hierarchy and recurrence
  subtasks?: Subtask[];
  parentTaskId?: string | null; // For task hierarchy
  childTaskIds?: string[]; // For task hierarchy
  source?: 'app' | 'google' | 'import';
  isSubtask?: boolean; // Indicates if this is a subtask that appears as a separate task
  recurrence?: TaskRecurrence; // For recurring tasks
  isRecurrenceInstance?: boolean; // True if this is an instance of a recurring task
  originalTaskId?: string; // References original task if this is a recurrence instance
}

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: 'admin' | 'member' | 'guest';
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    defaultView?: 'dashboard' | 'kanban' | 'calendar' | 'backlog';
    notifications?: {
      email?: boolean;
      inApp?: boolean;
    };
  };
}

// Comment interface 
export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  text: string;
  createdAt: string;
  updatedAt?: string | null;
  mentions?: string[]; // User IDs mentioned in the comment
}

// Attachment interface
export interface Attachment {
  id: string;
  taskId: string;
  name: string;
  fileType: string;
  size: number;
  url: string;
  createdAt: string;
  thumbnailUrl?: string;
}

// Notification interface
export interface Notification {
  id: string;
  userId: string;
  type: 'assignment' | 'mention' | 'comment' | 'due_soon' | 'status_change';
  message: string;
  relatedTaskId?: string;
  relatedCommentId?: string;
  createdAt: string;
  read: boolean;
}

// Task Template interface
export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  priority: TaskPriority;
  tags?: string[];
  estimatedHours?: number;
  subtasks?: Subtask[];
  category?: string; // For grouping templates
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  isPublic?: boolean; // Whether the template is available to all users
  usageCount?: number; // How many times the template has been used
}

// Filter interface
export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeId?: string[];
  dueDate?: {
    from?: string;
    to?: string;
  };
  tags?: string[];
}

// Google integration types
export interface GoogleCalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  link: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  iconLink: string;
  thumbnailLink?: string;
}