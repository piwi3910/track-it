/**
 * tRPC client for the frontend
 * This file provides a typesafe API client to interact with the backend
 */

import { trpcClient } from '@/utils/trpc';
import { TRPCClientError } from '@trpc/client';

/**
 * Error handling wrapper for tRPC API calls
 * This provides a consistent way to handle errors from API calls
 */
export const apiHandler = async <T>(
  apiCall: () => Promise<T>
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error) {
    console.error('API Error:', error);
    let errorMessage = 'Unknown error occurred';

    if (error instanceof TRPCClientError) {
      // Check if the error is an authentication error
      if (error.message === 'UNAUTHORIZED' || error.data?.code === 'UNAUTHORIZED') {
        // Clear token if it's an auth error
        localStorage.removeItem('token');
      }

      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return { data: null, error: errorMessage };
  }
};

/**
 * Authentication helpers
 */
export const auth = {
  login: async (email: string, password: string) => {
    return apiHandler(() => 
      trpcClient.users.login.mutate({ email, password })
    );
  },
  
  register: async (name: string, email: string, password: string) => {
    return apiHandler(() => 
      trpcClient.users.register.mutate({
        name,
        email,
        password,
        passwordConfirm: password // Frontend validation should ensure these match
      })
    );
  },
  
  getCurrentUser: async () => {
    return apiHandler(() =>
      trpcClient.users.getCurrentUser.query()
    );
  },
  
  logout: () => {
    localStorage.removeItem('token');
    // Additional cleanup if needed
  }
};

/**
 * Task API helpers
 */
export const tasks = {
  getAll: async () => {
    return apiHandler(() => 
      trpcClient.tasks.getAll.query()
    );
  },
  
  getById: async (id: string) => {
    return apiHandler(() => 
      trpcClient.tasks.getById.query({ id })
    );
  },
  
  getByStatus: async (status: string) => {
    return apiHandler(() =>
      trpcClient.tasks.getByStatus.query({ status })
    );
  },
  
  create: async (taskData: {
    title: string;
    description?: string;
    status?: string;
    priority: string;
    tags?: string[];
    dueDate?: string | null;
    assigneeId?: string | null;
    estimatedHours?: number;
    subtasks?: { title: string; completed: boolean }[];
  }) => {
    return apiHandler(() =>
      trpcClient.tasks.create.mutate(taskData)
    );
  },
  
  update: async (id: string, data: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    tags: string[];
    dueDate: string | null;
    assigneeId: string | null;
    estimatedHours: number;
    actualHours: number;
    subtasks: { id: string; title: string; completed: boolean }[];
    timeTrackingActive: boolean;
    trackingTimeSeconds: number;
  }>) => {
    return apiHandler(() =>
      trpcClient.tasks.update.mutate({ id, data })
    );
  },
  
  delete: async (id: string) => {
    return apiHandler(() => 
      trpcClient.tasks.delete.mutate({ id })
    );
  },
  
  search: async (query: string) => {
    return apiHandler(() => 
      trpcClient.tasks.search.query({ query })
    );
  },
  
  saveAsTemplate: async (taskId: string, templateName: string, isPublic: boolean = true) => {
    return apiHandler(() =>
      trpcClient.tasks.saveAsTemplate.mutate({ taskId, templateName, isPublic })
    );
  },

  createFromTemplate: async (templateId: string, taskData: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string | null;
    assigneeId: string | null;
  }>) => {
    return apiHandler(() =>
      trpcClient.tasks.createFromTemplate.mutate({ templateId, taskData })
    );
  }
};

/**
 * Templates API helpers
 */
export const templates = {
  getAll: async () => {
    return apiHandler(() => 
      trpcClient.templates.getAll.query()
    );
  },
  
  getById: async (id: string) => {
    return apiHandler(() => 
      trpcClient.templates.getById.query({ id })
    );
  },
  
  getByCategory: async (category: string) => {
    return apiHandler(() => 
      trpcClient.templates.getByCategory.query({ category })
    );
  },
  
  getCategories: async () => {
    return apiHandler(() => 
      trpcClient.templates.getCategories.query()
    );
  },
  
  create: async (templateData: {
    name: string;
    description?: string;
    priority: string;
    tags?: string[];
    estimatedHours?: number;
    subtasks?: { title: string; completed: boolean }[];
    category?: string;
    isPublic?: boolean;
  }) => {
    return apiHandler(() =>
      trpcClient.templates.create.mutate(templateData)
    );
  },
  
  update: async (id: string, data: Partial<{
    name: string;
    description: string;
    priority: string;
    tags: string[];
    estimatedHours: number;
    subtasks: { id: string; title: string; completed: boolean }[];
    category: string;
    isPublic: boolean;
  }>) => {
    return apiHandler(() =>
      trpcClient.templates.update.mutate({ id, data })
    );
  },
  
  delete: async (id: string) => {
    return apiHandler(() => 
      trpcClient.templates.delete.mutate({ id })
    );
  },
  
  search: async (query: string) => {
    return apiHandler(() => 
      trpcClient.templates.search.query({ query })
    );
  }
};

/**
 * Comments API helpers
 */
export const comments = {
  getByTaskId: async (taskId: string) => {
    return apiHandler(() => 
      trpcClient.comments.getByTaskId.query({ taskId })
    );
  },
  
  getCommentCount: async (taskId: string) => {
    return apiHandler(() => 
      trpcClient.comments.getCommentCount.query({ taskId })
    );
  },
  
  create: async (taskId: string, text: string) => {
    return apiHandler(() => 
      trpcClient.comments.create.mutate({ taskId, text })
    );
  },
  
  update: async (id: string, text: string) => {
    return apiHandler(() => 
      trpcClient.comments.update.mutate({ id, text })
    );
  },
  
  delete: async (id: string) => {
    return apiHandler(() => 
      trpcClient.comments.delete.mutate({ id })
    );
  }
};

/**
 * Attachments API helpers
 */
export const attachments = {
  getByTaskId: async (taskId: string) => {
    return apiHandler(() => 
      trpcClient.attachments.getByTaskId.query({ taskId })
    );
  },
  
  upload: async (taskId: string, file: { name: string, type: string, size: number }) => {
    return apiHandler(() => 
      trpcClient.attachments.upload.mutate({ taskId, file })
    );
  },
  
  delete: async (id: string) => {
    return apiHandler(() => 
      trpcClient.attachments.delete.mutate({ id })
    );
  }
};

/**
 * Analytics API helpers
 */
export const analytics = {
  getTasksCompletionStats: async (timeframe: 'week' | 'month' | 'year' = 'week') => {
    return apiHandler(() => 
      trpcClient.analytics.getTasksCompletionStats.query({ timeframe })
    );
  },
  
  getUserWorkload: async () => {
    return apiHandler(() => 
      trpcClient.analytics.getUserWorkload.query()
    );
  },
  
  getTasksByPriority: async () => {
    return apiHandler(() => 
      trpcClient.analytics.getTasksByPriority.query()
    );
  }
};

/**
 * Google Integration API helpers
 */
export const googleIntegration = {
  syncCalendar: async () => {
    return apiHandler(() => 
      trpcClient.googleIntegration.syncCalendar.mutate()
    );
  },
  
  importGoogleTasks: async () => {
    return apiHandler(() => 
      trpcClient.googleIntegration.importGoogleTasks.query()
    );
  },
  
  getGoogleDriveFiles: async () => {
    return apiHandler(() => 
      trpcClient.googleIntegration.getGoogleDriveFiles.query()
    );
  }
};

/**
 * Notifications API helpers
 */
export const notifications = {
  getAll: async () => {
    return apiHandler(() => 
      trpcClient.notifications.getAll.query()
    );
  },
  
  markAsRead: async (id: string) => {
    return apiHandler(() => 
      trpcClient.notifications.markAsRead.mutate({ id })
    );
  }
};