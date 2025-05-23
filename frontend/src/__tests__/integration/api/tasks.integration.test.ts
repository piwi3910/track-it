/**
 * Integration test for tasks API
 * 
 * This test validates the task management flow between the frontend and backend.
 * It tests creating, retrieving, updating, and deleting tasks.
 */

import { createTestClient, mockLocalStorage, isBackendAvailable, loginTestUser, generators } from '../testHelpers';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';

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

describe('Tasks API Integration', () => {
  let client: ReturnType<typeof createTestClient>;
  let taskId: string;
  
  beforeEach(() => {
    client = createTestClient();
  });
  
  afterAll(async () => {
    // Clean up any tasks created during testing
    if (taskId) {
      try {
        await client.tasks.delete.mutate({ id: taskId });
      } catch {
        // Ignore errors during cleanup
      }
    }
  });
  
  describe('Task Creation', () => {
    it('should successfully create a new task', async () => {
      const taskData = generators.randomTask();
      
      // Create a new task
      const result = await client.tasks.create.mutate(taskData);
      
      // Store task ID for later tests
      taskId = result.id;
      
      // Check response
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toEqual(taskData.title);
      expect(result.description).toEqual(taskData.description);
      expect(result.status).toEqual(taskData.status);
      expect(result.priority).toEqual(taskData.priority);
    });
  });
  
  describe('Task Retrieval', () => {
    it('should get a task by ID', async () => {
      // Get the previously created task
      const result = await client.tasks.getById.query({ id: taskId });
      
      // Check response
      expect(result).toBeDefined();
      expect(result.id).toEqual(taskId);
    });
    
    it('should get all tasks', async () => {
      // Get all tasks
      const result = await client.tasks.getAll.query();
      
      // Check response
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      // Our created task should be in the list
      const createdTask = result.find(task => task.id === taskId);
      expect(createdTask).toBeDefined();
    });
    
    it('should get tasks by status', async () => {
      // Get tasks with status 'todo'
      const result = await client.tasks.getByStatus.query({ status: 'todo' });
      
      // Check response
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      // Our created task should be in the list (if it's a todo task)
      const createdTask = result.find(task => task.id === taskId);
      expect(createdTask).toBeDefined();
    });
  });
  
  describe('Task Updates', () => {
    it('should update a task', async () => {
      const updateData = {
        id: taskId,
        data: {
          title: `Updated Task ${Date.now()}`,
          status: 'in_progress',
          priority: 'high'
        }
      };
      
      // Update the task
      const result = await client.tasks.update.mutate(updateData);
      
      // Check response
      expect(result).toBeDefined();
      expect(result.id).toEqual(taskId);
      expect(result.title).toEqual(updateData.data.title);
      expect(result.status).toEqual(updateData.data.status);
      expect(result.priority).toEqual(updateData.data.priority);
    });
  });
  
  describe('Task Deletion', () => {
    it('should delete a task', async () => {
      // Delete the task
      const result = await client.tasks.delete.mutate({ id: taskId });
      
      // Check response
      expect(result).toBeDefined();
      expect(result.id).toEqual(taskId);
      expect(result.deleted).toBe(true);
      
      // Clear taskId since we've deleted it
      taskId = '';
      
      // Verify task is deleted by trying to get it
      await expect(client.tasks.getById.query({ id: taskId }))
        .rejects.toThrow(); // Should throw a not found error
    });
  });
});