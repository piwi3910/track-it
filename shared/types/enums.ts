/**
 * Shared enum definitions for consistent typing across frontend and backend
 */

// Task Status Enum - Frontend format (lowercase with underscores)
export enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  IN_REVIEW = 'in_review',
  DONE = 'done',
  ARCHIVED = 'archived'
}

// Task Priority Enum - Frontend format (lowercase)
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Backend Priority Enum - Backend format (uppercase)
export enum BackendTaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// Backend Status Enum - Backend format (uppercase)
export enum BackendTaskStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  ARCHIVED = 'ARCHIVED'
}

// Notification Type Enum
export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  TASK_OVERDUE = 'task_overdue',
  COMMENT_ADDED = 'comment_added',
  SYSTEM = 'system'
}

// User Role Enum
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MANAGER = 'manager'
}

// Type conversion utilities
export const convertPriorityToBackend = (priority: TaskPriority): BackendTaskPriority => {
  const map: Record<TaskPriority, BackendTaskPriority> = {
    [TaskPriority.LOW]: BackendTaskPriority.LOW,
    [TaskPriority.MEDIUM]: BackendTaskPriority.MEDIUM,
    [TaskPriority.HIGH]: BackendTaskPriority.HIGH,
    [TaskPriority.URGENT]: BackendTaskPriority.URGENT,
  };
  return map[priority];
};

export const convertPriorityFromBackend = (priority: BackendTaskPriority | string): TaskPriority => {
  const map: Record<string, TaskPriority> = {
    'LOW': TaskPriority.LOW,
    'MEDIUM': TaskPriority.MEDIUM,
    'HIGH': TaskPriority.HIGH,
    'URGENT': TaskPriority.URGENT,
  };
  return map[priority] || TaskPriority.MEDIUM;
};

export const convertStatusToBackend = (status: TaskStatus): BackendTaskStatus => {
  const map: Record<TaskStatus, BackendTaskStatus> = {
    [TaskStatus.BACKLOG]: BackendTaskStatus.BACKLOG,
    [TaskStatus.TODO]: BackendTaskStatus.TODO,
    [TaskStatus.IN_PROGRESS]: BackendTaskStatus.IN_PROGRESS,
    [TaskStatus.BLOCKED]: BackendTaskStatus.TODO, // Backend doesn't have BLOCKED, map to TODO
    [TaskStatus.IN_REVIEW]: BackendTaskStatus.REVIEW,
    [TaskStatus.DONE]: BackendTaskStatus.DONE,
    [TaskStatus.ARCHIVED]: BackendTaskStatus.ARCHIVED,
  };
  return map[status];
};

export const convertStatusFromBackend = (status: BackendTaskStatus | string): TaskStatus => {
  const map: Record<string, TaskStatus> = {
    'BACKLOG': TaskStatus.BACKLOG,
    'TODO': TaskStatus.TODO,
    'IN_PROGRESS': TaskStatus.IN_PROGRESS,
    'REVIEW': TaskStatus.IN_REVIEW,
    'DONE': TaskStatus.DONE,
    'ARCHIVED': TaskStatus.ARCHIVED,
  };
  return map[status] || TaskStatus.TODO;
};

// Type guards
export const isValidTaskStatus = (status: string): status is TaskStatus => {
  return Object.values(TaskStatus).includes(status as TaskStatus);
};

export const isValidTaskPriority = (priority: string): priority is TaskPriority => {
  return Object.values(TaskPriority).includes(priority as TaskPriority);
};