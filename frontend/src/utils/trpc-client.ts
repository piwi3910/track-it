/**
 * tRPC client setup for the frontend
 * This is the main integration point between frontend and backend
 */

import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, loggerLink, TRPCClientError } from '@trpc/client';
import { QueryClient } from '@tanstack/react-query';
import type { AppRouter } from '@track-it/shared';
import { env } from '@/utils/env';

// Create a tRPC client
export const trpc = createTRPCReact<AppRouter>();

// Create a query client for React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default query options
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors (auth issues)
        if (error instanceof TRPCClientError) {
          const trpcError = error as TRPCClientError<any>;
          const statusCode = trpcError.data?.httpStatus;
          if (statusCode === 401 || statusCode === 403) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
  },
});

// Function to get the auth token from storage
export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

// Function to set the auth token in storage
export function setAuthToken(token: string): void {
  localStorage.setItem('token', token);
}

// Function to clear the auth token from storage
export function clearAuthToken(): void {
  localStorage.removeItem('token');
}

// Initialize tRPC client
export const trpcClient = trpc.createClient({
  links: [
    // Add logging in development
    loggerLink({
      enabled: (opts) => 
        process.env.NODE_ENV === 'development' || 
        (opts.direction === 'down' && opts.result instanceof Error),
    }),
    // Use httpBatchLink for batching requests
    httpBatchLink({
      url: env.VITE_API_URL || 'http://localhost:3001/trpc',
      // Add auth headers to all requests
      headers() {
        const token = getAuthToken();
        
        return {
          // Add authorization header if token exists
          Authorization: token ? `Bearer ${token}` : '',
          // Add custom header for CORS and identification
          'X-From-Frontend': 'track-it-client',
        };
      },
    }),
  ],
});

// Error handler helper for API calls
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
      if (
        error.message === 'UNAUTHORIZED' || 
        error.data?.code === 'UNAUTHORIZED' ||
        error.data?.httpStatus === 401
      ) {
        // Clear token if it's an auth error
        clearAuthToken();
      }

      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return { data: null, error: errorMessage };
  }
};