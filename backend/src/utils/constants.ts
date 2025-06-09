/**
 * Application constants
 * Centralized definition of constants used across the application
 */

// Re-export from Prisma to ensure consistency
export { 
  TaskStatus, 
  TaskPriority, 
  UserRole, 
  NotificationType 
} from '@prisma/client';

// Helper constants for common values
export const DEFAULT_TASK_STATUS = 'todo';
export const DEFAULT_TASK_PRIORITY = 'medium';
export const DEFAULT_USER_ROLE = 'member';