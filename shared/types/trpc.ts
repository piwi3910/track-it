/**
 * This file contains the types for the tRPC router.
 * It's shared between the frontend and backend to ensure type safety.
 */

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

// Import the actual AppRouter type from backend
// Note: This creates a dependency from shared -> backend, which is acceptable for type-only imports
export type { AppRouter } from '../../backend/src/trpc';

// We'll use a conditional type to handle the AppRouter properly
// This allows the types to work even if the backend isn't built yet
type SafeAppRouter = import('../../backend/src/trpc').AppRouter;

// Utility types for inputs and outputs
export type RouterInputs = inferRouterInputs<SafeAppRouter>;
export type RouterOutputs = inferRouterOutputs<SafeAppRouter>;

// Re-export all types from the main shared types file
export * from './index';

// Ensure we're using the same enums everywhere
export type {
  TaskStatus,
  TaskPriority,
  UserRole,
  NotificationType,
  Task,
  User,
  TaskTemplate,
  Comment,
  Attachment,
  Notification,
  GoogleCalendarEvent,
  GoogleDriveFile,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse
} from './index';