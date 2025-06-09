/**
 * Frontend task types - now using shared types as single source of truth
 * This file re-exports shared types for backward compatibility
 */

// Re-export all shared types
export * from '@track-it/shared/types';

// Legacy exports for backward compatibility
export type { 
  Task,
  User,
  Comment,
  Attachment,
  Notification,
  TaskTemplate,
  TaskStatus,
  TaskPriority,
  UserRole,
  TaskFilter,
  GoogleCalendarEvent,
  GoogleDriveFile
} from '@track-it/shared/types';