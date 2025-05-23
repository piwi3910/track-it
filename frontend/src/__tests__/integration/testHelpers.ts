/**
 * Test helpers for integration tests
 */

import { createTRPCClient, httpLink } from '@trpc/client';
import fetch from 'cross-fetch';
import type { TestClient } from '../types/test-client';

// Configure global fetch for Node.js environment
global.fetch = fetch;

// Type for mockLocalStorage
interface MockStorage {
  store: Record<string, string>;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

// Mock localStorage
export const mockLocalStorage: MockStorage = {
  store: {},
  getItem(key: string) {
    return this.store[key] || null;
  },
  setItem(key: string, value: string) {
    this.store[key] = value;
  },
  removeItem(key: string) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  }
};

// Define a properly typed test client interface

// Create a tRPC client for testing
export const createTestClient = (): TestClient => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createTRPCClient<any>({
    links: [
      httpLink({
        url: 'http://localhost:3001/trpc',
        // Configure fetch with auth headers if token exists
        fetch: (url, options = {}) => {
          const fetchOptions = { ...options } as RequestInit;
          const headers = new Headers(fetchOptions.headers);
          const token = mockLocalStorage.getItem('token');
          
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          
          fetchOptions.headers = headers;
          
          // Remove the signal to avoid AbortController issues in tests
          if (fetchOptions.signal) {
            delete fetchOptions.signal;
          }
          
          return fetch(url, fetchOptions);
        }
      }),
    ],
  }) as unknown as TestClient;
};

// Check if backend server is available
export const isBackendAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:3001/');
    return response.ok;
  } catch {
    return false;
  }
};

// Login helper function
export const loginTestUser = async (
  email = 'demo@example.com', 
  password = 'password123'
): Promise<void> => {
  const client = createTestClient();
  try {
    const loginResult = await client.users.login.mutate({ email, password });
    mockLocalStorage.setItem('token', loginResult.token);
  } catch (error) {
    throw new Error(`Login failed: ${(error as Error).message}`);
  }
};

// Generator for random test data
export const generators = {
  // Generate random user data
  randomUser: () => {
    const timestamp = Date.now();
    return {
      name: `Test User ${timestamp}`,
      email: `testuser${timestamp}@example.com`,
      password: 'Password123!',
      passwordConfirm: 'Password123!'
    };
  },
  
  // Generate random task data
  randomTask: () => {
    const timestamp = Date.now();
    return {
      title: `Test Task ${timestamp}`,
      description: `This is a test task created at ${new Date(timestamp).toISOString()}`,
      status: 'todo',
      priority: 'medium',
      tags: ['test', 'automated'],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    };
  },
  
  // Generate random comment data
  randomComment: (taskId: string) => {
    const timestamp = Date.now();
    return {
      taskId,
      text: `This is a test comment created at ${new Date(timestamp).toISOString()}`
    };
  }
};