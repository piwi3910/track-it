/**
 * Enum definitions and conversion utilities
 * These match the Prisma schema enums exactly
 */

// Database enums (uppercase, matching Prisma schema)
export type UserRole = 'ADMIN' | 'MEMBER' | 'GUEST';
export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'ARCHIVED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type NotificationType = 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'COMMENT_ADDED' | 'DUE_DATE_REMINDER' | 'MENTION' | 'SYSTEM';

// Frontend display enums (lowercase, for UI consistency)
export type FrontendTaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'archived';
export type FrontendTaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type FrontendUserRole = 'admin' | 'member' | 'guest';

// Conversion utilities for backend/frontend compatibility
export const convertStatusFromBackend = (status: TaskStatus): FrontendTaskStatus => {
  const statusMap: Record<TaskStatus, FrontendTaskStatus> = {
    'BACKLOG': 'backlog',
    'TODO': 'todo',
    'IN_PROGRESS': 'in_progress',
    'REVIEW': 'review',
    'DONE': 'done',
    'ARCHIVED': 'archived'
  };
  return statusMap[status];
};

export const convertStatusToBackend = (status: FrontendTaskStatus): TaskStatus => {
  const statusMap: Record<FrontendTaskStatus, TaskStatus> = {
    'backlog': 'BACKLOG',
    'todo': 'TODO',
    'in_progress': 'IN_PROGRESS',
    'review': 'REVIEW',
    'done': 'DONE',
    'archived': 'ARCHIVED'
  };
  return statusMap[status];
};

export const convertPriorityFromBackend = (priority: TaskPriority): FrontendTaskPriority => {
  const priorityMap: Record<TaskPriority, FrontendTaskPriority> = {
    'LOW': 'low',
    'MEDIUM': 'medium',
    'HIGH': 'high',
    'URGENT': 'urgent'
  };
  return priorityMap[priority];
};

export const convertPriorityToBackend = (priority: FrontendTaskPriority): TaskPriority => {
  const priorityMap: Record<FrontendTaskPriority, TaskPriority> = {
    'low': 'LOW',
    'medium': 'MEDIUM',
    'high': 'HIGH',
    'urgent': 'URGENT'
  };
  return priorityMap[priority];
};

export const convertRoleFromBackend = (role: UserRole): FrontendUserRole => {
  const roleMap: Record<UserRole, FrontendUserRole> = {
    'ADMIN': 'admin',
    'MEMBER': 'member',
    'GUEST': 'guest'
  };
  return roleMap[role];
};

export const convertRoleToBackend = (role: FrontendUserRole): UserRole => {
  const roleMap: Record<FrontendUserRole, UserRole> = {
    'admin': 'ADMIN',
    'member': 'MEMBER',
    'guest': 'GUEST'
  };
  return roleMap[role];
};

// Status display labels
export const getStatusLabel = (status: TaskStatus | FrontendTaskStatus): string => {
  const labels: Record<string, string> = {
    'BACKLOG': 'Backlog',
    'backlog': 'Backlog',
    'TODO': 'To Do',
    'todo': 'To Do',
    'IN_PROGRESS': 'In Progress',
    'in_progress': 'In Progress',
    'REVIEW': 'Review',
    'review': 'Review',
    'DONE': 'Done',
    'done': 'Done',
    'ARCHIVED': 'Archived',
    'archived': 'Archived'
  };
  return labels[status] || status;
};

// Priority display labels
export const getPriorityLabel = (priority: TaskPriority | FrontendTaskPriority): string => {
  const labels: Record<string, string> = {
    'LOW': 'Low',
    'low': 'Low',
    'MEDIUM': 'Medium',
    'medium': 'Medium',
    'HIGH': 'High',
    'high': 'High',
    'URGENT': 'Urgent',
    'urgent': 'Urgent'
  };
  return labels[priority] || priority;
};

// Role display labels
export const getRoleLabel = (role: UserRole | FrontendUserRole): string => {
  const labels: Record<string, string> = {
    'ADMIN': 'Admin',
    'admin': 'Admin',
    'MEMBER': 'Member',
    'member': 'Member',
    'GUEST': 'Guest',
    'guest': 'Guest'
  };
  return labels[role] || role;
};

// Status colors for UI
export const getStatusColor = (status: TaskStatus | FrontendTaskStatus): string => {
  const colors: Record<string, string> = {
    'BACKLOG': 'gray',
    'backlog': 'gray',
    'TODO': 'blue',
    'todo': 'blue',
    'IN_PROGRESS': 'yellow',
    'in_progress': 'yellow',
    'REVIEW': 'orange',
    'review': 'orange',
    'DONE': 'green',
    'done': 'green',
    'ARCHIVED': 'dark',
    'archived': 'dark'
  };
  return colors[status] || 'gray';
};

// Priority colors for UI
export const getPriorityColor = (priority: TaskPriority | FrontendTaskPriority): string => {
  const colors: Record<string, string> = {
    'LOW': 'green',
    'low': 'green',
    'MEDIUM': 'yellow',
    'medium': 'yellow',
    'HIGH': 'orange',
    'high': 'orange',
    'URGENT': 'red',
    'urgent': 'red'
  };
  return colors[priority] || 'gray';
};