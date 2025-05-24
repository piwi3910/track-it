/**
 * This file contains the types for the tRPC router.
 * It's shared between the frontend and backend to ensure type safety.
 */

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { TaskStatus, TaskPriority, convertPriorityFromBackend, convertStatusFromBackend } from './enums';

// Import the actual AppRouter type from backend
// Note: This creates a dependency from shared -> backend, which is acceptable for type-only imports
export type { AppRouter } from '../../backend/src/trpc';

// We'll use a conditional type to handle the AppRouter properly
// This allows the types to work even if the backend isn't built yet
type SafeAppRouter = import('../../backend/src/trpc').AppRouter;

// Utility types for inputs and outputs
export type RouterInputs = inferRouterInputs<SafeAppRouter>;
export type RouterOutputs = inferRouterOutputs<SafeAppRouter>;

// Re-export enums for convenience
export { TaskStatus, TaskPriority } from './enums';

// Common interfaces used across the application
export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assigneeId?: string | null;
  assignee?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt?: string | null;
  dueDate?: string | null;
  creatorId: string;
  assigneeId?: string | null;
  tags?: string[] | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  trackingTimeSeconds?: number | null;
  timeTrackingActive?: boolean;
  trackingStartTime?: string | null;
  creator?: User;
  assignee?: User | null;
  subtasks?: Subtask[];
  _count?: {
    subtasks: number;
    comments: number;
    attachments: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  preferences?: {
    theme?: string;
    defaultView?: string;
    notifications?: {
      email?: boolean;
      inApp?: boolean;
    };
  };
  googleConnected?: boolean;
  googleEmail?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string | null;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string | null;
  priority: TaskPriority;
  tags?: string[] | null;
  estimatedHours?: number | null;
  subtasks?: Subtask[];
  category?: string | null;
  createdAt: string;
  createdById?: string;
  createdBy?: User;
  isPublic: boolean;
  usageCount: number;
  updatedAt?: string;
  templateData?: unknown;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  updatedAt?: string | null;
  authorId: string;
  taskId: string;
  parentId?: string | null;
  author?: User;
  replies?: Comment[];
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  taskId: string;
  uploadedById: string;
  uploadedBy?: User;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  userId: string;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  relatedTaskId?: string | null;
  relatedTask?: Task | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  token: string;
  googleConnected?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface RegisterResponse {
  id: string;
  name: string;
  email: string;
}