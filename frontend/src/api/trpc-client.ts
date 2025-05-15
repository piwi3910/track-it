// @ts-nocheck - Disable type checking for this file
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
  apiCall: () => Promise<T>,
  options?: {
    retries?: number;
    retryDelay?: number;
    silentError?: boolean;
  }
): Promise<{ data: T | null; error: string | null }> => {
  // Default options
  const retries = options?.retries ?? 1; // Default to 1 retry
  const retryDelay = options?.retryDelay ?? 1000; // Default to 1 second
  const silentError = options?.silentError ?? false; // Default to showing errors
  
  let lastError: any = null;
  let attempts = 0;
  
  // Try the API call with retries
  while (attempts <= retries) {
    try {
      // If this isn't the first attempt, add a delay
      if (attempts > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
        if (!silentError) {
          console.log(`Retry attempt ${attempts}/${retries} for API call...`);
        }
      }
      
      attempts++;
      const data = await apiCall();
      return { data, error: null };
    } catch (error) {
      lastError = error;
      
      // If it's the last attempt or not a retriable error, exit retry loop
      const isRetriable = isRetriableError(error);
      if (attempts > retries || !isRetriable) {
        break;
      }
    }
  }
  
  // Handle the error after all retries have failed
  if (!silentError) {
    console.error('API Error after retries:', lastError);
  }
  
  let errorMessage = 'Unknown error occurred';
  let errorCode = 'UNKNOWN_ERROR';
  
  // Create a custom event to notify about API errors
  const event = new CustomEvent('api_error', { 
    detail: { 
      error: lastError, 
      timestamp: new Date().toISOString(),
      retriesAttempted: attempts - 1
    } 
  });
  window.dispatchEvent(event);

  if (lastError instanceof TRPCClientError) {
    // Check if the error is a connection error
    if (lastError.message.includes('fetch') || 
        lastError.message.includes('network') || 
        lastError.message.includes('Failed to fetch') ||
        lastError.message.includes('Unable to transform response from server') ||
        lastError.message.includes('aborted') ||
        lastError.message.includes('timeout')) {
      errorMessage = 'Cannot connect to the server. Please check that the backend is running.';
      errorCode = 'CONNECTION_ERROR';
      
      // Trigger API availability check
      const apiCheckEvent = new CustomEvent('check_api_availability');
      window.dispatchEvent(apiCheckEvent);
    }
    // Check if the error is an authentication error
    else if (lastError.message === 'UNAUTHORIZED' || 
             lastError.data?.code === 'UNAUTHORIZED' ||
             lastError.message.includes('unauthorized') ||
             lastError.message.includes('not authenticated')) {
      errorMessage = 'Authentication failed. Please log in again.';
      errorCode = 'AUTH_ERROR';
      
      // Clear token if it's an auth error
      localStorage.removeItem('token');
      
      // Dispatch auth error event
      const authEvent = new CustomEvent('auth_error');
      window.dispatchEvent(authEvent);
    } 
    // Server error
    else if (lastError.data?.httpStatus >= 500 || 
             lastError.message.includes('server error') ||
             lastError.message.includes('internal error')) {
      errorMessage = 'Server error occurred. Please try again later.';
      errorCode = 'SERVER_ERROR';
      
      // Trigger API availability check
      const apiCheckEvent = new CustomEvent('check_api_availability');
      window.dispatchEvent(apiCheckEvent);
    }
    // Other known TRPC errors
    else {
      errorMessage = lastError.message;
      errorCode = lastError.data?.code || 'TRPC_ERROR';
    }
  } else if (lastError instanceof DOMException && lastError.name === 'AbortError') {
    errorMessage = 'Request timed out. Please try again.';
    errorCode = 'TIMEOUT_ERROR';
    
    // Trigger API availability check
    const apiCheckEvent = new CustomEvent('check_api_availability');
    window.dispatchEvent(apiCheckEvent);
  } else if (lastError instanceof Error) {
    errorMessage = lastError.message;
    errorCode = 'JS_ERROR';
  }

  // Log structured error for debugging
  if (!silentError) {
    console.error(`API Error (${errorCode}):`, errorMessage);
  }
  
  return { 
    data: null, 
    error: errorMessage,
  };
};

/**
 * Determines if an error should trigger a retry
 */
function isRetriableError(error: any): boolean {
  // Network/connection errors should be retried
  if (error instanceof TRPCClientError) {
    // Network errors
    if (error.message.includes('fetch') || 
        error.message.includes('network') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('Unable to transform response from server')) {
      return true;
    }
    
    // Timeout errors
    if (error.message.includes('timeout') || 
        error.message.includes('aborted')) {
      return true;
    }
    
    // Server errors (5xx)
    if (error.data?.httpStatus >= 500) {
      return true;
    }
    
    // Rate limiting (429)
    if (error.data?.httpStatus === 429) {
      return true;
    }
  }
  
  // Timeout errors from AbortController
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }
  
  // Don't retry client errors, auth errors, etc.
  return false;
}

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