/**
 * Application constants
 * Centralized definition of constants used across the application
 */

/**
 * Task status values
 * These are used in the frontend, API, and database
 * 
 * IMPORTANT: These MUST match the enum values in the Prisma schema,
 * but be in lowercase snake_case format for consistent API usage
 */
export const TASK_STATUS = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'blocked',
  IN_REVIEW: 'in_review',
  DONE: 'done',
  ARCHIVED: 'archived'
} as const;

// Create a type from the values
export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

/**
 * Task priority values
 * Used in frontend, API, and database
 */
export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

// Create a type from the values
export type TaskPriority = typeof TASK_PRIORITY[keyof typeof TASK_PRIORITY];

/**
 * User role values
 * Used in frontend, API, and database
 */
export const USER_ROLE = {
  ADMIN: 'admin',
  MEMBER: 'member',
  GUEST: 'guest'
} as const;

// Create a type from the values
export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];

/**
 * Notification type values
 * Used in frontend, API, and database
 */
export const NOTIFICATION_TYPE = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_UPDATED: 'task_updated',
  COMMENT_ADDED: 'comment_added',
  DUE_DATE_REMINDER: 'due_date_reminder',
  MENTION: 'mention',
  SYSTEM: 'system'
} as const;

// Create a type from the values
export type NotificationType = typeof NOTIFICATION_TYPE[keyof typeof NOTIFICATION_TYPE];

/**
 * Helper function to convert database enum values to API format
 * This ensures consistent casing in the API regardless of how it's stored in the database
 * 
 * @param dbValue The enum value from the database (typically uppercase)
 * @returns The API-friendly version of the value (lowercase snake_case)
 */
export function formatEnumForApi(dbValue: string): string {
  // Convert to lowercase
  return dbValue.toLowerCase();
}

/**
 * Helper function to convert API values to database enum format
 * This ensures the values stored in the database match the Prisma schema enum definitions
 * 
 * @param apiValue The value from the API (typically lowercase snake_case)
 * @returns The database-friendly version of the value (uppercase)
 */
export function formatEnumForDb(apiValue: string): string {
  // Convert to uppercase and replace underscores with nothing (TASK_STATUS.IN_PROGRESS -> IN_PROGRESS)
  return apiValue.toUpperCase();
}