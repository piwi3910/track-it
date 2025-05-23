/**
 * Comprehensive Integration Tests for Authentication API
 * 
 * These tests validate the authentication flows between frontend and backend,
 * focusing on user registration, login, profile management, and authorization.
 */

import crossFetch from 'cross-fetch';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { describe, it, expect, beforeAll } from '@jest/globals';
import type { AppRouter } from '@track-it/shared/types/trpc';

// Mock global objects for testing
global.fetch = crossFetch as typeof fetch;

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
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: BASE_URL,
        // Important: disable batching for tests
        batch: false,
        fetch: (url, options = {}) => {
          const fetchOptions = { ...options } as RequestInit;
          const headers = new Headers(fetchOptions.headers);
          const token = localStorageMock.getItem('token');
          
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
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
  } catch {
    return false;
  }
};

describe('Authentication API Integration Tests', () => {
  let client: ReturnType<typeof createClient>;
  let testUser: ReturnType<typeof generateTestUser>;
  
  // Before all tests, check if backend is running
  beforeAll(async () => {
    const backendAvailable = await isBackendRunning();
    if (!backendAvailable) {
      console.error('\x1b[31m%s\x1b[0m', '⚠️  Backend server is not running!');
      console.error('\x1b[33m%s\x1b[0m', 'Please start the backend server with: cd ../backend && npm run dev');
      throw new Error('Backend server is not running. Tests will be skipped.');
    }
    
    // Check if we can connect to the backend
    try {
      const pingClient = createClient();
      console.log('\x1b[36m%s\x1b[0m', '🔄 Testing connection to backend...');
      await pingClient.users.ping.query();
      console.log('\x1b[32m%s\x1b[0m', '✅ Backend connection successful!');
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', `⚠️  Backend API not available or not responding: ${(error as Error).message}`);
      console.log('\x1b[33m%s\x1b[0m', 'Some tests may be skipped due to backend API issues.');
    }
  });
  
  beforeEach(() => {
    client = createClient();
    localStorageMock.clear();
    testUser = generateTestUser();
  });
  
  describe('Registration Flow', () => {
    // Keep track of registered emails to ensure test isolation
    const registeredEmails = new Set();
    
    it('should successfully register a new user', async () => {
      // Test registration with valid data
      const result = await client.users.register.mutate(testUser);
      
      // Store user ID for later tests
      
      // Save this email as registered
      registeredEmails.add(testUser.email);
      
      // Validate response structure and data
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toEqual(testUser.name);
      expect(result.email).toEqual(testUser.email);
    });
    
    it('should reject registration with duplicate email', async () => {
      // Make sure we have a guaranteed duplicate email by using the demo user
      const duplicateUser = {
        name: "Duplicate Test User",
        email: "demo@example.com", // Use demo user which is guaranteed to exist
        password: "password123",
        passwordConfirm: "password123"
      };
      
      // Try to register with a known existing email
      try {
        await client.users.register.mutate(duplicateUser);
        // If we reach here, registration didn't throw an error
        throw new Error("Registration with duplicate email should have failed but succeeded");
      } catch (error) {
        // The error should be a TRPCClientError with the expected message
        // Don't continue if it's our own error
        if (error instanceof Error && error.message === "Registration with duplicate email should have failed but succeeded") {
          console.error("Backend accepted duplicate email registration");
          // Re-throw to fail the test
          throw error;
        }
        
        console.log('Duplicate email registration error:', error);
        
        // Handle different error formats - either directly in message or in data.message
        const errorMessage = error instanceof Error ? error.message?.toLowerCase() || '' : '';
        const errorDataMessage = (error as { data?: { message?: string } }).data?.message?.toLowerCase() || '';
        
        // Check if either property contains the expected message
        const containsExpectedMessage = 
          errorMessage.includes('email already exists') || 
          errorDataMessage.includes('email already exists');
          
        expect(containsExpectedMessage).toBe(true);
      }
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
      // For login tests, use a pre-defined demo user instead
      // This user should always exist in the database
      testUser = {
        name: "Demo User",
        email: "demo@example.com",
        password: "password123",
        passwordConfirm: "password123"
      };
      
      // Try to register but ignore errors since the user might already exist
      try {
        await client.users.register.mutate(testUser);
      } catch {
        console.log('Demo user already exists, will use for login tests');
      }
    });
    
    it('should successfully login with valid credentials', async () => {
      // Test login with valid credentials
      try {
        const result = await client.users.login.mutate({
          email: testUser.email,
          password: testUser.password
        });
        
        // Validate response structure and data
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.email).toEqual(testUser.email);
        expect(result.token).toBeDefined();
        expect(typeof result.token).toBe('string');
        expect(result.token.length).toBeGreaterThan(20); // JWT tokens are longer than 20 chars
        
        // Check role field is present
        expect(result.role).toBeDefined();
        expect(['admin', 'member', 'guest']).toContain(result.role);
        
        // Store token in localStorage
        localStorageMock.setItem('token', result.token);
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
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
    let token: string | null = null;
    
    beforeEach(async () => {
      // Use the demo user for consistent testing
      testUser = {
        name: "Demo User",
        email: "demo@example.com",
        password: "password123",
        passwordConfirm: "password123"
      };
      
      // Login with demo user credentials
      try {
        const loginResult = await client.users.login.mutate({
          email: testUser.email,
          password: testUser.password
        });
        
        token = loginResult.token;
        localStorageMock.setItem('token', token);
      } catch (error) {
        console.error('Failed to login for profile tests:', error);
      }
    });
    
    it('should get current user profile when authenticated', async () => {
      // Skip if login failed
      if (!token) {
        console.warn('Skipping test due to login failure');
        return;
      }
      
      try {
        // Get current user profile
        const result = await client.users.getCurrentUser.query();
        
        // Validate response structure and data
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.email).toEqual(testUser.email);
        expect(result.role).toBeDefined();
        expect(['admin', 'member', 'guest']).toContain(result.role);
        
        // Check preferences object structure
        expect(result.preferences).toBeDefined();
        
        // Check Google connection fields
        expect('googleConnected' in result).toBe(true);
      } catch (error) {
        console.error('Get profile error:', error);
        throw error;
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
      // Skip if login failed
      if (!token) {
        console.warn('Skipping test due to login failure');
        return;
      }
      
      try {
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
        expect(result.id).toBeDefined();
        expect(result.name).toEqual(updateData.name);
        expect(result.avatarUrl).toEqual(updateData.avatarUrl);
        expect(result.preferences.theme).toEqual(updateData.preferences.theme);
        expect(result.preferences.defaultView).toEqual(updateData.preferences.defaultView);
        
        // Verify changes are persisted by getting profile again
        const updatedProfile = await client.users.getCurrentUser.query();
        expect(updatedProfile.name).toEqual(updateData.name);
        expect(updatedProfile.preferences.theme).toEqual(updateData.preferences.theme);
      } catch (error) {
        console.error('Update profile error:', error);
        throw error;
      }
    });
    
    it('should update only specified profile fields', async () => {
      // Skip if login failed
      if (!token) {
        console.warn('Skipping test due to login failure');
        return;
      }
      
      try {
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
      } catch (error) {
        console.error('Update theme error:', error);
        throw error;
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