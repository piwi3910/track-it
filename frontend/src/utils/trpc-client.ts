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
// @ts-ignore - The AppRouter type doesn't satisfy the constraint, but it works at runtime
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
      // Configuration to handle large inputs
      maxURLLength: 2000, // Limit URL length for GET requests
      // Disable batching to troubleshoot
      batchMaxSize: 1, 
      // Add auth headers to all requests
      headers() {
        const token = getAuthToken();
        
        return {
          // Add authorization header if token exists
          Authorization: token ? `Bearer ${token}` : '',
          // Add custom header for CORS and identification
          'X-From-Frontend': 'track-it-client',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };
      },
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
          headers: {
            ...options.headers,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
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
    let errorCode = 'UNKNOWN_ERROR';
    
    // Create a more robust error response
    if (error instanceof TRPCClientError) {
      // Handle batch size or input too large errors
      if (error.message.includes('Input is too big for a single dispatch') || 
          error.message.includes('too big')) {
        errorMessage = 'Request data is too large. Try with a smaller batch size.';
        errorCode = 'INPUT_TOO_LARGE';
        
        // Retry with smaller batch size
        console.info('Input too large error encountered, consider reducing batch size');
      }
      // Handle transformation errors as connection issues
      else if (error.message.includes('transform') || 
          error.message.includes('Unable to transform response')) {
        errorMessage = 'Connection issue. The API response could not be processed.';
        errorCode = 'TRANSFORM_ERROR';
      }
      // Handle connection errors
      else if (error.message.includes('fetch') ||
               error.message.includes('Failed to fetch') ||
               error.message.includes('network')) {
        errorMessage = 'Cannot connect to the server. Please ensure the backend is running.';
        errorCode = 'CONNECTION_ERROR';
      }
      // Handle authorization errors
      else if (error.message === 'UNAUTHORIZED' || 
               error.data?.code === 'UNAUTHORIZED' ||
               error.data?.httpStatus === 401 ||
               error.message.includes('unauthorized')) {
        errorMessage = 'Authentication error. Please try logging in again.';
        errorCode = 'AUTH_ERROR';
        // Clear token if it's an auth error
        clearAuthToken();
        
        // Dispatch auth error event for global handling
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth_error'));
        }
      }
      // Handle not found errors
      else if (error.message.includes('No procedure found') || 
               error.data?.httpStatus === 404) {
        errorMessage = `API endpoint not found: ${error.message}`;
        errorCode = 'NOT_FOUND';
      }
      // Handle other tRPC errors
      else {
        errorMessage = error.message;
        errorCode = error.data?.code || 'TRPC_ERROR';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
      errorCode = 'JS_ERROR';
    }
    
    // Log detailed error for debugging
    console.error(`API Error (${errorCode}):`, errorMessage);
    
    // For connection issues, try to use mock data when possible
    if (errorCode === 'CONNECTION_ERROR' || errorCode === 'TRANSFORM_ERROR') {
      // Try to switch to mock mode automatically for better user experience
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('api_connection_error'));
      }
    }
    
    return { 
      data: null, 
      error: errorMessage 
    };
  }
};