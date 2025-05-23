/**
 * Integration test for user profile management API
 * 
 * This test validates the user profile management flow between the frontend and backend.
 * It tests retrieving and updating user profile information.
 */

import { createTestClient, mockLocalStorage, isBackendAvailable, loginTestUser } from '../testHelpers';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import type { User } from '@track-it/shared/types/trpc';

// Before running tests, check if the backend server is available and log in
beforeAll(async () => {
  // Set up global localStorage mock
  (global as typeof globalThis & { localStorage: typeof mockLocalStorage }).localStorage = mockLocalStorage;
  
  // Check if backend is available
  const serverAvailable = await isBackendAvailable();
  if (!serverAvailable) {
    console.error('\x1b[31m%s\x1b[0m', '⛔ Backend server is not running!');
    console.error('\x1b[33m%s\x1b[0m', 'Please start the backend server with: cd ../backend && npm run dev');
    // This will make Jest skip all tests
    throw new Error('Backend server is not running. Tests will be skipped.');
  }
  
  // Login as default test user
  try {
    await loginTestUser();
  } catch {
    console.error('\x1b[31m%s\x1b[0m', '⛔ Login failed!');
    console.error('\x1b[33m%s\x1b[0m', 'Make sure the demo user exists in the database.');
    throw new Error('Authentication failed. Tests will be skipped.');
  }
});

describe('User Profile API Integration', () => {
  let client: ReturnType<typeof createTestClient>;
  let originalProfile: User | undefined;
  
  beforeEach(() => {
    client = createTestClient();
  });
  
  // Store original profile data for restoration after tests
  beforeAll(async () => {
    client = createTestClient();
    const result = await client.users.getCurrentUser.query();
    originalProfile = result;
  });
  
  // Restore original profile data after tests
  afterAll(async () => {
    if (originalProfile) {
      try {
        await client.users.updateProfile.mutate({
          name: originalProfile.name,
          avatarUrl: originalProfile.avatarUrl,
          preferences: originalProfile.preferences
        });
      } catch (error) {
        console.warn('Failed to restore original profile data:', error);
      }
    }
  });
  
  describe('Profile Retrieval', () => {
    it('should successfully retrieve current user profile', async () => {
      // Get current user profile
      const result = await client.users.getCurrentUser.query();
      
      // Check response
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBeDefined();
      expect(result.email).toBeDefined();
      expect(result.role).toBeDefined();
      expect(result.preferences).toBeDefined();
    });
  });
  
  describe('Profile Updates', () => {
    it('should update profile name', async () => {
      const newName = `Updated Name ${Date.now()}`;
      
      // Update profile name
      const result = await client.users.updateProfile.mutate({
        name: newName
      });
      
      // Check response
      expect(result).toBeDefined();
      expect(result.name).toEqual(newName);
      
      // Verify update by getting profile again
      const updatedProfile = await client.users.getCurrentUser.query();
      expect(updatedProfile.name).toEqual(newName);
    });
    
    it('should update theme preference', async () => {
      // Get current theme
      const currentProfile = await client.users.getCurrentUser.query();
      const currentTheme = currentProfile.preferences?.theme || 'light';
      
      // Choose opposite theme
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      // Update theme preference
      const result = await client.users.updateProfile.mutate({
        preferences: {
          theme: newTheme
        }
      });
      
      // Check response
      expect(result).toBeDefined();
      expect(result.preferences).toBeDefined();
      expect(result.preferences.theme).toEqual(newTheme);
      
      // Verify update by getting profile again
      const updatedProfile = await client.users.getCurrentUser.query();
      expect(updatedProfile.preferences.theme).toEqual(newTheme);
    });
    
    it('should update default view preference', async () => {
      // Update default view preference
      const result = await client.users.updateProfile.mutate({
        preferences: {
          defaultView: 'calendar'
        }
      });
      
      // Check response
      expect(result).toBeDefined();
      expect(result.preferences).toBeDefined();
      expect(result.preferences.defaultView).toEqual('calendar');
      
      // Verify update by getting profile again
      const updatedProfile = await client.users.getCurrentUser.query();
      expect(updatedProfile.preferences.defaultView).toEqual('calendar');
    });
    
    it('should update avatar URL', async () => {
      const newAvatarUrl = `https://i.pravatar.cc/150?u=test${Date.now()}`;
      
      // Update avatar URL
      const result = await client.users.updateProfile.mutate({
        avatarUrl: newAvatarUrl
      });
      
      // Check response
      expect(result).toBeDefined();
      expect(result.avatarUrl).toEqual(newAvatarUrl);
      
      // Verify update by getting profile again
      const updatedProfile = await client.users.getCurrentUser.query();
      expect(updatedProfile.avatarUrl).toEqual(newAvatarUrl);
    });
    
    it('should update multiple profile fields at once', async () => {
      const updateData = {
        name: `Multi Update ${Date.now()}`,
        avatarUrl: `https://i.pravatar.cc/150?u=multi${Date.now()}`,
        preferences: {
          theme: 'light',
          defaultView: 'dashboard'
        }
      };
      
      // Update multiple fields
      const result = await client.users.updateProfile.mutate(updateData);
      
      // Check response
      expect(result).toBeDefined();
      expect(result.name).toEqual(updateData.name);
      expect(result.avatarUrl).toEqual(updateData.avatarUrl);
      expect(result.preferences.theme).toEqual(updateData.preferences.theme);
      expect(result.preferences.defaultView).toEqual(updateData.preferences.defaultView);
      
      // Verify update by getting profile again
      const updatedProfile = await client.users.getCurrentUser.query();
      expect(updatedProfile.name).toEqual(updateData.name);
      expect(updatedProfile.avatarUrl).toEqual(updateData.avatarUrl);
      expect(updatedProfile.preferences.theme).toEqual(updateData.preferences.theme);
      expect(updatedProfile.preferences.defaultView).toEqual(updateData.preferences.defaultView);
    });
  });
});