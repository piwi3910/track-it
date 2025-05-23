/**
 * Integration test for authentication API
 * 
 * This test validates the authentication flow between the frontend and backend.
 * It tests login, registration, and user profile functionality.
 */

import { createTestClient, mockLocalStorage, isBackendAvailable, generators } from '../testHelpers';
import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';

// Before running tests, check if the backend server is available
beforeAll(async () => {
  const serverAvailable = await isBackendAvailable();

  if (!serverAvailable) {
    console.error('\x1b[31m%s\x1b[0m', '⛔ Backend server is not running!');
    console.error('\x1b[33m%s\x1b[0m', 'Please start the backend server with: cd ../backend && npm run dev');
    // This will make Jest skip all tests
    throw new Error('Backend server is not running. Tests will be skipped.');
  }
  
  // Set up global localStorage mock
  (global as unknown as { localStorage: typeof mockLocalStorage }).localStorage = mockLocalStorage;
});

describe('Authentication API Integration', () => {
  let client: ReturnType<typeof createTestClient>;
  let testUser: ReturnType<typeof generators.randomUser>;
  let userId: string;
  
  beforeEach(() => {
    client = createTestClient();
    mockLocalStorage.clear();
    testUser = generators.randomUser();
  });
  
  describe('User Registration', () => {
    it('should successfully register a new user', async () => {
      // Register a new user
      const result = await client.users.register.mutate(testUser);
      
      // Store user ID for later tests
      userId = result.id;
      
      // Check response
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toEqual(testUser.name);
      expect(result.email).toEqual(testUser.email);
    });
    
    it('should not allow registration with existing email', async () => {
      // Try to register the same user again
      await expect(client.users.register.mutate(testUser))
        .rejects.toThrow(/email already exists/i);
    });
  });
  
  describe('User Login', () => {
    it('should successfully login with valid credentials', async () => {
      // Login with the registered user
      const result = await client.users.login.mutate({
        email: testUser.email,
        password: testUser.password
      });
      
      // Store token
      mockLocalStorage.setItem('token', result.token);
      
      // Check response
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.name).toEqual(testUser.name);
      expect(result.email).toEqual(testUser.email);
    });
    
    it('should reject login with invalid credentials', async () => {
      // Try to login with wrong password
      await expect(client.users.login.mutate({
        email: testUser.email,
        password: 'wrongpassword'
      })).rejects.toThrow(/invalid email or password/i);
    });
  });
  
  describe('User Profile', () => {
    it('should get current user profile when authenticated', async () => {
      // First login
      const loginResult = await client.users.login.mutate({
        email: testUser.email,
        password: testUser.password
      });
      
      // Store token
      mockLocalStorage.setItem('token', loginResult.token);
      
      // Create a new client that will include the auth token
      const authenticatedClient = createTestClient();
      
      // Get current user profile
      const result = await authenticatedClient.users.getCurrentUser.query();
      
      // Check response
      expect(result).toBeDefined();
      expect(result.id).toEqual(userId);
      expect(result.name).toEqual(testUser.name);
      expect(result.email).toEqual(testUser.email);
      expect(result.preferences).toBeDefined();
    });
    
    it('should not allow access to user profile when not authenticated', async () => {
      // Clear token
      mockLocalStorage.removeItem('token');
      
      // Create a new client without auth
      const unauthenticatedClient = createTestClient();
      
      // Try to get current user profile
      await expect(unauthenticatedClient.users.getCurrentUser.query())
        .rejects.toThrow(/authentication required/i);
    });
  });
});