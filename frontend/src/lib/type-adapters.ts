/**
 * Type adapters for converting between backend and frontend data formats
 * Simplified approach - use backend types directly with minimal conversion
 */

import { 
  Task, 
  TaskTemplate, 
  User, 
  Comment, 
  Attachment, 
  Notification,
  TaskStatus,
  TaskPriority,
  UserRole
} from '../../../shared/types';

// Simple array adapters
export const adaptTasksFromBackend = (backendTasks: unknown[]): Task[] => {
  return (backendTasks || []).map(task => adaptTaskFromBackend(task));
};

export const adaptTemplatesFromBackend = (backendTemplates: unknown[]): TaskTemplate[] => {
  return (backendTemplates || []).map(template => adaptTemplateFromBackend(template));
};

export const adaptNotificationsFromBackend = (backendNotifications: unknown[]): Notification[] => {
  return (backendNotifications || []).map(notification => adaptNotificationFromBackend(notification));
};

// Individual item adapters
export const adaptTaskFromBackend = (backendTask: unknown): Task => {
  const task = backendTask as Record<string, unknown>;
  return {
    ...task,
    tags: task.tags || [],
    timeTrackingActive: task.timeTrackingActive || false,
    trackingTimeSeconds: task.trackingTimeSeconds || 0,
    savedAsTemplate: task.savedAsTemplate || false,
    archived: task.archived || false,
  } as Task;
};

export const adaptTemplateFromBackend = (backendTemplate: unknown): TaskTemplate => {
  const template = backendTemplate as Record<string, unknown>;
  return {
    ...template,
    tags: template.tags || [],
    isPublic: template.isPublic !== false, // default to true
    usageCount: template.usageCount || 0,
  } as TaskTemplate;
};

export const adaptUserFromBackend = (backendUser: unknown): User => {
  const user = backendUser as Record<string, unknown>;
  return {
    ...user,
    googleConnected: !!(user.googleId || user.googleToken),
  } as User;
};

export const adaptCommentFromBackend = (backendComment: unknown): Comment => {
  const comment = backendComment as Record<string, unknown>;
  return {
    ...comment,
    author: comment.author ? adaptUserFromBackend(comment.author) : undefined,
    replies: comment.replies ? (comment.replies as unknown[]).map(adaptCommentFromBackend) : undefined,
  } as Comment;
};

export const adaptAttachmentFromBackend = (backendAttachment: unknown): Attachment => {
  const attachment = backendAttachment as Record<string, unknown>;
  return {
    ...attachment,
    // Add computed properties for frontend compatibility
    name: attachment.fileName || attachment.name,
    size: attachment.fileSize || attachment.size,
    url: attachment.filePath || attachment.url,
    createdAt: attachment.uploadedAt || attachment.createdAt,
  } as Attachment;
};

export const adaptNotificationFromBackend = (backendNotification: unknown): Notification => {
  const notification = backendNotification as Record<string, unknown>;
  return {
    ...notification,
    user: notification.user ? adaptUserFromBackend(notification.user) : undefined,
    // Map resource fields to legacy fields for compatibility
    relatedTaskId: notification.resourceType === 'task' ? notification.resourceId : notification.relatedTaskId,
    relatedCommentId: notification.resourceType === 'comment' ? notification.resourceId : notification.relatedCommentId,
  } as Notification;
};

// Generic API result adapter
export const adaptApiResult = <T>(data: unknown, adapter?: (item: unknown) => T): T | T[] | null => {
  if (!data) return null;
  
  if (Array.isArray(data)) {
    return adapter ? data.map(adapter) : data as T[];
  }
  
  return adapter ? adapter(data) : data as T;
};

// Status conversion utilities (for backward compatibility)
export const convertStatusFromString = (status: string): TaskStatus => {
  const upperStatus = status.toUpperCase();
  switch (upperStatus) {
    case 'BACKLOG': return 'BACKLOG';
    case 'TODO': return 'TODO';
    case 'IN_PROGRESS': return 'IN_PROGRESS';
    case 'REVIEW': return 'REVIEW';
    case 'DONE': return 'DONE';
    case 'ARCHIVED': return 'ARCHIVED';
    default: return 'TODO';
  }
};

export const convertPriorityFromString = (priority: string): TaskPriority => {
  const upperPriority = priority.toUpperCase();
  switch (upperPriority) {
    case 'LOW': return 'LOW';
    case 'MEDIUM': return 'MEDIUM';
    case 'HIGH': return 'HIGH';
    case 'URGENT': return 'URGENT';
    default: return 'MEDIUM';
  }
};

export const convertRoleFromString = (role: string): UserRole => {
  const upperRole = role.toUpperCase();
  switch (upperRole) {
    case 'ADMIN': return 'ADMIN';
    case 'MEMBER': return 'MEMBER';
    case 'GUEST': return 'GUEST';
    default: return 'MEMBER';
  }
};