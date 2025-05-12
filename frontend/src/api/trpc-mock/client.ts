/**
 * Client for the mock tRPC API
 * This is the main export that components will use to interact with the API
 */

import { createTRPCProxyClient } from './trpc';
import { appRouter } from './router';
import type { AppRouter } from './types';

// Create the mock tRPC client
export const api = createTRPCProxyClient<AppRouter>(appRouter);

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
  } catch (err) {
    console.error('API Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage };
  }
};

// Export hooks for querying data (to simulate React Query / TanStack Query)
export function useQuery<TData, TError = Error>(
  queryFn: () => Promise<TData>
) {
  return {
    queryFn,
    // In a real implementation, this would include:
    // isLoading, isError, error, data, refetch etc.
  };
}

// Export hooks for mutations (to simulate useMutation from React Query)
export function useMutation<TData, TVariables, TError = Error>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  return {
    mutate: mutationFn,
    // In a real implementation, this would include:
    // isLoading, isError, error, data, etc.
  };
}