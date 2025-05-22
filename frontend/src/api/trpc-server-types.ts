/**
 * This file contains type definitions for the tRPC server API.
 * It's used by the frontend to understand the backend API structure.
 *
 * This would typically be auto-generated from the backend using the tRPC
 * CLI, but for now we'll maintain it manually to match the backend API.
 */

// Re-export types from shared package
export type {
  AppRouter,
  RouterInputs,
  RouterOutputs,
  Task,
  TaskTemplate,
  User,
  Comment,
  Attachment,
  Notification,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  TaskStatus,
  TaskPriority,
  UserRole,
  Subtask
} from '@track-it/shared/types/trpc';