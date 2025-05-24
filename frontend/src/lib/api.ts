/**
 * Simplified API Client
 * Uses tRPC hooks and vanilla client for type-safe API calls
 */

import { trpcVanilla, authUtils } from './trpc';
import type { RouterInputs, RouterOutputs } from '@track-it/shared/types/trpc';

// Type-safe API result wrapper
export type ApiResult<T> = {
  data: T | null;
  error: string | null;
  success: boolean;
};

// Generic error handler for API calls
const handleApiError = (error: unknown): string => {
  if (error && typeof error === 'object') {
    // Handle tRPC errors
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    
    // Handle tRPC client errors with data
    if ('data' in error && error.data && typeof error.data === 'object') {
      const trpcError = error.data as { message?: string };
      if (trpcError.message) {
        return trpcError.message;
      }
    }
  }
  
  return 'An unexpected error occurred';
};

// Wrapper function for API calls
const apiCall = async <T>(
  fn: () => Promise<T>
): Promise<ApiResult<T>> => {
  try {
    const data = await fn();
    return { data, error: null, success: true };
  } catch (error) {
    console.error('API Error:', error);
    return { 
      data: null, 
      error: handleApiError(error), 
      success: false 
    };
  }
};

// Authentication API
export const authApi = {
  login: async (email: string, password: string): Promise<ApiResult<RouterOutputs['users']['login']>> => {
    const result = await apiCall(() => 
      trpcVanilla.users.login.mutate({ email, password })
    );
    
    // Save token on successful login
    if (result.success && result.data && 'token' in result.data) {
      authUtils.setToken((result.data as { token: string }).token);
    }
    
    return result;
  },

  register: async (
    name: string, 
    email: string, 
    password: string
  ): Promise<ApiResult<RouterOutputs['users']['register']>> => {
    return apiCall(() => 
      trpcVanilla.users.register.mutate({
        name,
        email,
        password,
        passwordConfirm: password,
      })
    );
  },

  getCurrentUser: async (): Promise<ApiResult<RouterOutputs['users']['getCurrentUser']>> => {
    return apiCall(() => trpcVanilla.users.getCurrentUser.query());
  },

  updateProfile: async (
    data: RouterInputs['users']['updateProfile']
  ): Promise<ApiResult<RouterOutputs['users']['updateProfile']>> => {
    return apiCall(() => trpcVanilla.users.updateProfile.mutate(data));
  },

  loginWithGoogle: async (idToken: string): Promise<ApiResult<RouterOutputs['users']['loginWithGoogle']>> => {
    const result = await apiCall(() => 
      trpcVanilla.users.loginWithGoogle.mutate({ idToken })
    );
    
    // Save token on successful login
    if (result.success && result.data && 'token' in result.data) {
      authUtils.setToken((result.data as { token: string }).token);
    }
    
    return result;
  },

  logout: () => {
    authUtils.clearToken();
  },

  isAuthenticated: () => authUtils.isAuthenticated(),
};

// Tasks API
export const tasksApi = {
  getAll: (): Promise<ApiResult<RouterOutputs['tasks']['getAll']>> => {
    return apiCall(() => trpcVanilla.tasks.getAll.query());
  },

  getById: (id: string): Promise<ApiResult<RouterOutputs['tasks']['getById']>> => {
    return apiCall(() => trpcVanilla.tasks.getById.query({ id }));
  },

  getByStatus: (status: string): Promise<ApiResult<RouterOutputs['tasks']['getByStatus']>> => {
    return apiCall(() => trpcVanilla.tasks.getByStatus.query({ status }));
  },

  create: (data: RouterInputs['tasks']['create']): Promise<ApiResult<RouterOutputs['tasks']['create']>> => {
    return apiCall(() => trpcVanilla.tasks.create.mutate(data));
  },

  update: (
    id: string, 
    data: RouterInputs['tasks']['update']['data']
  ): Promise<ApiResult<RouterOutputs['tasks']['update']>> => {
    return apiCall(() => trpcVanilla.tasks.update.mutate({ id, data }));
  },

  delete: (id: string): Promise<ApiResult<RouterOutputs['tasks']['delete']>> => {
    return apiCall(() => trpcVanilla.tasks.delete.mutate({ id }));
  },

  search: (query: string): Promise<ApiResult<RouterOutputs['tasks']['search']>> => {
    return apiCall(() => trpcVanilla.tasks.search.query({ query }));
  },
};

// Templates API
export const templatesApi = {
  getAll: (): Promise<ApiResult<RouterOutputs['templates']['getAll']>> => {
    return apiCall(() => trpcVanilla.templates.getAll.query());
  },

  getById: (id: string): Promise<ApiResult<RouterOutputs['templates']['getById']>> => {
    return apiCall(() => trpcVanilla.templates.getById.query({ id }));
  },

  create: (data: RouterInputs['templates']['create']): Promise<ApiResult<RouterOutputs['templates']['create']>> => {
    return apiCall(() => trpcVanilla.templates.create.mutate(data));
  },

  update: (
    id: string, 
    data: RouterInputs['templates']['update']['data']
  ): Promise<ApiResult<RouterOutputs['templates']['update']>> => {
    return apiCall(() => trpcVanilla.templates.update.mutate({ id, data }));
  },

  delete: (id: string): Promise<ApiResult<RouterOutputs['templates']['delete']>> => {
    return apiCall(() => trpcVanilla.templates.delete.mutate({ id }));
  },
};

// Comments API
export const commentsApi = {
  getByTaskId: (taskId: string): Promise<ApiResult<RouterOutputs['comments']['getByTaskId']>> => {
    return apiCall(() => trpcVanilla.comments.getByTaskId.query({ taskId }));
  },

  create: (
    taskId: string, 
    text: string, 
    parentId?: string
  ): Promise<ApiResult<RouterOutputs['comments']['create']>> => {
    return apiCall(() => trpcVanilla.comments.create.mutate({ taskId, text, parentId }));
  },

  update: (id: string, text: string): Promise<ApiResult<RouterOutputs['comments']['update']>> => {
    return apiCall(() => trpcVanilla.comments.update.mutate({ id, text }));
  },

  delete: (id: string): Promise<ApiResult<RouterOutputs['comments']['delete']>> => {
    return apiCall(() => trpcVanilla.comments.delete.mutate({ id }));
  },
};

// Export a unified API object
export const api = {
  auth: authApi,
  tasks: tasksApi,
  templates: templatesApi,
  comments: commentsApi,
};