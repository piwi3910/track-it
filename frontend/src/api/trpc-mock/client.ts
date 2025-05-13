/**
 * Client for the mock tRPC API
 * This is the main export that components will use to interact with the API
 */

import { createTRPCProxyClient } from './trpc';
import { appRouter } from './router';
import type { AppRouter } from './types';

// Create the mock tRPC client
export const api = createTRPCProxyClient<AppRouter>(appRouter);

// Export main API modules to match the structure of the real API client
export const users = api.users;
export const tasks = api.tasks;
export const templates = api.templates;
export const comments = api.comments;
export const attachments = api.attachments;
export const googleIntegration = api.googleIntegration;
export const notifications = api.notifications;
export const analytics = api.analytics;
export const cacheAdmin = api.cacheAdmin;
export const cachedTasks = api.cachedTasks;
export const auth = {
  login: users.login,
  register: users.register,
  getCurrentUser: users.getCurrentUser,
  updateProfile: users.updateProfile,
  logout: () => null,
  isAuthenticated: () => true
};

/**
 * Error handling wrapper for API calls
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { data: null, error: errorMessage };
  }
};

// Export hooks for querying data (to simulate React Query / TanStack Query)
export function useQuery<TData>(
  queryFn: () => Promise<TData>
) {
  return {
    queryFn,
    // In a real implementation, this would include:
    // isLoading, isError, error, data, refetch etc.
  };
}

// Export hooks for mutations (to simulate useMutation from React Query)
export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  return {
    mutate: mutationFn,
    // In a real implementation, this would include:
    // isLoading, isError, error, data, etc.
  };
}