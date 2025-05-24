/**
 * API entry point
 * This file exports the new tRPC-based API client
 */

// Export the new tRPC client and utilities
export { trpc, trpcVanilla, authUtils } from '@/lib/trpc';

// Export types from the shared package for type consistency
export type { RouterInputs, RouterOutputs } from '@track-it/shared/types/trpc';

// Legacy API wrapper for backward compatibility during migration
// This will be removed once all components are migrated to tRPC hooks
import { trpcVanilla, authUtils } from '@/lib/trpc';
import type { RouterInputs, RouterOutputs, Task, TaskTemplate, Notification, User } from '@track-it/shared/types/trpc';
import {
  adaptTasksFromBackend,
  adaptTaskFromBackend,
  adaptTemplatesFromBackend,
  adaptTemplateFromBackend,
  adaptNotificationsFromBackend,
  adaptApiResult
} from '@/lib/type-adapters';
import { convertPriorityToBackend, convertStatusToBackend } from '@track-it/shared/types/enums';

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

// Legacy API object for backward compatibility
export const api = {
  auth: {
    login: async (email: string, password: string): Promise<ApiResult<RouterOutputs['users']['login']>> => {
      const result = await apiCall(() => 
        trpcVanilla.users.login.mutate({ email, password })
      );
      
      // Save token on successful login
      if (result.success && result.data && typeof result.data === 'object' && 'token' in result.data) {
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
      if (result.success && result.data && typeof result.data === 'object' && 'token' in result.data) {
        authUtils.setToken((result.data as { token: string }).token);
      }
      
      return result;
    },

    logout: () => {
      authUtils.clearToken();
    },

    verifyGoogleToken: async (_credential: string): Promise<ApiResult<{ user: User; token: string }>> => {
      console.warn('auth.verifyGoogleToken not implemented in backend');
      return { data: null, error: 'Not implemented', success: false };
    },

    isAuthenticated: () => authUtils.isAuthenticated(),
  },

  tasks: {
    getAll: async (): Promise<ApiResult<Task[]>> => {
      const result = await apiCall(() => trpcVanilla.tasks.getAll.query());
      return adaptApiResult(result, adaptTasksFromBackend);
    },

    getById: async (id: string): Promise<ApiResult<Task>> => {
      const result = await apiCall(() => trpcVanilla.tasks.getById.query({ id }));
      return adaptApiResult(result, adaptTaskFromBackend);
    },

    getByStatus: async (status: string): Promise<ApiResult<Task[]>> => {
      const result = await apiCall(() => trpcVanilla.tasks.getByStatus.query({ status }));
      return adaptApiResult(result, adaptTasksFromBackend);
    },

    create: async (data: Partial<Task>): Promise<ApiResult<Task>> => {
      // Filter and convert data to match backend schema
      const backendData: Record<string, unknown> = {};
      
      if (data.title) backendData.title = data.title;
      if (data.description) backendData.description = data.description;
      if (data.status) backendData.status = convertStatusToBackend(data.status);
      if (data.priority) backendData.priority = convertPriorityToBackend(data.priority);
      if (data.dueDate) backendData.dueDate = data.dueDate;
      if (data.assigneeId) backendData.assigneeId = data.assigneeId;
      if (data.tags) backendData.tags = data.tags;
      if (data.estimatedHours) backendData.estimatedHours = data.estimatedHours;
      if (data.subtasks) backendData.subtasks = data.subtasks;
      
      const result = await apiCall(() => trpcVanilla.tasks.create.mutate(backendData));
      return adaptApiResult(result, adaptTaskFromBackend);
    },

    update: async (
      id: string,
      data: Partial<Task>
    ): Promise<ApiResult<Task>> => {
      // Filter and convert data to match backend schema
      const backendData: Record<string, unknown> = {};
      
      if (data.title !== undefined) backendData.title = data.title;
      if (data.description !== undefined) backendData.description = data.description;
      if (data.status !== undefined) backendData.status = convertStatusToBackend(data.status);
      if (data.priority !== undefined) backendData.priority = convertPriorityToBackend(data.priority);
      if (data.dueDate !== undefined) backendData.dueDate = data.dueDate;
      if (data.assigneeId !== undefined) backendData.assigneeId = data.assigneeId;
      if (data.tags !== undefined) backendData.tags = data.tags;
      if (data.estimatedHours !== undefined) backendData.estimatedHours = data.estimatedHours;
      if (data.actualHours !== undefined) backendData.actualHours = data.actualHours;
      if (data.trackingTimeSeconds !== undefined) backendData.trackingTimeSeconds = data.trackingTimeSeconds;
      if (data.timeTrackingActive !== undefined) backendData.timeTrackingActive = data.timeTrackingActive;
      if (data.subtasks !== undefined) backendData.subtasks = data.subtasks;
      
      const result = await apiCall(() => trpcVanilla.tasks.update.mutate({ id, data: backendData }));
      return adaptApiResult(result, adaptTaskFromBackend);
    },

    delete: async (id: string): Promise<ApiResult<{ success: boolean }>> => {
      const result = await apiCall(() => trpcVanilla.tasks.delete.mutate({ id }));
      return {
        data: result.success ? { success: true } : null,
        error: result.error,
        success: result.success
      };
    },

    search: async (query: string): Promise<ApiResult<Task[]>> => {
      const result = await apiCall(() => trpcVanilla.tasks.search.query({ query }));
      return adaptApiResult(result, adaptTasksFromBackend);
    },

    // Additional task endpoints that exist in the backend
    saveAsTemplate: (
      taskId: string, 
      templateName: string, 
      isPublic: boolean
    ): Promise<ApiResult<RouterOutputs['tasks']['saveAsTemplate']>> => {
      return apiCall(() => trpcVanilla.tasks.saveAsTemplate.mutate({ taskId, templateName, isPublic }));
    },

    createFromTemplate: (
      templateId: string,
      taskData?: Record<string, unknown>
    ): Promise<ApiResult<RouterOutputs['tasks']['createFromTemplate']>> => {
      return apiCall(() => trpcVanilla.tasks.createFromTemplate.mutate({ templateId, taskData }));
    },

    // Legacy methods that don't exist in backend - will be handled via update
    updateStatus: async (id: string, status: string): Promise<ApiResult<RouterOutputs['tasks']['update']>> => {
      return apiCall(() => trpcVanilla.tasks.update.mutate({ id, data: { status: status as unknown as Task['status'] } }));
    },

    updateAssignee: async (id: string, assigneeId: string | null): Promise<ApiResult<RouterOutputs['tasks']['update']>> => {
      return apiCall(() => trpcVanilla.tasks.update.mutate({ id, data: { assigneeId } }));
    },

    startTimeTracking: async (id: string): Promise<ApiResult<RouterOutputs['tasks']['update']>> => {
      return apiCall(() => trpcVanilla.tasks.update.mutate({ 
        id, 
        data: { 
          timeTrackingActive: true,
          startTrackedTimestamp: new Date().toISOString()
        } 
      }));
    },

    stopTimeTracking: async (id: string): Promise<ApiResult<RouterOutputs['tasks']['update']>> => {
      return apiCall(() => trpcVanilla.tasks.update.mutate({ 
        id, 
        data: { 
          timeTrackingActive: false,
          lastTrackedTimestamp: new Date().toISOString()
        } 
      }));
    },
  },

  templates: {
    getAll: async (): Promise<ApiResult<TaskTemplate[]>> => {
      const result = await apiCall(() => trpcVanilla.templates.getAll.query());
      return adaptApiResult(result, adaptTemplatesFromBackend);
    },

    getById: async (id: string): Promise<ApiResult<TaskTemplate>> => {
      const result = await apiCall(() => trpcVanilla.templates.getById.query({ id }));
      return adaptApiResult(result, adaptTemplateFromBackend);
    },

    getByCategory: async (category: string): Promise<ApiResult<TaskTemplate[]>> => {
      const result = await apiCall(() => trpcVanilla.templates.getByCategory.query({ category }));
      return adaptApiResult(result, adaptTemplatesFromBackend);
    },

    getCategories: (): Promise<ApiResult<string[]>> => {
      return apiCall(() => trpcVanilla.templates.getCategories.query());
    },

    create: async (data: Partial<TaskTemplate>): Promise<ApiResult<TaskTemplate>> => {
      // Filter and convert data to match backend schema
      const backendData: Record<string, unknown> = {};
      
      if (data.name) backendData.name = data.name;
      if (data.description) backendData.description = data.description;
      if (data.priority) backendData.priority = convertPriorityToBackend(data.priority);
      if (data.tags) backendData.tags = data.tags;
      if (data.estimatedHours) backendData.estimatedHours = data.estimatedHours;
      if (data.subtasks) backendData.subtasks = data.subtasks;
      if (data.category) backendData.category = data.category;
      if (data.isPublic !== undefined) backendData.isPublic = data.isPublic;
      
      const result = await apiCall(() => trpcVanilla.templates.create.mutate(backendData));
      return adaptApiResult(result, adaptTemplateFromBackend);
    },

    update: async (
      id: string,
      data: Partial<TaskTemplate>
    ): Promise<ApiResult<TaskTemplate>> => {
      // Filter and convert data to match backend schema
      const backendData: Record<string, unknown> = {};
      
      if (data.name !== undefined) backendData.name = data.name;
      if (data.description !== undefined) backendData.description = data.description;
      if (data.priority !== undefined) backendData.priority = convertPriorityToBackend(data.priority);
      if (data.tags !== undefined) backendData.tags = data.tags;
      if (data.estimatedHours !== undefined) backendData.estimatedHours = data.estimatedHours;
      if (data.subtasks !== undefined) backendData.subtasks = data.subtasks;
      if (data.category !== undefined) backendData.category = data.category;
      if (data.isPublic !== undefined) backendData.isPublic = data.isPublic;
      
      const result = await apiCall(() => trpcVanilla.templates.update.mutate({ id, data: backendData }));
      return adaptApiResult(result, adaptTemplateFromBackend);
    },

    delete: async (id: string): Promise<ApiResult<{ success: boolean }>> => {
      const result = await apiCall(() => trpcVanilla.templates.delete.mutate({ id }));
      return {
        data: result.success ? { success: true } : null,
        error: result.error,
        success: result.success
      };
    },

    search: async (query: string): Promise<ApiResult<TaskTemplate[]>> => {
      const result = await apiCall(() => trpcVanilla.templates.search.query({ query }));
      return adaptApiResult(result, adaptTemplatesFromBackend);
    },
  },

  comments: {
    getByTaskId: (taskId: string): Promise<ApiResult<RouterOutputs['comments']['getByTaskId']>> => {
      return apiCall(() => trpcVanilla.comments.getByTaskId.query({ taskId }));
    },

    create: (
      taskId: string, 
      text: string, 
      parentId?: string
    ): Promise<ApiResult<RouterOutputs['comments']['create']>> => {
      return apiCall(() => trpcVanilla.comments.create.mutate({ taskId, text, ...(parentId && { parentId }) }));
    },

    update: (id: string, text: string): Promise<ApiResult<RouterOutputs['comments']['update']>> => {
      return apiCall(() => trpcVanilla.comments.update.mutate({ id, text }));
    },

    delete: (id: string): Promise<ApiResult<RouterOutputs['comments']['delete']>> => {
      return apiCall(() => trpcVanilla.comments.delete.mutate({ id }));
    },

    // Missing method that components expect
    getCommentCount: async (taskId: string): Promise<ApiResult<{ count: number }>> => {
      const result = await apiCall(() => trpcVanilla.comments.getByTaskId.query({ taskId }));
      const count = result.success && result.data ? (result.data as unknown[]).length : 0;
      return {
        data: { count },
        error: result.error,
        success: result.success
      };
    },
  },

  notifications: {
    getAll: async (): Promise<ApiResult<Notification[]>> => {
      const result = await apiCall(() => trpcVanilla.notifications.getAll.query());
      return adaptApiResult(result, adaptNotificationsFromBackend);
    },

    getUnreadCount: async (): Promise<ApiResult<{ count: number }>> => {
      const result = await apiCall(() => trpcVanilla.notifications.getUnreadCount.query());
      return {
        data: result.success && result.data ? { count: result.data.count || 0 } : null,
        error: result.error,
        success: result.success
      };
    },

    markAsRead: async (id: string): Promise<ApiResult<{ id: string; read: boolean }>> => {
      const result = await apiCall(() => trpcVanilla.notifications.markAsRead.mutate({ id }));
      return {
        data: result.success && result.data ? {
          id: result.data.id || id,
          read: result.data.read || true
        } : null,
        error: result.error,
        success: result.success
      };
    },

    markAllAsRead: async (): Promise<ApiResult<{ markedCount: number; success: boolean }>> => {
      const result = await apiCall(() => trpcVanilla.notifications.markAllAsRead.mutate());
      return {
        data: result.success && result.data ? {
          markedCount: result.data.markedCount || 0,
          success: result.data.success || true
        } : null,
        error: result.error,
        success: result.success
      };
    },

    // Legacy method - notifications router doesn't have delete, but we'll provide a stub
    delete: async (id: string): Promise<ApiResult<{ success: boolean }>> => {
      // For now, just mark as read since delete doesn't exist
      const result = await apiCall(() => trpcVanilla.notifications.markAsRead.mutate({ id }));
      return {
        data: result.success ? { success: true } : null,
        error: result.error,
        success: result.success
      };
    },
  },

  googleIntegration: {
    getGoogleAccountStatus: (): Promise<ApiResult<RouterOutputs['googleIntegration']['getGoogleAccountStatus']>> => {
      return apiCall(() => trpcVanilla.googleIntegration.getGoogleAccountStatus.query());
    },

    getConnectionStatus: (): Promise<ApiResult<RouterOutputs['googleIntegration']['getConnectionStatus']>> => {
      return apiCall(() => trpcVanilla.googleIntegration.getConnectionStatus.query());
    },

    getCalendarEvents: (): Promise<ApiResult<RouterOutputs['googleIntegration']['getCalendarEvents']>> => {
      return apiCall(() => trpcVanilla.googleIntegration.getCalendarEvents.query());
    },

    syncCalendar: (): Promise<ApiResult<RouterOutputs['googleIntegration']['syncCalendar']>> => {
      return apiCall(() => trpcVanilla.googleIntegration.syncCalendar.mutate());
    },

    importGoogleTasks: (): Promise<ApiResult<RouterOutputs['googleIntegration']['importGoogleTasks']>> => {
      return apiCall(() => trpcVanilla.googleIntegration.importGoogleTasks.query());
    },

    getGoogleDriveFiles: (): Promise<ApiResult<RouterOutputs['googleIntegration']['getGoogleDriveFiles']>> => {
      return apiCall(() => trpcVanilla.googleIntegration.getGoogleDriveFiles.query());
    },

    // Legacy methods that don't exist in backend - provide stubs
    linkGoogleAccount: async (authCode: string): Promise<ApiResult<{ success: boolean }>> => {
      // This would need to be implemented in the backend
      console.warn('linkGoogleAccount not implemented in backend', { authCode });
      return { data: { success: false }, error: 'Not implemented', success: false };
    },

    unlinkGoogleAccount: async (): Promise<ApiResult<{ success: boolean }>> => {
      // This would need to be implemented in the backend
      console.warn('unlinkGoogleAccount not implemented in backend');
      return { data: { success: false }, error: 'Not implemented', success: false };
    },
  },

  // Admin endpoints (stubs for missing functionality)
  admin: {
    getUsers: async (): Promise<ApiResult<User[]>> => {
      console.warn('admin.getUsers not implemented in backend');
      return { data: [], error: null, success: true };
    },

    getAllUsers: async (): Promise<ApiResult<User[]>> => {
      console.warn('admin.getAllUsers not implemented in backend');
      return { data: [], error: null, success: true };
    },

    createUser: async (userData: { name: string; email: string; password: string; role?: string }): Promise<ApiResult<User>> => {
      console.warn('admin.createUser not implemented in backend', { userData });
      return { data: null, error: 'Not implemented', success: false };
    },

    updateUser: async (userId: string, userData: Partial<User>): Promise<ApiResult<User>> => {
      console.warn('admin.updateUser not implemented in backend', { userId, userData });
      return { data: null, error: 'Not implemented', success: false };
    },

    deleteUser: async (userId: string): Promise<ApiResult<{ success: boolean }>> => {
      console.warn('admin.deleteUser not implemented in backend', { userId });
      return { data: { success: false }, error: 'Not implemented', success: false };
    },

    updateUserRole: async (userId: string, role: string): Promise<ApiResult<User>> => {
      console.warn('admin.updateUserRole not implemented in backend', { userId, role });
      return { data: null, error: 'Not implemented', success: false };
    },

    resetUserPassword: async (userId: string, _newPassword: string): Promise<ApiResult<{ success: boolean }>> => {
      console.warn('admin.resetUserPassword not implemented in backend', { userId });
      return { data: { success: false }, error: 'Not implemented', success: false };
    },

    getUserDeletionStats: async (_userId: string): Promise<ApiResult<{ tasksCount: number; templatesCount: number }>> => {
      // This would need to be implemented in backend - for now return mock data
      return { data: { tasksCount: 0, templatesCount: 0 }, error: null, success: true };
    }
  },

  // Attachments endpoints (stubs for missing functionality)
  attachments: {
    upload: async (taskId: string, file: File): Promise<ApiResult<{ id: string; url: string }>> => {
      console.warn('attachments.upload not implemented in backend', { taskId, fileName: file.name });
      return { data: null, error: 'Not implemented', success: false };
    },

    delete: async (attachmentId: string): Promise<ApiResult<{ success: boolean }>> => {
      console.warn('attachments.delete not implemented in backend', { attachmentId });
      return { data: { success: false }, error: 'Not implemented', success: false };
    },

    getByTaskId: async (taskId: string): Promise<ApiResult<Attachment[]>> => {
      console.warn('attachments.getByTaskId not implemented in backend', { taskId });
      return { data: [], error: null, success: true };
    },
  },
};

// Add missing types for completeness
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
}