/**
 * Shared types between frontend and backend
 */

// Task status types
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'in_review' | 'done';

// Task priority types
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// User roles
export type UserRole = 'admin' | 'member' | 'guest';

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
  role?: UserRole;
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

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface RegisterResponse {
  id: string;
  name: string;
  email: string;
}

// Input types for API procedures

// Task inputs
export interface TaskByIdInput {
  id: string;
}

export interface TasksByStatusInput {
  status: TaskStatus;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority: TaskPriority;
  tags?: string[];
  dueDate?: string | null;
  assigneeId?: string | null;
  estimatedHours?: number;
  subtasks?: Array<{
    title: string;
    completed: boolean;
  }>;
}

export interface TaskUpdateInput {
  id: string;
  data: Partial<Task>;
}

export interface TaskDeleteInput {
  id: string;
}

export interface TaskSearchInput {
  query: string;
}

// Template inputs
export interface TemplateByIdInput {
  id: string;
}

export interface TemplateByCategoryInput {
  category: string;
}

export interface TemplateCreateInput {
  name: string;
  description?: string;
  priority: TaskPriority;
  tags?: string[];
  estimatedHours?: number;
  subtasks?: Array<{
    title: string;
    completed: boolean;
  }>;
  category?: string;
  isPublic?: boolean;
}

export interface TemplateUpdateInput {
  id: string;
  data: Partial<TaskTemplate>;
}

export interface TemplateDeleteInput {
  id: string;
}

export interface TemplateSearchInput {
  query: string;
}

// Comment inputs
export interface CommentsByTaskIdInput {
  taskId: string;
}

export interface CommentCountByTaskIdInput {
  taskId: string;
}

export interface CommentCreateInput {
  taskId: string;
  text: string;
}

export interface CommentUpdateInput {
  id: string;
  text: string;
}

export interface CommentDeleteInput {
  id: string;
}

// Attachment inputs
export interface AttachmentsByTaskIdInput {
  taskId: string;
}

export interface AttachmentUploadInput {
  taskId: string;
  file: {
    name: string;
    type: string;
    size: number;
  };
}

export interface AttachmentDeleteInput {
  id: string;
}

// User inputs
export interface UserUpdateInput {
  name?: string;
  avatarUrl?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    defaultView?: 'dashboard' | 'kanban' | 'calendar' | 'backlog';
    notifications?: {
      email?: boolean;
      inApp?: boolean;
    };
  };
}

export interface UserRoleUpdateInput {
  userId: string;
  role: UserRole;
}

// Analytics inputs
export interface TaskCompletionStatsInput {
  timeframe: 'week' | 'month' | 'year';
}

// Notification inputs
export interface NotificationMarkAsReadInput {
  id: string;
}