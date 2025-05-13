/**
 * This file contains type definitions for the tRPC server API.
 * It's used by the frontend to understand the backend API structure.
 *
 * @ts-nocheck - Disable type checking for this file
 *
 * This would typically be auto-generated from the backend using the tRPC
 * CLI, but for now we'll maintain it manually to match the backend API.
 */

import type { inferRouterOutputs, inferRouterInputs } from '@trpc/server';
import type {
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
  TaskPriority
} from '@track-it/shared';

// Define the structure of the tRPC router on the backend
export interface AppRouter {
  tasks: {
    getAll: {
      input: void;
      output: Task[];
    };
    getById: {
      input: { id: string };
      output: Task | null;
    };
    getByStatus: {
      input: { status: TaskStatus };
      output: Task[];
    };
    create: {
      input: {
        title: string;
        description?: string;
        status?: TaskStatus;
        priority: TaskPriority;
        tags?: string[];
        dueDate?: string | null;
        assigneeId?: string | null;
        estimatedHours?: number;
        subtasks?: Array<{
          title: string;
          completed: boolean;
        }>;
      };
      output: Task;
    };
    update: {
      input: {
        id: string;
        data: Partial<Task>;
      };
      output: Task;
    };
    delete: {
      input: { id: string };
      output: { success: boolean };
    };
    search: {
      input: { query: string };
      output: Task[];
    };
    saveAsTemplate: {
      input: {
        taskId: string;
        templateName: string;
        isPublic?: boolean;
      };
      output: TaskTemplate;
    };
  };
  templates: {
    getAll: {
      input: void;
      output: TaskTemplate[];
    };
    getById: {
      input: { id: string };
      output: TaskTemplate | null;
    };
    getByCategory: {
      input: { category: string };
      output: TaskTemplate[];
    };
    getCategories: {
      input: void;
      output: string[];
    };
    create: {
      input: {
        name: string;
        description?: string;
        priority: TaskPriority;
        tags?: string[];
        estimatedHours?: number;
        subtasks?: Array<{
          title: string;
          completed: boolean;
        }>;
        category?: string;
        isPublic?: boolean;
      };
      output: TaskTemplate;
    };
    update: {
      input: {
        id: string;
        data: Partial<TaskTemplate>;
      };
      output: TaskTemplate;
    };
    delete: {
      input: { id: string };
      output: { success: boolean };
    };
    search: {
      input: { query: string };
      output: TaskTemplate[];
    };
  };
  users: {
    login: {
      input: LoginRequest;
      output: LoginResponse;
    };
    register: {
      input: RegisterRequest;
      output: RegisterResponse;
    };
    getCurrentUser: {
      input: void;
      output: User;
    };
    updateProfile: {
      input: {
        name?: string;
        avatarUrl?: string;
        preferences?: {
          theme?: 'light' | 'dark' | 'auto';
          defaultView?: 'dashboard' | 'kanban' | 'calendar' | 'backlog';
          notifications?: {
            email?: boolean;
            inApp?: boolean;
          };
        };
      };
      output: User;
    };
    getAllUsers: {
      input: void;
      output: User[];
    };
    updateUserRole: {
      input: {
        userId: string;
        role: 'admin' | 'member' | 'guest';
      };
      output: { id: string; name: string; role: string };
    };
  };
  comments: {
    getByTaskId: {
      input: { taskId: string };
      output: Comment[];
    };
    getCommentCount: {
      input: { taskId: string };
      output: number;
    };
    create: {
      input: {
        taskId: string;
        text: string;
      };
      output: Comment;
    };
    update: {
      input: {
        id: string;
        text: string;
      };
      output: Comment;
    };
    delete: {
      input: { id: string };
      output: { success: boolean };
    };
  };
  attachments: {
    getByTaskId: {
      input: { taskId: string };
      output: Attachment[];
    };
    upload: {
      input: {
        taskId: string;
        file: {
          name: string;
          type: string;
          size: number;
        };
      };
      output: Attachment;
    };
    delete: {
      input: { id: string };
      output: { success: boolean };
    };
  };
  analytics: {
    getTasksCompletionStats: {
      input: { timeframe: 'week' | 'month' | 'year' };
      output: { date: string; completed: number }[];
    };
    getUserWorkload: {
      input: void;
      output: { userId: string; taskCount: number }[];
    };
    getTasksByPriority: {
      input: void;
      output: { priority: TaskPriority; count: number }[];
    };
  };
  googleIntegration: {
    syncCalendar: {
      input: void;
      output: boolean;
    };
    importGoogleTasks: {
      input: void;
      output: Task[];
    };
    getGoogleDriveFiles: {
      input: void;
      output: { id: string; name: string; url: string }[];
    };
  };
  notifications: {
    getAll: {
      input: void;
      output: Notification[];
    };
    markAsRead: {
      input: { id: string };
      output: { success: boolean };
    };
  };
}

// Infer the input and output types for each procedure
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;