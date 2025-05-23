/**
 * tRPC Test Utilities
 * 
 * This file provides utility functions and setup for testing the tRPC API client.
 */

import { createTRPCClient, httpBatchLink, httpLink } from '@trpc/client';
import type { AppRouter } from '@track-it/shared/types/trpc';
import { QueryClient } from '@tanstack/react-query';
import crossFetch from 'cross-fetch';

// Define base URL for tests
export const TEST_API_URL = 'http://localhost:3001/trpc';

// Type for the mock localStorage
export interface StorageMock {
  store: Record<string, string>;
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

// Create localStorage mock for tests
export const createLocalStorageMock = (): StorageMock => {
  return {
    store: {} as Record<string, string>,
    getItem: function (key: string) {
      return this.store[key] || null;
    },
    setItem: function (key: string, value: string) {
      this.store[key] = value;
    },
    removeItem: function (key: string) {
      delete this.store[key];
    },
    clear: function () {
      this.store = {};
    }
  };
};

// Create test tRPC client for integration tests
export const createTestTrpcClient = (options?: {
  useLocalStorage?: StorageMock;
  apiUrl?: string;
  useBatchLink?: boolean;
}) => {
  const storage = options?.useLocalStorage || createLocalStorageMock();
  const apiUrl = options?.apiUrl || TEST_API_URL;
  const useBatchLink = options?.useBatchLink ?? false;

  const linkConfig = {
    url: apiUrl,
    fetch: (url: string, fetchOptions: RequestInit = {}) => {
      const reqOptions = { ...fetchOptions };
      const headers = reqOptions.headers || {};
      const token = storage.getItem('token');
      
      // Add token if available
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
      
      // Ensure proper headers
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
      (headers as Record<string, string>)['Accept'] = 'application/json';
      (headers as Record<string, string>)['X-From-Frontend'] = 'track-it-test';
      
      reqOptions.headers = headers;
      reqOptions.credentials = 'include';
      reqOptions.mode = 'cors';
      
      // Log request for debugging if needed
      if (process.env.DEBUG_API_REQUESTS) {
        console.log(`Test Request: ${url}`, reqOptions);
      }
      
      return crossFetch(url, reqOptions);
    }
  };

  // Create the appropriate link based on the option
  const link = useBatchLink ? 
    httpBatchLink(linkConfig) : 
    httpLink(linkConfig);

  // Create and return the client
  return createTRPCClient<AppRouter>({
    links: [link],
  });
};

// Create a test query client
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0,
    },
  },
});

// Check if backend is running (used in beforeAll)
export const isBackendRunning = async (): Promise<boolean> => {
  try {
    const response = await crossFetch('http://localhost:3001/');
    return response.status === 200;
  } catch {
    return false;
  }
};

// Generate random test user data
export const generateTestUser = () => {
  const timestamp = Date.now();
  return {
    name: `Test User ${timestamp}`,
    email: `testuser${timestamp}@example.com`,
    password: 'Password123!',
    passwordConfirm: 'Password123!'
  };
};

// Helper to create test task data
export const generateTestTask = () => {
  const timestamp = Date.now();
  return {
    title: `Test Task ${timestamp}`,
    description: `Description for test task ${timestamp}`,
    status: 'backlog',
    priority: 'medium',
    tags: ['test', 'integration'],
    estimatedHours: 2,
  };
};

// Wait for a specified time - useful for certain test scenarios
export const wait = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));