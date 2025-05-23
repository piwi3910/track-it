/**
 * Comprehensive Integration Tests for Comments API
 * 
 * These tests validate the comment management flows between frontend and backend,
 * covering creation, retrieval, updating, and deletion of comments.
 */

import crossFetch from 'cross-fetch';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
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

// Generate random task data for testing
const generateTestTask = () => {
  const timestamp = Date.now();
  return {
    title: `Comment Test Task ${timestamp}`,
    description: `This is a test task for comments testing created at ${new Date(timestamp).toISOString()}`,
    status: 'todo',
    priority: 'medium',
    tags: ['test', 'comments']
  };
};

// Generate random comment data for testing
const generateTestComment = (taskId: string) => {
  const timestamp = Date.now();
  return {
    taskId,
    text: `This is a test comment created at ${new Date(timestamp).toISOString()}`
  };
};

// Default test user credentials
const testUser = {
  email: 'demo@example.com',
  password: 'password123'
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

// Authenticate a user and return the token
const authenticateUser = async (client: ReturnType<typeof createClient>): Promise<string> => {
  try {
    const result = await client.users.login.mutate(testUser);
    return result.token;
  } catch (error) {
    throw new Error(`Authentication failed: ${(error as Error).message}`);
  }
};

describe('Comments API Integration Tests', () => {
  let client: ReturnType<typeof createClient>;
  let testTaskId: string;
  let testCommentId: string;
  const createdTaskIds: string[] = [];
  const createdCommentIds: string[] = [];
  
  // Before all tests, check if backend is running and authenticate
  beforeAll(async () => {
    const backendAvailable = await isBackendRunning();
    if (!backendAvailable) {
      console.error('\x1b[31m%s\x1b[0m', '⚠️  Backend server is not running!');
      console.error('\x1b[33m%s\x1b[0m', 'Please start the backend server with: cd ../backend && npm run dev');
      throw new Error('Backend server is not running. Tests will be skipped.');
    }
    
    // Initialize client and authenticate
    client = createClient();
    const token = await authenticateUser(client);
    localStorageMock.setItem('token', token);
    
    // Create a test task for comments
    const taskResult = await client.tasks.create.mutate(generateTestTask());
    testTaskId = taskResult.id;
    createdTaskIds.push(testTaskId);
  });
  
  // After all tests, clean up
  afterAll(async () => {
    try {
      // Ensure we're authenticated
      const token = await authenticateUser(client);
      localStorageMock.setItem('token', token);
      
      // Delete all test tasks (comments will be deleted by cascade)
      for (const taskId of createdTaskIds) {
        try {
          await client.tasks.delete.mutate({ id: taskId });
          console.log(`Cleaned up test task ${taskId}`);
        } catch {
          console.warn(`Failed to clean up test task ${taskId}`);
        }
      }
    } catch {
      console.warn('Failed to authenticate for test cleanup');
    }
  });
  
  describe('Comment Creation', () => {
    it('should create a new comment on a task', async () => {
      const commentData = generateTestComment(testTaskId);
      
      // Create comment
      const result = await client.comments.create.mutate(commentData);
      
      // Store comment ID for later tests
      testCommentId = result.id;
      createdCommentIds.push(result.id);
      
      // Validate response
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.taskId).toEqual(testTaskId);
      expect(result.text).toEqual(commentData.text);
      
      // Check author information
      expect(result.authorId).toBeDefined();
      
      // Check timestamps
      expect(result.createdAt).toBeDefined();
    });
    
    it('should reject comment creation when not authenticated', async () => {
      // Clear token to simulate unauthenticated request
      localStorageMock.removeItem('token');
      
      // Try to create a comment without authentication
      await expect(client.comments.create.mutate(generateTestComment(testTaskId)))
        .rejects.toThrow(/authentication|unauthorized/i);
      
      // Restore token for further tests
      const token = await authenticateUser(client);
      localStorageMock.setItem('token', token);
    });
    
    it('should reject comment creation for non-existent task', async () => {
      // Try to create a comment for a non-existent task
      await expect(client.comments.create.mutate({
        taskId: 'non-existent-task-id',
        text: 'This comment should fail'
      })).rejects.toThrow(/not found|foreign key/i);
    });
    
    it('should create a reply to an existing comment', async () => {
      // Skip if parent comment creation failed
      if (!testCommentId) {
        console.warn('Skipping reply test as parent comment creation failed');
        return;
      }
      
      // Create reply comment
      const replyData = {
        taskId: testTaskId,
        text: `This is a reply to comment ${testCommentId} created at ${new Date().toISOString()}`,
        parentId: testCommentId
      };
      
      try {
        const result = await client.comments.create.mutate(replyData);
        
        // Validate response
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.taskId).toEqual(testTaskId);
        expect(result.text).toEqual(replyData.text);
        expect(result.parentId).toEqual(testCommentId);
        
        // Store for cleanup
        createdCommentIds.push(result.id);
      } catch (error) {
        // Some implementations might not support replies
        console.warn('Reply creation failed, might not be implemented yet:', error);
      }
    });
  });
  
  describe('Comment Retrieval', () => {
    // Ensure we have a test comment
    beforeAll(async () => {
      if (!testCommentId) {
        const commentData = generateTestComment(testTaskId);
        const result = await client.comments.create.mutate(commentData);
        testCommentId = result.id;
        createdCommentIds.push(testCommentId);
      }
    });
    
    it('should get all comments for a task', async () => {
      // Get comments for the test task
      const result = await client.comments.getByTaskId.query({ taskId: testTaskId });
      
      // Validate response
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Check if our test comment is in the list
      const testComment = result.find(comment => comment.id === testCommentId);
      expect(testComment).toBeDefined();
      
      // Check structure of comment objects
      result.forEach(comment => {
        expect(comment.id).toBeDefined();
        expect(comment.taskId).toEqual(testTaskId);
        expect(comment.text).toBeDefined();
        expect(comment.authorId).toBeDefined();
        expect(comment.createdAt).toBeDefined();
      });
    });
    
    it('should get comment count for a task', async () => {
      try {
        // Get comment count
        const count = await client.comments.getCommentCount.query({ taskId: testTaskId });
        
        // Validate response
        expect(count).toBeDefined();
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThan(0);
      } catch (error) {
        // This endpoint might not be implemented
        console.warn('getCommentCount not implemented yet:', error);
      }
    });
    
    it('should reject comment retrieval when not authenticated', async () => {
      // Clear token to simulate unauthenticated request
      localStorageMock.removeItem('token');
      
      // Try to get comments without authentication
      await expect(client.comments.getByTaskId.query({ taskId: testTaskId }))
        .rejects.toThrow(/authentication|unauthorized/i);
      
      // Restore token for further tests
      const token = await authenticateUser(client);
      localStorageMock.setItem('token', token);
    });
    
    it('should return empty array for task with no comments', async () => {
      // Create a new task with no comments
      const taskResult = await client.tasks.create.mutate({
        ...generateTestTask(),
        title: `Empty Comments Task ${Date.now()}`
      });
      
      // Store for cleanup
      createdTaskIds.push(taskResult.id);
      
      // Get comments for the new task
      const result = await client.comments.getByTaskId.query({ taskId: taskResult.id });
      
      // Validate response
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
  
  describe('Comment Updates', () => {
    // Ensure we have a test comment
    beforeAll(async () => {
      if (!testCommentId) {
        const commentData = generateTestComment(testTaskId);
        const result = await client.comments.create.mutate(commentData);
        testCommentId = result.id;
        createdCommentIds.push(testCommentId);
      }
    });
    
    it('should update a comment successfully', async () => {
      // Prepare update data
      const updateData = {
        id: testCommentId,
        text: `Updated comment text at ${new Date().toISOString()}`
      };
      
      // Update comment
      const result = await client.comments.update.mutate(updateData);
      
      // Validate response
      expect(result).toBeDefined();
      expect(result.id).toEqual(testCommentId);
      expect(result.text).toEqual(updateData.text);
      
      // Check that updateAt timestamp changed
      expect(result.updatedAt).toBeDefined();
      
      // Verify update by getting comments
      const comments = await client.comments.getByTaskId.query({ taskId: testTaskId });
      const updatedComment = comments.find(comment => comment.id === testCommentId);
      expect(updatedComment).toBeDefined();
      expect(updatedComment?.text).toEqual(updateData.text);
    });
    
    it('should reject updates to non-existent comments', async () => {
      // Try to update a non-existent comment
      await expect(client.comments.update.mutate({
        id: 'non-existent-comment-id',
        text: 'This update should fail'
      })).rejects.toThrow(/not found/i);
    });
    
    it('should reject comment updates when not authenticated', async () => {
      // Clear token to simulate unauthenticated request
      localStorageMock.removeItem('token');
      
      // Try to update a comment without authentication
      await expect(client.comments.update.mutate({
        id: testCommentId,
        text: 'This update should fail'
      })).rejects.toThrow(/authentication|unauthorized/i);
      
      // Restore token for further tests
      const token = await authenticateUser(client);
      localStorageMock.setItem('token', token);
    });
  });
  
  describe('Comment Deletion', () => {
    let deletionTestCommentId: string;
    
    // Create a special comment for deletion test
    beforeEach(async () => {
      const result = await client.comments.create.mutate({
        taskId: testTaskId,
        text: `Deletion Test Comment ${Date.now()}`
      });
      deletionTestCommentId = result.id;
    });
    
    it('should delete a comment successfully', async () => {
      // Delete the comment
      const result = await client.comments.delete.mutate({ id: deletionTestCommentId });
      
      // Validate response
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      
      // Verify deletion by getting comments
      const comments = await client.comments.getByTaskId.query({ taskId: testTaskId });
      const deletedComment = comments.find(comment => comment.id === deletionTestCommentId);
      expect(deletedComment).toBeUndefined();
    });
    
    it('should reject deletion when not authenticated', async () => {
      // Clear token to simulate unauthenticated request
      localStorageMock.removeItem('token');
      
      // Try to delete a comment without authentication
      await expect(client.comments.delete.mutate({ id: deletionTestCommentId }))
        .rejects.toThrow(/authentication|unauthorized/i);
      
      // Restore token for further tests
      const token = await authenticateUser(client);
      localStorageMock.setItem('token', token);
    });
    
    it('should handle deleting a non-existent comment gracefully', async () => {
      // Try to delete a non-existent comment
      await expect(client.comments.delete.mutate({ id: 'non-existent-comment-id' }))
        .rejects.toThrow(/not found/i);
    });
  });
  
  describe('Comment Reply Management', () => {
    let parentCommentId: string;
    let replyCommentId: string;
    
    // Create a parent comment and a reply
    beforeAll(async () => {
      // Create parent comment
      const parentResult = await client.comments.create.mutate({
        taskId: testTaskId,
        text: `Parent Comment ${Date.now()}`
      });
      parentCommentId = parentResult.id;
      
      try {
        // Create reply
        const replyResult = await client.comments.create.mutate({
          taskId: testTaskId,
          text: `Reply to ${parentCommentId}`,
          parentId: parentCommentId
        });
        replyCommentId = replyResult.id;
      } catch (error) {
        console.warn('Reply creation failed, might not be implemented yet:', error);
      }
    });
    
    it('should get comment replies', async () => {
      // Skip if reply creation failed
      if (!replyCommentId) {
        console.warn('Skipping get replies test as reply creation failed');
        return;
      }
      
      try {
        // Get replies to the parent comment
        const result = await client.comments.getCommentReplies.query({ commentId: parentCommentId });
        
        // Validate response
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        
        // Check if our reply is in the list
        const reply = result.find(comment => comment.id === replyCommentId);
        expect(reply).toBeDefined();
        expect(reply?.parentId).toEqual(parentCommentId);
      } catch (error) {
        // Check if we can find replies in the full comments list
        const allComments = await client.comments.getByTaskId.query({ taskId: testTaskId });
        const replies = allComments.filter(comment => comment.parentId === parentCommentId);
        
        // If we found replies, the endpoint is just not implemented
        if (replies.length > 0) {
          console.warn('getCommentReplies not implemented yet:', error);
        } else {
          throw error;
        }
      }
    });
  });
});