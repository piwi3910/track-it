/**
 * Comprehensive Integration Tests for Authentication API
 * 
 * These tests validate the authentication flows between frontend and backend,
 * focusing on user registration, login, profile management, and authorization.
 */

import crossFetch from 'cross-fetch';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { jest, describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';

// Mock global objects for testing
global.fetch = crossFetch as any;

// Create localStorage mock
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: (key: string) => localStorageMock.store[key] || null,
  setItem: (key: string, value: string) => { localStorageMock.store[key] = value; },
  removeItem: (key: string) => { delete localStorageMock.store[key]; },
  clear: () => { localStorageMock.store = {}; }
};

// Set up global localStorage
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Base URL for the API
const BASE_URL = 'http://localhost:3001/trpc';

// Create tRPC client for testing
const createClient = () => {
  return createTRPCClient<any>({
    links: [
      httpBatchLink({
        url: BASE_URL,
        // Important: disable batching for tests
        batch: false,
        fetch: (url, options = {}) => {
          const fetchOptions = { ...options } as any;
          const headers = fetchOptions.headers || {};
          const token = localStorageMock.getItem('token');
          
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          
          fetchOptions.headers = headers;
          
          // Remove the signal to avoid AbortController issues in tests
          if (fetchOptions.signal) {
            delete fetchOptions.signal;
          }
          
          return crossFetch(url, fetchOptions);
        }
      }),
    ],
  });
};

// Generate random user data for testing
const generateTestUser = () => {
  const timestamp = Date.now();
  return {
    name: `Test User ${timestamp}`,
    email: `testuser${timestamp}@example.com`,
    password: 'Password123!',
    passwordConfirm: 'Password123!'
  };
};

// Check if backend is running
const isBackendRunning = async (): Promise<boolean> => {
  try {
    const response = await crossFetch('http://localhost:3001/');
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

describe('Authentication API Integration Tests', () => {
  let client: ReturnType<typeof createClient>;
  let testUser: ReturnType<typeof generateTestUser>;
  let userId: string;
  
  // Before all tests, check if backend is running
  beforeAll(async () => {
    const backendAvailable = await isBackendRunning();
    if (!backendAvailable) {
      console.error('\x1b[31m%s\x1b[0m', '⚠️  Backend server is not running!');
      console.error('\x1b[33m%s\x1b[0m', 'Please start the backend server with: cd ../backend && npm run dev');
      throw new Error('Backend server is not running. Tests will be skipped.');
    }
  });
  
  beforeEach(() => {
    client = createClient();
    localStorageMock.clear();
    testUser = generateTestUser();
  });
  
  describe('Registration Flow', () => {
    it('should successfully register a new user', async () => {
      // Test registration with valid data
      const result = await client.users.register.mutate(testUser);
      
      // Store user ID for later tests
      userId = result.id;
      
      // Validate response structure and data
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toEqual(testUser.name);
      expect(result.email).toEqual(testUser.email);
    });
    
    it('should reject registration with duplicate email', async () => {
      // Try to register with the same email again
      await expect(client.users.register.mutate(testUser))
        .rejects.toThrow(/email already exists/i);
    });
    
    it('should reject registration with invalid password confirmation', async () => {
      const invalidUser = {
        ...generateTestUser(),
        passwordConfirm: 'DifferentPassword123!'
      };
      
      // Try to register with mismatched passwords
      await expect(client.users.register.mutate(invalidUser))
        .rejects.toThrow(/passwords don't match/i);
    });
    
    it('should reject registration with invalid email format', async () => {
      const invalidUser = {
        ...generateTestUser(),
        email: 'not-an-email'
      };
      
      // Try to register with invalid email
      await expect(client.users.register.mutate(invalidUser))
        .rejects.toThrow(/invalid/i);
    });
    
    it('should reject registration with short password', async () => {
      const invalidUser = {
        ...generateTestUser(),
        password: '12345',
        passwordConfirm: '12345'
      };
      
      // Try to register with short password
      await expect(client.users.register.mutate(invalidUser))
        .rejects.toThrow(/password/i);
    });
  });
  
  describe('Login Flow', () => {
    beforeEach(async () => {
      // Ensure we have a registered user for login tests
      if (!userId) {
        const result = await client.users.register.mutate(testUser);
        userId = result.id;
      }
    });
    
    it('should successfully login with valid credentials', async () => {
      // Test login with valid credentials
      const result = await client.users.login.mutate({
        email: testUser.email,
        password: testUser.password
      });
      
      // Validate response structure and data
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toEqual(testUser.name);
      expect(result.email).toEqual(testUser.email);
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(20); // JWT tokens are longer than 20 chars
      
      // Check role field is present
      expect(result.role).toBeDefined();
      expect(['admin', 'member', 'guest']).toContain(result.role);
      
      // Store token in localStorage
      localStorageMock.setItem('token', result.token);
    });
    
    it('should reject login with invalid credentials', async () => {
      // Try to login with wrong password
      await expect(client.users.login.mutate({
        email: testUser.email,
        password: 'WrongPassword123!'
      })).rejects.toThrow(/invalid email or password/i);
      
      // Try to login with non-existent email
      await expect(client.users.login.mutate({
        email: 'nonexistent@example.com',
        password: testUser.password
      })).rejects.toThrow(/invalid email or password/i);
    });
    
    it('should reject login with invalid input format', async () => {
      // Try to login with invalid email
      await expect(client.users.login.mutate({
        email: 'not-an-email',
        password: testUser.password
      })).rejects.toThrow();
      
      // Try to login with missing password
      await expect(client.users.login.mutate({
        email: testUser.email,
        password: ''
      })).rejects.toThrow();
    });
  });
  
  describe('User Profile Management', () => {
    beforeEach(async () => {
      // Ensure we have a registered and logged in user
      if (!userId) {
        const registerResult = await client.users.register.mutate(testUser);
        userId = registerResult.id;
      }
      
      const loginResult = await client.users.login.mutate({
        email: testUser.email,
        password: testUser.password
      });
      
      localStorageMock.setItem('token', loginResult.token);
    });
    
    it('should get current user profile when authenticated', async () => {
      // Get current user profile
      const result = await client.users.getCurrentUser.query();
      
      // Validate response structure and data
      expect(result).toBeDefined();
      expect(result.id).toEqual(userId);
      expect(result.name).toEqual(testUser.name);
      expect(result.email).toEqual(testUser.email);
      expect(result.role).toBeDefined();
      expect(['admin', 'member', 'guest']).toContain(result.role);
      
      // Check preferences object structure
      expect(result.preferences).toBeDefined();
      
      // Check Google connection fields
      expect('googleConnected' in result).toBe(true);
      if (result.googleConnected) {
        expect(result.googleEmail).toBeDefined();
      }
    });
    
    it('should reject profile access when not authenticated', async () => {
      // Clear token to simulate unauthenticated request
      localStorageMock.removeItem('token');
      
      // Try to get profile without authentication
      await expect(client.users.getCurrentUser.query())
        .rejects.toThrow(/authentication|unauthorized/i);
    });
    
    it('should update user profile successfully', async () => {
      // Prepare update data
      const updateData = {
        name: `Updated Name ${Date.now()}`,
        avatarUrl: `https://example.com/avatar.jpg?v=${Date.now()}`,
        preferences: {
          theme: 'dark',
          defaultView: 'kanban'
        }
      };
      
      // Update profile
      const result = await client.users.updateProfile.mutate(updateData);
      
      // Validate response
      expect(result).toBeDefined();
      expect(result.id).toEqual(userId);
      expect(result.name).toEqual(updateData.name);
      expect(result.avatarUrl).toEqual(updateData.avatarUrl);
      expect(result.preferences.theme).toEqual(updateData.preferences.theme);
      expect(result.preferences.defaultView).toEqual(updateData.preferences.defaultView);
      
      // Verify changes are persisted by getting profile again
      const updatedProfile = await client.users.getCurrentUser.query();
      expect(updatedProfile.name).toEqual(updateData.name);
      expect(updatedProfile.preferences.theme).toEqual(updateData.preferences.theme);
    });
    
    it('should update only specified profile fields', async () => {
      // Get current profile
      const originalProfile = await client.users.getCurrentUser.query();
      
      // Update only theme
      const themeUpdate = {
        preferences: {
          theme: originalProfile.preferences.theme === 'dark' ? 'light' : 'dark'
        }
      };
      
      const result = await client.users.updateProfile.mutate(themeUpdate);
      
      // Validate that only theme was updated
      expect(result.preferences.theme).toEqual(themeUpdate.preferences.theme);
      expect(result.name).toEqual(originalProfile.name);
      
      // Verify default view wasn't changed
      if (originalProfile.preferences.defaultView) {
        expect(result.preferences.defaultView).toEqual(originalProfile.preferences.defaultView);
      }
    });
    
    it('should reject profile updates when not authenticated', async () => {
      // Clear token to simulate unauthenticated request
      localStorageMock.removeItem('token');
      
      // Try to update profile without authentication
      await expect(client.users.updateProfile.mutate({ name: 'New Name' }))
        .rejects.toThrow(/authentication|unauthorized/i);
    });
  });
  
  describe('Authentication Token Handling', () => {
    beforeEach(async () => {
      // Register and login a test user
      const registerResult = await client.users.register.mutate(generateTestUser());
      
      const loginResult = await client.users.login.mutate({
        email: registerResult.email,
        password: testUser.password
      });
      
      localStorageMock.setItem('token', loginResult.token);
    });
    
    it('should maintain authentication across requests', async () => {
      // Make multiple authenticated requests
      const profile1 = await client.users.getCurrentUser.query();
      const profile2 = await client.users.getCurrentUser.query();
      
      // Verify we get the same user info in both requests
      expect(profile1.id).toEqual(profile2.id);
      expect(profile1.email).toEqual(profile2.email);
    });
    
    it('should lose authentication when token is removed', async () => {
      // First verify we can make an authenticated request
      const profile = await client.users.getCurrentUser.query();
      expect(profile).toBeDefined();
      
      // Remove token
      localStorageMock.removeItem('token');
      
      // Verify next request fails
      await expect(client.users.getCurrentUser.query())
        .rejects.toThrow(/authentication|unauthorized/i);
    });
  });
  
  // Clean up test users if necessary
  // This would require admin access, which might not be available in test environment
  // Consider adding if you have admin credentials for testing
});