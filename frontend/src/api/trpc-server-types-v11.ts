/**
 * This file contains type definitions for the tRPC server API.
 * It's used by the frontend to understand the backend API structure.
 * 
 * Updated for tRPC v11 compatibility.
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

// Define the router type to match v11 structure
export type AppRouter = {
  tasks: {
    getAll: {
      _def: {
        query: () => Task[];
      };
    };
    getById: {
      _def: {
        input: [{ id: string }];
        query: () => Task | null;
      };
    };
    getByStatus: {
      _def: {
        input: [{ status: TaskStatus }];
        query: () => Task[];
      };
    };
    create: {
      _def: {
        input: [{
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
        }];
        mutation: () => Task;
      };
    };
    update: {
      _def: {
        input: [{
          id: string;
          data: Partial<Task>;
        }];
        mutation: () => Task;
      };
    };
    delete: {
      _def: {
        input: [{ id: string }];
        mutation: () => { success: boolean };
      };
    };
    search: {
      _def: {
        input: [{ query: string }];
        query: () => Task[];
      };
    };
    saveAsTemplate: {
      _def: {
        input: [{
          taskId: string;
          templateName: string;
          isPublic?: boolean;
        }];
        mutation: () => TaskTemplate;
      };
    };
  };
  templates: {
    getAll: {
      _def: {
        query: () => TaskTemplate[];
      };
    };
    getById: {
      _def: {
        input: [{ id: string }];
        query: () => TaskTemplate | null;
      };
    };
    getByCategory: {
      _def: {
        input: [{ category: string }];
        query: () => TaskTemplate[];
      };
    };
    getCategories: {
      _def: {
        query: () => string[];
      };
    };
    create: {
      _def: {
        input: [{
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
        }];
        mutation: () => TaskTemplate;
      };
    };
    update: {
      _def: {
        input: [{
          id: string;
          data: Partial<TaskTemplate>;
        }];
        mutation: () => TaskTemplate;
      };
    };
    delete: {
      _def: {
        input: [{ id: string }];
        mutation: () => { success: boolean };
      };
    };
    search: {
      _def: {
        input: [{ query: string }];
        query: () => TaskTemplate[];
      };
    };
  };
  users: {
    login: {
      _def: {
        input: [LoginRequest];
        mutation: () => LoginResponse;
      };
    };
    register: {
      _def: {
        input: [RegisterRequest];
        mutation: () => RegisterResponse;
      };
    };
    getCurrentUser: {
      _def: {
        query: () => User;
      };
    };
    updateProfile: {
      _def: {
        input: [{
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
        }];
        mutation: () => User;
      };
    };
    getAllUsers: {
      _def: {
        query: () => User[];
      };
    };
    updateUserRole: {
      _def: {
        input: [{
          userId: string;
          role: 'admin' | 'member' | 'guest';
        }];
        mutation: () => { id: string; name: string; role: string };
      };
    };
  };
  comments: {
    getByTaskId: {
      _def: {
        input: [{ taskId: string }];
        query: () => Comment[];
      };
    };
    getCommentCount: {
      _def: {
        input: [{ taskId: string }];
        query: () => number;
      };
    };
    create: {
      _def: {
        input: [{
          taskId: string;
          text: string;
        }];
        mutation: () => Comment;
      };
    };
    update: {
      _def: {
        input: [{
          id: string;
          text: string;
        }];
        mutation: () => Comment;
      };
    };
    delete: {
      _def: {
        input: [{ id: string }];
        mutation: () => { success: boolean };
      };
    };
  };
  attachments: {
    getByTaskId: {
      _def: {
        input: [{ taskId: string }];
        query: () => Attachment[];
      };
    };
    upload: {
      _def: {
        input: [{
          taskId: string;
          file: {
            name: string;
            type: string;
            size: number;
          };
        }];
        mutation: () => Attachment;
      };
    };
    delete: {
      _def: {
        input: [{ id: string }];
        mutation: () => { success: boolean };
      };
    };
  };
  analytics: {
    getTasksCompletionStats: {
      _def: {
        input: [{ timeframe: 'week' | 'month' | 'year' }];
        query: () => { date: string; completed: number }[];
      };
    };
    getUserWorkload: {
      _def: {
        query: () => { userId: string; taskCount: number }[];
      };
    };
    getTasksByPriority: {
      _def: {
        query: () => { priority: TaskPriority; count: number }[];
      };
    };
  };
  googleIntegration: {
    syncCalendar: {
      _def: {
        mutation: () => boolean;
      };
    };
    importGoogleTasks: {
      _def: {
        query: () => Task[];
      };
    };
    getGoogleDriveFiles: {
      _def: {
        query: () => { id: string; name: string; url: string }[];
      };
    };
  };
  notifications: {
    getAll: {
      _def: {
        query: () => Notification[];
      };
    };
    markAsRead: {
      _def: {
        input: [{ id: string }];
        mutation: () => { success: boolean };
      };
    };
  };
};

// Infer the input and output types for each procedure
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;