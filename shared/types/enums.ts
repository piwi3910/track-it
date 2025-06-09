/**
 * Enum definitions for the Track-It application
 * All enums use lowercase values for consistency
 */

// Primary enum types (lowercase, matching updated Prisma schema)
export type UserRole = 'admin' | 'member' | 'guest';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationType = 'task_assigned' | 'task_updated' | 'comment_added' | 'due_date_reminder' | 'mention' | 'system';

// Status display labels
export const STATUS_LABELS: Record<TaskStatus, string> = {
  'backlog': 'Backlog',
  'todo': 'To Do',
  'in_progress': 'In Progress',
  'review': 'Review',
  'done': 'Done',
  'archived': 'Archived'
};

// Priority display labels
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  'low': 'Low',
  'medium': 'Medium',
  'high': 'High',
  'urgent': 'Urgent'
};

// Role display labels
export const ROLE_LABELS: Record<UserRole, string> = {
  'admin': 'Admin',
  'member': 'Member',
  'guest': 'Guest'
};

// Status colors for UI
export const STATUS_COLORS: Record<TaskStatus, string> = {
  'backlog': 'gray',
  'todo': 'blue',
  'in_progress': 'yellow',
  'review': 'orange',
  'done': 'green',
  'archived': 'dark'
};

// Priority colors for UI
export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  'low': 'green',
  'medium': 'yellow',
  'high': 'orange',
  'urgent': 'red'
};

// Export helper functions for labels and colors
export const getStatusLabel = (status: TaskStatus): string => STATUS_LABELS[status] || status;
export const getPriorityLabel = (priority: TaskPriority): string => PRIORITY_LABELS[priority] || priority;
export const getRoleLabel = (role: UserRole): string => ROLE_LABELS[role] || role;
export const getStatusColor = (status: TaskStatus): string => STATUS_COLORS[status] || 'gray';
export const getPriorityColor = (priority: TaskPriority): string => PRIORITY_COLORS[priority] || 'gray';