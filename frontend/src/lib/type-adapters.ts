/**
 * Type adapters for converting between backend and frontend data formats
 */

import type { RouterOutputs } from '@track-it/shared/types/trpc';
import type { Task, TaskTemplate, Notification } from '@track-it/shared/types/trpc';
import { 
  convertPriorityFromBackend, 
  convertStatusFromBackend,
  TaskStatus,
  TaskPriority 
} from '@track-it/shared/types/enums';

// Type for backend task data (with optional properties)
type BackendTask = Record<string, unknown>;
type BackendTemplate = Record<string, unknown>;
type BackendNotification = Record<string, unknown>;

/**
 * Convert backend task data to frontend Task interface
 */
export const adaptTaskFromBackend = (backendTask: BackendTask): Task => {
  return {
    id: (backendTask.id as string) || '',
    title: (backendTask.title as string) || '',
    description: (backendTask.description as string) || null,
    status: backendTask.status ? convertStatusFromBackend(backendTask.status as string) : TaskStatus.TODO,
    priority: backendTask.priority ? convertPriorityFromBackend(backendTask.priority as string) : TaskPriority.MEDIUM,
    createdAt: (backendTask.createdAt as string) || new Date().toISOString(),
    updatedAt: (backendTask.updatedAt as string) || null,
    dueDate: (backendTask.dueDate as string) || null,
    creatorId: (backendTask.creatorId as string) || '',
    assigneeId: (backendTask.assigneeId as string) || null,
    tags: (backendTask.tags as string[]) || null,
    estimatedHours: (backendTask.estimatedHours as number) || null,
    actualHours: (backendTask.actualHours as number) || null,
    trackingTimeSeconds: (backendTask.trackingTimeSeconds as number) || null,
    timeTrackingActive: (backendTask.timeTrackingActive as boolean) || false,
    trackingStartTime: (backendTask.trackingStartTime as string) || null,
    creator: backendTask.creator as any,
    assignee: (backendTask.assignee as any) || null,
    subtasks: (backendTask.subtasks as any[]) || [],
    _count: backendTask._count as any
  };
};

/**
 * Convert array of backend tasks to frontend Task array
 */
export const adaptTasksFromBackend = (backendTasks: BackendTask[]): Task[] => {
  return backendTasks.map(adaptTaskFromBackend);
};

/**
 * Convert backend template data to frontend TaskTemplate interface
 */
export const adaptTemplateFromBackend = (backendTemplate: BackendTemplate): TaskTemplate => {
  return {
    id: (backendTemplate.id as string) || '',
    name: (backendTemplate.name as string) || '',
    description: (backendTemplate.description as string) || null,
    priority: backendTemplate.priority ? convertPriorityFromBackend(backendTemplate.priority as string) : TaskPriority.MEDIUM,
    tags: (backendTemplate.tags as string[]) || null,
    estimatedHours: (backendTemplate.estimatedHours as number) || null,
    subtasks: [], // Will be extracted from templateData if needed
    category: (backendTemplate.category as string) || null,
    createdAt: (backendTemplate.createdAt as string) || new Date().toISOString(),
    createdById: (backendTemplate.createdById as string) || undefined,
    createdBy: backendTemplate.createdBy as any,
    isPublic: (backendTemplate.isPublic as boolean) || false,
    usageCount: (backendTemplate.usageCount as number) || 0,
    updatedAt: (backendTemplate.updatedAt as string) || undefined,
    templateData: backendTemplate.templateData
  };
};

/**
 * Convert array of backend templates to frontend TaskTemplate array
 */
export const adaptTemplatesFromBackend = (backendTemplates: BackendTemplate[]): TaskTemplate[] => {
  return backendTemplates.map(adaptTemplateFromBackend);
};

/**
 * Convert backend notification data to frontend Notification interface
 */
export const adaptNotificationFromBackend = (backendNotification: BackendNotification): Notification => {
  return {
    id: (backendNotification.id as string) || '',
    type: (backendNotification.type as string) || '',
    title: (backendNotification.title as string) || '',
    message: (backendNotification.message as string) || '',
    read: (backendNotification.read as boolean) || false,
    createdAt: (backendNotification.createdAt as string) || new Date().toISOString(),
    userId: (backendNotification.userId as string) || '',
    relatedEntityId: (backendNotification.relatedEntityId as string) || null,
    relatedEntityType: (backendNotification.relatedEntityType as string) || null,
    relatedTaskId: (backendNotification.relatedEntityId as string) || null, // Map for backward compatibility
    relatedTask: null // Would need to be populated separately if needed
  };
};

/**
 * Convert array of backend notifications to frontend Notification array
 */
export const adaptNotificationsFromBackend = (backendNotifications: BackendNotification[]): Notification[] => {
  return backendNotifications.map(adaptNotificationFromBackend);
};

/**
 * Type-safe wrapper for API results with adaptation
 */
export type AdaptedApiResult<T> = {
  data: T | null;
  error: string | null;
  success: boolean;
};

/**
 * Generic adapter function for API results
 */
export const adaptApiResult = <TBackend, TFrontend>(
  result: { data: TBackend | null; error: string | null; success: boolean },
  adapter: (data: TBackend) => TFrontend
): AdaptedApiResult<TFrontend> => {
  if (!result.success || !result.data) {
    return {
      data: null,
      error: result.error,
      success: false
    };
  }

  try {
    return {
      data: adapter(result.data),
      error: null,
      success: true
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Adaptation failed',
      success: false
    };
  }
};

/**
 * Utility function to safely convert string to TaskStatus
 */
export const safeTaskStatus = (status: string | undefined): TaskStatus => {
  if (!status) return TaskStatus.TODO;
  
  // Handle both frontend and backend formats
  const statusMap: Record<string, TaskStatus> = {
    'todo': TaskStatus.TODO,
    'TODO': TaskStatus.TODO,
    'backlog': TaskStatus.BACKLOG,
    'BACKLOG': TaskStatus.BACKLOG,
    'in_progress': TaskStatus.IN_PROGRESS,
    'IN_PROGRESS': TaskStatus.IN_PROGRESS,
    'blocked': TaskStatus.BLOCKED,
    'BLOCKED': TaskStatus.BLOCKED,
    'in_review': TaskStatus.IN_REVIEW,
    'REVIEW': TaskStatus.IN_REVIEW,
    'done': TaskStatus.DONE,
    'DONE': TaskStatus.DONE,
    'archived': TaskStatus.ARCHIVED,
    'ARCHIVED': TaskStatus.ARCHIVED,
  };
  
  return statusMap[status] || TaskStatus.TODO;
};

/**
 * Utility function to safely convert string to TaskPriority
 */
export const safeTaskPriority = (priority: string | undefined): TaskPriority => {
  if (!priority) return TaskPriority.MEDIUM;
  
  // Handle both frontend and backend formats
  const priorityMap: Record<string, TaskPriority> = {
    'low': TaskPriority.LOW,
    'LOW': TaskPriority.LOW,
    'medium': TaskPriority.MEDIUM,
    'MEDIUM': TaskPriority.MEDIUM,
    'high': TaskPriority.HIGH,
    'HIGH': TaskPriority.HIGH,
    'urgent': TaskPriority.URGENT,
    'URGENT': TaskPriority.URGENT,
  };
  
  return priorityMap[priority] || TaskPriority.MEDIUM;
};