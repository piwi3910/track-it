/**
 * tRPC Client Setup
 * Standard tRPC v11 configuration following best practices
 */

import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient, httpLink, loggerLink } from '@trpc/client';
import { QueryClient } from '@tanstack/react-query';
import type { AppRouter } from '@track-it/shared/types/trpc';

// Create the tRPC React client
export const trpc = createTRPCReact<AppRouter>();

// Get API URL from environment
const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001/trpc';
};

// Get auth token from localStorage
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

// Create standard tRPC client configuration
export const createTRPCClientConfig = () => ({
  links: [
    // Logger link for development
    ...(import.meta.env.DEV ? [
      loggerLink({
        enabled: () => process.env.NODE_ENV === 'development',
      })
    ] : []),
    
    // Standard HTTP link
    httpLink({
      url: getApiUrl(),
      
      // Headers function for authentication
      headers() {
        const token = getAuthToken();
        return {
          ...(token && { Authorization: `Bearer ${token}` }),
        };
      },
      
    }),
  ],
});

// Create vanilla tRPC client for use outside React components
export const trpcVanilla = createTRPCClient<AppRouter>(createTRPCClientConfig());

// Create React Query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error && typeof error === 'object' && 'data' in error) {
          const trpcError = error as { data?: { httpStatus?: number } };
          if (trpcError.data?.httpStatus === 401) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

// Auth token management utilities
export const authUtils = {
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  },
  
  clearToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  },
  
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },
  
  isAuthenticated: () => {
    return !!authUtils.getToken();
  },
};