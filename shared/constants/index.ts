/**
 * Shared constants used across the application
 */

// Time constants (in milliseconds)
export const TIME_CONSTANTS = {
  ONE_SECOND: 1000,
  FIVE_SECONDS: 5 * 1000,
  THIRTY_SECONDS: 30 * 1000,
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
} as const;

// Rate limiting constants
export const RATE_LIMIT = {
  WINDOW_MS: TIME_CONSTANTS.FIFTEEN_MINUTES,
  MAX_ATTEMPTS: 5,
  CLEANUP_INTERVAL_MS: TIME_CONSTANTS.FIVE_MINUTES,
} as const;

// File upload constants
export const FILE_UPLOAD = {
  MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  MAX_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
} as const;

// Task priority order (lower number = higher priority)
export const PRIORITY_ORDER = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
} as const;

// Task status order
export const STATUS_ORDER = {
  backlog: 0,
  todo: 1,
  in_progress: 2,
  review: 3,
  done: 4,
  archived: 5,
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// API versioning
export const API_VERSION = {
  CURRENT: 'v1',
  SUPPORTED: ['v1'],
} as const;

// UI Constants
export const UI = {
  TOAST_DURATION_MS: 3000,
  DEBOUNCE_MS: 300,
  THROTTLE_MS: 100,
  TRANSITION_DURATION_MS: 200,
} as const;

// Time tracking constants
export const TIME_TRACKING = {
  UPDATE_INTERVAL_MS: TIME_CONSTANTS.ONE_SECOND,
  SAVE_INTERVAL_MINUTES: 5,
  AUTO_STOP_AFTER_HOURS: 12,
} as const;

// Validation constants
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 100,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MAX_TASK_TITLE_LENGTH: 200,
  MAX_TASK_DESCRIPTION_LENGTH: 5000,
  MAX_COMMENT_LENGTH: 1000,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  SAVED: 'Changes saved successfully.',
  CREATED: 'Created successfully.',
  UPDATED: 'Updated successfully.',
  DELETED: 'Deleted successfully.',
  COPIED: 'Copied to clipboard.',
} as const;