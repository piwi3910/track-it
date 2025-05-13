/**
 * tRPC v11 client for the frontend
 * This file provides a typesafe API client to interact with the backend
 */

import { trpc } from '@/utils/trpc';
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
      trpc.users.login.mutate({ email, password })
    );
  },
  
  register: async (name: string, email: string, password: string) => {
    return apiHandler(() => 
      trpc.users.register.mutate({
        name,
        email,
        password,
        passwordConfirm: password // Frontend validation should ensure these match
      })
    );
  },
  
  getCurrentUser: async () => {
    return apiHandler(() =>
      trpc.users.getCurrentUser.query()
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
      trpc.tasks.getAll.query()
    );
  },
  
  getById: async (id: string) => {
    return apiHandler(() => 
      trpc.tasks.getById.query({ id })
    );
  },
  
  getByStatus: async (status: string) => {
    return apiHandler(() =>
      trpc.tasks.getByStatus.query({ status })
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
      trpc.tasks.create.mutate(taskData)
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
      trpc.tasks.update.mutate({ id, data })
    );
  },
  
  delete: async (id: string) => {
    return apiHandler(() => 
      trpc.tasks.delete.mutate({ id })
    );
  },
  
  search: async (query: string) => {
    return apiHandler(() => 
      trpc.tasks.search.query({ query })
    );
  },
  
  saveAsTemplate: async (taskId: string, templateName: string, isPublic: boolean = true) => {
    return apiHandler(() =>
      trpc.tasks.saveAsTemplate.mutate({ taskId, templateName, isPublic })
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
      trpc.tasks.createFromTemplate.mutate({ templateId, taskData })
    );
  }
};

/**
 * Templates API helpers
 */
export const templates = {
  getAll: async () => {
    return apiHandler(() => 
      trpc.templates.getAll.query()
    );
  },
  
  getById: async (id: string) => {
    return apiHandler(() => 
      trpc.templates.getById.query({ id })
    );
  },
  
  getByCategory: async (category: string) => {
    return apiHandler(() => 
      trpc.templates.getByCategory.query({ category })
    );
  },
  
  getCategories: async () => {
    return apiHandler(() => 
      trpc.templates.getCategories.query()
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
      trpc.templates.create.mutate(templateData)
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
      trpc.templates.update.mutate({ id, data })
    );
  },
  
  delete: async (id: string) => {
    return apiHandler(() => 
      trpc.templates.delete.mutate({ id })
    );
  },
  
  search: async (query: string) => {
    return apiHandler(() => 
      trpc.templates.search.query({ query })
    );
  }
};

/**
 * Comments API helpers
 */
export const comments = {
  getByTaskId: async (taskId: string) => {
    return apiHandler(() => 
      trpc.comments.getByTaskId.query({ taskId })
    );
  },
  
  getCommentCount: async (taskId: string) => {
    return apiHandler(() => 
      trpc.comments.getCommentCount.query({ taskId })
    );
  },
  
  create: async (taskId: string, text: string) => {
    return apiHandler(() => 
      trpc.comments.create.mutate({ taskId, text })
    );
  },
  
  update: async (id: string, text: string) => {
    return apiHandler(() => 
      trpc.comments.update.mutate({ id, text })
    );
  },
  
  delete: async (id: string) => {
    return apiHandler(() => 
      trpc.comments.delete.mutate({ id })
    );
  }
};

/**
 * Attachments API helpers
 */
export const attachments = {
  getByTaskId: async (taskId: string) => {
    return apiHandler(() => 
      trpc.attachments.getByTaskId.query({ taskId })
    );
  },
  
  upload: async (taskId: string, file: { name: string, type: string, size: number }) => {
    return apiHandler(() => 
      trpc.attachments.upload.mutate({ taskId, file })
    );
  },
  
  delete: async (id: string) => {
    return apiHandler(() => 
      trpc.attachments.delete.mutate({ id })
    );
  }
};

/**
 * Analytics API helpers
 */
export const analytics = {
  getTasksCompletionStats: async (timeframe: 'week' | 'month' | 'year' = 'week') => {
    return apiHandler(() => 
      trpc.analytics.getTasksCompletionStats.query({ timeframe })
    );
  },
  
  getUserWorkload: async () => {
    return apiHandler(() => 
      trpc.analytics.getUserWorkload.query()
    );
  },
  
  getTasksByPriority: async () => {
    return apiHandler(() => 
      trpc.analytics.getTasksByPriority.query()
    );
  }
};

/**
 * Google Integration API helpers
 */
export const googleIntegration = {
  syncCalendar: async () => {
    return apiHandler(() => 
      trpc.googleIntegration.syncCalendar.mutate()
    );
  },
  
  importGoogleTasks: async () => {
    return apiHandler(() => 
      trpc.googleIntegration.importGoogleTasks.query()
    );
  },
  
  getGoogleDriveFiles: async () => {
    return apiHandler(() => 
      trpc.googleIntegration.getGoogleDriveFiles.query()
    );
  }
};

/**
 * Notifications API helpers
 */
export const notifications = {
  getAll: async () => {
    return apiHandler(() => 
      trpc.notifications.getAll.query()
    );
  },
  
  markAsRead: async (id: string) => {
    return apiHandler(() => 
      trpc.notifications.markAsRead.mutate({ id })
    );
  }
};