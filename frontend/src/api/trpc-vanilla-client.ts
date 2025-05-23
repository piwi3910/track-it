/**
 * Vanilla tRPC client for use outside of React components
 * This uses the newer tRPC v11 API without the deprecated proxy client
 */

import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { TRPCClientError } from '@trpc/client';
import type { AppRouter } from '@track-it/shared/types/trpc';

// Helper to get auth token
function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

// Create a vanilla tRPC client for use outside React
export const trpcVanillaClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_API_URL || 'http://localhost:3001/trpc',
      headers() {
        const token = getAuthToken();
        return {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        };
      },
    }),
  ],
});

// Re-export the error handling utilities
export { TRPCClientError };

// Type-safe wrapper to handle the AppRouter being 'any'
// This will be removed once AppRouter is properly typed
export const vanillaClient = trpcVanillaClient as unknown as {
  users: {
    login: {
      mutate: (input: { email: string; password: string }) => Promise<unknown>;
    };
    register: {
      mutate: (input: { name: string; email: string; password: string; passwordConfirm: string }) => Promise<unknown>;
    };
    getCurrentUser: {
      query: () => Promise<unknown>;
    };
    getAllUsers: {
      query: () => Promise<unknown>;
    };
    updateProfile: {
      mutate: (input: unknown) => Promise<unknown>;
    };
    updateAvatar: {
      mutate: (input: { avatarUrl: string | null }) => Promise<unknown>;
    };
    updateUserRole: {
      mutate: (input: { userId: string; role: string }) => Promise<unknown>;
    };
    getUserDeletionStats: {
      query: (input: { userId: string }) => Promise<unknown>;
    };
    createUser: {
      mutate: (input: unknown) => Promise<unknown>;
    };
    updateUser: {
      mutate: (input: unknown) => Promise<unknown>;
    };
    deleteUser: {
      mutate: (input: { userId: string }) => Promise<unknown>;
    };
    resetUserPassword: {
      mutate: (input: { userId: string; newPassword: string }) => Promise<unknown>;
    };
    loginWithGoogle: {
      mutate: (input: { idToken: string }) => Promise<unknown>;
    };
    verifyGoogleToken: {
      mutate: (input: { credential: string }) => Promise<unknown>;
    };
  };
  tasks: {
    getAll: {
      query: () => Promise<unknown>;
    };
    getById: {
      query: (input: { id: string }) => Promise<unknown>;
    };
    getByStatus: {
      query: (input: { status: string }) => Promise<unknown>;
    };
    search: {
      query: (input: { query: string }) => Promise<unknown>;
    };
    create: {
      mutate: (input: unknown) => Promise<unknown>;
    };
    update: {
      mutate: (input: { id: string; data: unknown }) => Promise<unknown>;
    };
    delete: {
      mutate: (input: { id: string }) => Promise<unknown>;
    };
    updateStatus: {
      mutate: (input: { id: string; status: string }) => Promise<unknown>;
    };
    updateAssignee: {
      mutate: (input: { id: string; assigneeId: string | null }) => Promise<unknown>;
    };
    startTimeTracking: {
      mutate: (input: { id: string }) => Promise<unknown>;
    };
    stopTimeTracking: {
      mutate: (input: { id: string }) => Promise<unknown>;
    };
    saveAsTemplate: {
      mutate: (input: { taskId: string; templateName: string; isPublic?: boolean }) => Promise<unknown>;
    };
    createFromTemplate: {
      mutate: (input: { templateId: string; taskData: unknown }) => Promise<unknown>;
    };
  };
  templates: {
    getAll: {
      query: () => Promise<unknown>;
    };
    getById: {
      query: (input: { id: string }) => Promise<unknown>;
    };
    getByCategory: {
      query: (input: { category: string }) => Promise<unknown>;
    };
    getCategories: {
      query: () => Promise<unknown>;
    };
    search: {
      query: (input: { query: string }) => Promise<unknown>;
    };
    create: {
      mutate: (input: unknown) => Promise<unknown>;
    };
    update: {
      mutate: (input: { id: string; data: unknown }) => Promise<unknown>;
    };
    delete: {
      mutate: (input: { id: string }) => Promise<unknown>;
    };
  };
  comments: {
    getByTaskId: {
      query: (input: { taskId: string }) => Promise<unknown>;
    };
    getCommentCount: {
      query: (input: { taskId: string }) => Promise<unknown>;
    };
    create: {
      mutate: (input: { taskId: string; text: string; parentId?: string }) => Promise<unknown>;
    };
    update: {
      mutate: (input: { id: string; text: string }) => Promise<unknown>;
    };
    delete: {
      mutate: (input: { id: string }) => Promise<unknown>;
    };
  };
  attachments: {
    getByTaskId: {
      query: (input: { taskId: string }) => Promise<unknown>;
    };
    upload: {
      mutate: (input: { taskId: string; file: unknown }) => Promise<unknown>;
    };
    delete: {
      mutate: (input: { id: string }) => Promise<unknown>;
    };
  };
  analytics: {
    getTasksCompletionStats: {
      query: (input: { timeframe: string }) => Promise<unknown>;
    };
    getUserWorkload: {
      query: () => Promise<unknown>;
    };
    getTasksByPriority: {
      query: () => Promise<unknown>;
    };
    getTasksByStatus: {
      query: () => Promise<unknown>;
    };
    getTaskCompletionRate: {
      query: (input: { period: string }) => Promise<unknown>;
    };
  };
  googleIntegration: {
    getGoogleAccountStatus: {
      query: () => Promise<unknown>;
    };
    linkGoogleAccount: {
      mutate: (input: { authCode: string }) => Promise<unknown>;
    };
    unlinkGoogleAccount: {
      mutate: () => Promise<unknown>;
    };
    syncCalendar: {
      mutate: () => Promise<unknown>;
    };
    importGoogleTasks: {
      query: () => Promise<unknown>;
    };
    getGoogleDriveFiles: {
      query: () => Promise<unknown>;
    };
    getCalendarEvents: {
      query: () => Promise<unknown>;
    };
    verifyGoogleToken: {
      mutate: (input: { credential: string }) => Promise<unknown>;
    };
  };
  notifications: {
    getAll: {
      query: () => Promise<unknown>;
    };
    getUnreadCount: {
      query: () => Promise<unknown>;
    };
    markAsRead: {
      mutate: (input: { id: string }) => Promise<unknown>;
    };
    markAllAsRead: {
      mutate: () => Promise<unknown>;
    };
    delete: {
      mutate: (input: { id: string }) => Promise<unknown>;
    };
    updatePreferences: {
      mutate: (input: unknown) => Promise<unknown>;
    };
  };
  cacheAdmin: {
    getMetrics: {
      query: () => Promise<unknown>;
    };
    flushAll: {
      mutate: () => Promise<unknown>;
    };
    clearByPattern: {
      mutate: (input: { pattern: string }) => Promise<unknown>;
    };
    clearResourceCache: {
      mutate: (input: { resourceType: string }) => Promise<unknown>;
    };
  };
};