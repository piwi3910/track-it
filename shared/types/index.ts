/**
 * Shared types between frontend and backend
 * This is the single source of truth for all type definitions
 */

// Re-export error types
export * from './errors';
export * from './enums';

// User roles (matching Prisma schema)
export type UserRole = 'admin' | 'member' | 'guest';

// Task status types (matching Prisma schema)
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'archived';

// Task priority types (matching Prisma schema)
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Notification types (matching Prisma schema)
export type NotificationType = 'task_assigned' | 'task_updated' | 'comment_added' | 'due_date_reminder' | 'mention' | 'system';

// Subtask interface
export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assigneeId?: string | null;
  assignee?: User | null;
}

// Recurrence types for tasks (future feature)
export type RecurrencePattern = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

// Recurrence interface (future feature)
export interface TaskRecurrence {
  pattern: RecurrencePattern;
  interval?: number;
  endDate?: string | null;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  monthOfYear?: number;
}

// Time tracking session interface (future feature)
export interface TimeTrackingSession {
  id: string;
  taskId: string;
  userId?: string;
  startTimestamp: string;
  endTimestamp: string;
  durationSeconds: number;
  notes?: string;
}

// Task interface (matching Prisma schema)
export interface Task {
  id: string;
  taskNumber: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
  dueDate?: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  tags: string[];
  
  // Relations
  creatorId: string;
  creator?: User;
  assigneeId?: string | null;
  assignee?: User | null;
  parentId?: string | null;
  parent?: Task | null;
  subtasks?: Task[];
  
  // Time tracking (matching Prisma schema)
  timeTrackingActive: boolean;
  trackingStartTime?: string | null;
  trackingTimeSeconds: number;
  
  // Template and archive flags
  savedAsTemplate: boolean;
  archived: boolean;
  
  // Counts for UI
  _count?: {
    subtasks: number;
    comments: number;
    attachments: number;
  };
}

// User interface (matching Prisma schema)
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    defaultView?: 'dashboard' | 'kanban' | 'calendar' | 'backlog';
    notifications?: {
      email?: boolean;
      inApp?: boolean;
    };
  } | null;
  
  // Google integration
  googleId?: string | null;
  googleToken?: string | null;
  googleRefreshToken?: string | null;
  googleProfile?: any | null;
  googleConnected?: boolean;
}

// Comment interface (matching Prisma schema)
export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  taskId: string;
  authorId: string;
  author?: User;
  parentId?: string | null;
  parent?: Comment | null;
  replies?: Comment[];
}

// Attachment interface (matching Prisma schema)
export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
  uploadedAt: string;
  taskId: string;
  
  // Google Drive integration
  googleDriveId?: string | null;
  googleDriveUrl?: string | null;
  
  // Computed properties for frontend compatibility
  name?: string; // alias for fileName
  size?: number; // alias for fileSize
  url?: string; // computed from filePath
  createdAt?: string; // alias for uploadedAt
}

// Notification interface (matching Prisma schema)
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  userId: string;
  user?: User;
  resourceType?: string | null;
  resourceId?: string | null;
  
  // Computed properties for frontend compatibility
  relatedTaskId?: string | null;
  relatedCommentId?: string | null;
}

// Task Template interface (matching Prisma schema)
export interface TaskTemplate {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  priority: TaskPriority;
  estimatedHours?: number | null;
  tags: string[];
  isPublic: boolean;
  category?: string | null;
  templateData: any; // JSON data for template structure
  usageCount: number;
  
  // Future: creator relation
  createdById?: string;
  createdBy?: User;
}

// Google Calendar Event interface (matching Prisma schema)
export interface GoogleCalendarEvent {
  id: string;
  googleEventId: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  location?: string | null;
  meetingLink?: string | null;
  userId: string;
  taskId?: string | null;
  lastSynced: string;
  
  // Computed properties for frontend compatibility
  start?: string; // alias for startTime
  end?: string; // alias for endTime
  link?: string; // alias for meetingLink
}

// Google Drive File interface
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
  googleConnected?: boolean;
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
  data: Partial<Omit<Task, 'id' | 'taskNumber' | 'createdAt' | 'updatedAt' | 'creator' | 'assignee' | 'parent' | 'subtasks' | '_count'>>;
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
  data: Partial<Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'createdBy'>>;
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