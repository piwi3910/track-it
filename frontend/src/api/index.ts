/**
 * Modern API client using tRPC
 * Fixed to match actual backend router structure and handle types properly
 */

import { trpcVanilla, authUtils } from '@/lib/trpc';
import { 
  Task, 
  TaskTemplate, 
  User, 
  Comment, 
  Attachment, 
  Notification,
  TaskStatus,
  TaskPriority,
  UserRole,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse
} from '../../../shared/types';
import { logger } from '@/services/logger.service';

// Simple API call wrapper with proper error handling
const apiCall = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    logger.error('API call failed', error);
    throw error;
  }
};

// No type conversion needed - types are consistent between frontend and backend

// Main API object
export const api = {
  // Authentication endpoints (using users router from backend)
  auth: {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
      console.log('[API] Login called with:', { email: credentials.email, password: '***' });
      console.log('[API] Credentials type:', typeof credentials);
      console.log('[API] Credentials keys:', Object.keys(credentials));
      
      const result = await apiCall(() => {
        console.log('[API] About to call trpcVanilla.users.login.mutate with:', credentials);
        return trpcVanilla.users.login.mutate(credentials);
      });
      
      console.log('[API] Login result:', result);
      
      if (result && typeof result === 'object' && 'token' in result) {
        authUtils.setToken(result.token as string);
      }
      return result as LoginResponse;
    },

    register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
      return apiCall(() => trpcVanilla.users.register.mutate(userData)) as Promise<RegisterResponse>;
    },

    logout: async (): Promise<void> => {
      authUtils.clearToken();
      return Promise.resolve();
    },

    getCurrentUser: async (): Promise<User> => {
      return apiCall(() => trpcVanilla.users.getCurrentUser.query()) as Promise<User>;
    },

    refreshToken: async (): Promise<{ token: string }> => {
      // Mock implementation - backend doesn't have refresh endpoint yet
      const token = authUtils.getToken();
      if (!token) throw new Error('No token to refresh');
      return { token };
    },

    isAuthenticated: () => authUtils.isAuthenticated(),
  },

  // Task endpoints
  tasks: {
    getAll: async (): Promise<Task[]> => {
      const result = await apiCall(() => trpcVanilla.tasks.getAll.query());
      return result as Task[];
    },

    getById: async (id: string): Promise<Task> => {
      const result = await apiCall(() => trpcVanilla.tasks.getById.query({ id }));
      return result as Task;
    },

    getByStatus: async (status: TaskStatus): Promise<Task[]> => {
      // Convert uppercase enum to lowercase for backend compatibility
      const backendStatus = status.toLowerCase() as 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'in_review' | 'done' | 'archived';
      const result = await apiCall(() => trpcVanilla.tasks.getByStatus.query({ status: backendStatus }));
      return result as Task[];
    },

    create: async (taskData: Partial<Task>): Promise<Task> => {
      // Convert frontend data to backend format
      const backendData = {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status ? taskData.status.toLowerCase() as 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'in_review' | 'done' | 'archived' : 'todo',
        priority: taskData.priority ? taskData.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent' : 'medium',
        dueDate: taskData.dueDate,
        estimatedHours: taskData.estimatedHours,
        tags: taskData.tags,
        assigneeId: taskData.assigneeId,
      };
      const result = await apiCall(() => trpcVanilla.tasks.create.mutate(backendData));
      return result as Task;
    },

    update: async (id: string, data: Partial<Task>): Promise<Task> => {
      // Convert frontend data to backend format
      const backendData = {
        title: data.title,
        description: data.description,
        status: data.status ? data.status.toLowerCase() as 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'in_review' | 'done' | 'archived' : undefined,
        priority: data.priority ? data.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent' : undefined,
        dueDate: data.dueDate,
        estimatedHours: data.estimatedHours,
        tags: data.tags,
        assigneeId: data.assigneeId,
      };
      const result = await apiCall(() => trpcVanilla.tasks.update.mutate({ id, data: backendData }));
      return result as Task;
    },

    delete: async (id: string): Promise<void> => {
      await apiCall(() => trpcVanilla.tasks.delete.mutate({ id }));
    },

    updateStatus: async (id: string, status: TaskStatus): Promise<Task> => {
      // Convert uppercase enum to lowercase for backend compatibility
      const backendStatus = status.toLowerCase() as 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'in_review' | 'done' | 'archived';
      const result = await apiCall(() => trpcVanilla.tasks.update.mutate({ id, data: { status: backendStatus } }));
      return result as Task;
    },

    search: async (query: string): Promise<Task[]> => {
      const result = await apiCall(() => trpcVanilla.tasks.search.query({ query }));
      return result as Task[];
    },

    getAnalytics: async (): Promise<Record<string, unknown>> => {
      const result = await apiCall(() => trpcVanilla.analytics.getTasksCompletionStats.query({ timeframe: 'month' }));
      return { data: result };
    },

    // Additional methods that might be called by stores
    updateAssignee: async (id: string, assigneeId: string): Promise<Task> => {
      const result = await apiCall(() => trpcVanilla.tasks.update.mutate({ id, data: { assigneeId } }));
      return result as Task;
    },

    startTimeTracking: async (id: string): Promise<Task> => {
      const result = await apiCall(() => trpcVanilla.tasks.update.mutate({ id, data: { timeTrackingActive: true } }));
      return result as Task;
    },

    stopTimeTracking: async (id: string): Promise<Task> => {
      const result = await apiCall(() => trpcVanilla.tasks.update.mutate({ id, data: { timeTrackingActive: false } }));
      return result as Task;
    },

    saveAsTemplate: async (taskId: string, templateName: string, isPublic: boolean): Promise<TaskTemplate> => {
      const task = await apiCall(() => trpcVanilla.tasks.getById.query({ id: taskId }));
      const taskData = task as Record<string, unknown>;
      const templateData = {
        name: templateName,
        description: taskData.description as string,
        priority: taskData.priority as TaskPriority,
        estimatedHours: taskData.estimatedHours as number,
        tags: taskData.tags as string[],
        isPublic,
        category: 'custom',
        templateData: task,
      };
      return apiCall(() => trpcVanilla.templates.create.mutate(templateData)) as Promise<TaskTemplate>;
    },

    createFromTemplate: async (templateId: string, taskData: Partial<Task>): Promise<Task> => {
      const template = await apiCall(() => trpcVanilla.templates.getById.query({ id: templateId }));
      const templateData = template as Record<string, unknown>;
      const newTaskData = {
        title: taskData.title || templateData.name as string,
        description: taskData.description || templateData.description as string,
        priority: (taskData.priority || templateData.priority as TaskPriority)?.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent',
        estimatedHours: taskData.estimatedHours || templateData.estimatedHours as number,
        tags: taskData.tags || templateData.tags as string[],
        status: 'todo' as const,
      };
      const result = await apiCall(() => trpcVanilla.tasks.create.mutate(newTaskData));
      return result as Task;
    },
  },

  // Template endpoints
  templates: {
    getAll: async (): Promise<TaskTemplate[]> => {
      return apiCall(() => trpcVanilla.templates.getAll.query()) as Promise<TaskTemplate[]>;
    },

    getById: async (id: string): Promise<TaskTemplate> => {
      return apiCall(() => trpcVanilla.templates.getById.query({ id })) as Promise<TaskTemplate>;
    },

    getByCategory: async (category: string): Promise<TaskTemplate[]> => {
      return apiCall(() => trpcVanilla.templates.getByCategory.query({ category })) as Promise<TaskTemplate[]>;
    },

    create: async (templateData: Partial<TaskTemplate>): Promise<TaskTemplate> => {
      return apiCall(() => trpcVanilla.templates.create.mutate(templateData)) as Promise<TaskTemplate>;
    },

    update: async (id: string, data: Partial<TaskTemplate>): Promise<TaskTemplate> => {
      return apiCall(() => trpcVanilla.templates.update.mutate({ id, data })) as Promise<TaskTemplate>;
    },

    delete: async (id: string): Promise<void> => {
      await apiCall(() => trpcVanilla.templates.delete.mutate({ id }));
    },

    search: async (query: string): Promise<TaskTemplate[]> => {
      return apiCall(() => trpcVanilla.templates.search.query({ query })) as Promise<TaskTemplate[]>;
    },

    getCategories: async (): Promise<string[]> => {
      // Mock implementation - in real app this would be a backend endpoint
      return Promise.resolve(['work', 'personal', 'project', 'custom']);
    },
  },

  // Comment endpoints
  comments: {
    getByTaskId: async (taskId: string): Promise<Comment[]> => {
      return apiCall(() => trpcVanilla.comments.getByTaskId.query({ taskId })) as Promise<Comment[]>;
    },

    getCountByTaskId: async (taskId: string): Promise<number> => {
      const comments = await apiCall(() => trpcVanilla.comments.getByTaskId.query({ taskId }));
      return (comments as unknown[]).length;
    },

    create: async (taskId: string, text: string): Promise<Comment> => {
      return apiCall(() => trpcVanilla.comments.create.mutate({ taskId, text })) as Promise<Comment>;
    },

    update: async (id: string, text: string): Promise<Comment> => {
      return apiCall(() => trpcVanilla.comments.update.mutate({ id, text })) as Promise<Comment>;
    },

    delete: async (id: string): Promise<void> => {
      await apiCall(() => trpcVanilla.comments.delete.mutate({ id }));
    },
  },

  // Attachment endpoints
  attachments: {
    getByTaskId: async (taskId: string): Promise<Attachment[]> => {
      return apiCall(() => trpcVanilla.attachments.getByTaskId.query({ taskId })) as Promise<Attachment[]>;
    },

    upload: async (taskId: string, file: File): Promise<Attachment> => {
      // For now, create a mock attachment - real implementation would handle file upload
      const attachmentData = {
        taskId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath: `/uploads/${file.name}`,
      };
      return apiCall(() => trpcVanilla.attachments.upload.mutate(attachmentData)) as Promise<Attachment>;
    },

    delete: async (id: string): Promise<void> => {
      await apiCall(() => trpcVanilla.attachments.delete.mutate({ id }));
    },
  },

  // Notification endpoints
  notifications: {
    getAll: async (): Promise<Notification[]> => {
      return apiCall(() => trpcVanilla.notifications.getAll.query()) as Promise<Notification[]>;
    },

    markAsRead: async (id: string): Promise<void> => {
      await apiCall(() => trpcVanilla.notifications.markAsRead.mutate({ id }));
    },

    markAllAsRead: async (): Promise<void> => {
      await apiCall(() => trpcVanilla.notifications.markAllAsRead.mutate());
    },

    getUnreadCount: async (): Promise<number> => {
      const notifications = await apiCall(() => trpcVanilla.notifications.getAll.query());
      return (notifications as unknown[]).filter((n: Record<string, unknown>) => !n.read).length;
    },

    delete: async (): Promise<void> => {
      // Mock implementation - would need backend endpoint
      return Promise.resolve();
    },
  },

  // Google integration endpoints (using actual backend endpoints)
  google: {
    getAuthUrl: async (): Promise<{ url: string }> => {
      // Mock implementation - backend doesn't have this endpoint
      return { url: '/api/google/auth' };
    },

    handleCallback: async (): Promise<{ success: boolean }> => {
      // Mock implementation - backend doesn't have this endpoint
      return { success: true };
    },

    getCalendarEvents: async (): Promise<unknown[]> => {
      return apiCall(() => trpcVanilla.googleIntegration.getCalendarEvents.query()) as Promise<unknown[]>;
    },

    getDriveFiles: async (): Promise<unknown[]> => {
      return apiCall(() => trpcVanilla.googleIntegration.getGoogleDriveFiles.query()) as Promise<unknown[]>;
    },

    disconnect: async (): Promise<void> => {
      // Mock implementation - backend doesn't have this endpoint
      return Promise.resolve();
    },
  },

  // Google integration (alternative naming for compatibility)
  googleIntegration: {
    getGoogleAccountStatus: async (): Promise<{ connected: boolean }> => {
      const result = await apiCall(() => trpcVanilla.googleIntegration.getGoogleAccountStatus.query());
      return result as { connected: boolean };
    },

    linkGoogleAccount: async (authCode: string): Promise<{ success: boolean }> => {
      // Mock implementation - backend doesn't have this endpoint
      console.log('Linking Google account with code:', authCode);
      return { success: true };
    },

    unlinkGoogleAccount: async (): Promise<{ success: boolean }> => {
      // Mock implementation - backend doesn't have this endpoint
      return { success: true };
    },

    getGoogleDriveFiles: async (): Promise<unknown[]> => {
      return apiCall(() => trpcVanilla.googleIntegration.getGoogleDriveFiles.query()) as Promise<unknown[]>;
    },

    importGoogleTasks: async (): Promise<{ imported: number }> => {
      const result = await apiCall(() => trpcVanilla.googleIntegration.importGoogleTasks.query());
      return { imported: (result as unknown[]).length };
    },

    syncCalendar: async (): Promise<{ synced: boolean }> => {
      const result = await apiCall(() => trpcVanilla.googleIntegration.syncCalendar.mutate());
      return { synced: !!(result as Record<string, unknown>).success };
    },

    getCalendarEvents: async (): Promise<unknown[]> => {
      return apiCall(() => trpcVanilla.googleIntegration.getCalendarEvents.query()) as Promise<unknown[]>;
    },
  },

  // Analytics endpoints
  analytics: {
    getTaskCompletionStats: async (timeframe: 'week' | 'month' | 'year'): Promise<Record<string, unknown>> => {
      const result = await apiCall(() => trpcVanilla.analytics.getTasksCompletionStats.query({ timeframe }));
      return { data: result };
    },

    getUserProductivity: async (): Promise<Record<string, unknown>> => {
      const result = await apiCall(() => trpcVanilla.analytics.getUserWorkload.query());
      return { data: result };
    },

    getProjectProgress: async (): Promise<Record<string, unknown>> => {
      const result = await apiCall(() => trpcVanilla.analytics.getTasksByPriority.query());
      return { data: result };
    },
  },

  // Admin endpoints (mock implementations)
  admin: {
    getAllUsers: async (): Promise<User[]> => {
      return []; // Mock implementation - would need backend endpoint
    },

    updateUser: async (id: string, data: Record<string, unknown>): Promise<User> => {
      console.log('Mock updateUser:', id, data);
      return {} as User; // Mock implementation
    },

    deleteUser: async (id: string): Promise<void> => {
      console.log('Mock deleteUser:', id);
      return Promise.resolve();
    },

    getSystemStats: async (): Promise<Record<string, unknown>> => {
      return {}; // Mock implementation
    },

    createUser: async (userData: { name: string; email: string; role: string }): Promise<User> => {
      console.log('Mock createUser:', userData);
      return {} as User; // Mock implementation
    },

    resetUserPassword: async (userId: string, newPassword: string): Promise<void> => {
      console.log('Mock resetUserPassword:', userId, newPassword);
      return Promise.resolve();
    },

    getUserDeletionStats: async (userId: string): Promise<{ taskCount: number; templateCount: number }> => {
      console.log('Mock getUserDeletionStats:', userId);
      return { taskCount: 0, templateCount: 0 }; // Mock implementation
    },
  },
};

// Export auth utilities for external use
export { authUtils };

// Export types for convenience
export type { Task, TaskTemplate, User, Comment, Attachment, Notification, TaskStatus, TaskPriority, UserRole };