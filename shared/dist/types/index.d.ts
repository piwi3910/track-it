/**
 * Shared types between frontend and backend
 */
export * from './errors';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type UserRole = 'admin' | 'member' | 'guest';
export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}
export type RecurrencePattern = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
export interface TaskRecurrence {
    pattern: RecurrencePattern;
    interval?: number;
    endDate?: string | null;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    monthOfYear?: number;
}
export interface TimeTrackingSession {
    id: string;
    taskId: string;
    userId?: string;
    startTimestamp: string;
    endTimestamp: string;
    durationSeconds: number;
    notes?: string;
}
export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    weight?: number;
    tags?: string[];
    dueDate?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    isMultiDay?: boolean;
    createdAt?: string;
    updatedAt?: string;
    assigneeId?: string | null;
    reporterId?: string | null;
    estimatedHours?: number;
    actualHours?: number;
    timeTrackingActive?: boolean;
    trackingTimeSeconds?: number;
    startTrackedTimestamp?: string;
    lastTrackedTimestamp?: string;
    lastSavedTimestamp?: string;
    timeTrackingHistory?: TimeTrackingSession[];
    subtasks?: Subtask[];
    parentTaskId?: string | null;
    childTaskIds?: string[];
    source?: 'app' | 'google' | 'import';
    isSubtask?: boolean;
    recurrence?: TaskRecurrence;
    isRecurrenceInstance?: boolean;
    originalTaskId?: string;
}
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
export interface Comment {
    id: string;
    taskId: string;
    authorId: string;
    text: string;
    createdAt: string;
    updatedAt?: string | null;
    mentions?: string[];
}
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
export interface TaskTemplate {
    id: string;
    name: string;
    description?: string;
    priority: TaskPriority;
    tags?: string[];
    estimatedHours?: number;
    subtasks?: Subtask[];
    category?: string;
    createdAt: string;
    updatedAt?: string;
    createdBy?: string;
    isPublic?: boolean;
    usageCount?: number;
}
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
export interface TaskCompletionStatsInput {
    timeframe: 'week' | 'month' | 'year';
}
export interface NotificationMarkAsReadInput {
    id: string;
}
