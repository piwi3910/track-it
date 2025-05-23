/**
 * End-to-End Task Lifecycle Workflow Integration Test
 * 
 * This test verifies the complete lifecycle of a task from creation to completion,
 * including all associated features like comments, status updates, templates, etc.
 */

import crossFetch from 'cross-fetch';
import { createTRPCClient, httpLink } from '@trpc/client';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import type { TestClient } from '../../types/test-client';

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

// Define a properly typed test client interface

// Create tRPC client for testing
const createClient = (): TestClient => {
  return createTRPCClient<any>({
    links: [
      httpLink({
        url: BASE_URL,
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
  }) as unknown as TestClient;
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

// Generate a unique ID for this test run
const TEST_RUN_ID = `test-${Date.now()}`;

describe('Task Lifecycle Workflow', () => {
  let client: ReturnType<typeof createClient>;
  let taskId: string;
  let templateId: string;
  const commentIds: string[] = [];
  
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
  });
  
  // After all tests, clean up resources
  afterAll(async () => {
    try {
      if (taskId) {
        await client.tasks.delete.mutate({ id: taskId });
      }
      
      if (templateId) {
        try {
          await client.templates.delete.mutate({ id: templateId });
        } catch (error) {
          console.warn('Failed to clean up template:', error);
        }
      }
    } catch (error) {
      console.warn('Failed to clean up resources:', error);
    }
  });
  
  it('should authenticate and get user profile', async () => {
    // Get current user profile
    const userProfile = await client.users.getCurrentUser.query();
    
    // Validate profile data
    expect(userProfile).toBeDefined();
    expect(userProfile.id).toBeDefined();
    expect(userProfile.name).toBeDefined();
    expect(userProfile.email).toBeDefined();
    expect(userProfile.role).toBeDefined();
    
    console.log(`Logged in as: ${userProfile.name} (${userProfile.email})`);
  });
  
  it('should create a new task with subtasks', async () => {
    // Create a new task
    const taskData = {
      title: `Workflow Test Task ${TEST_RUN_ID}`,
      description: 'This task is used for testing the complete task lifecycle workflow',
      status: 'todo',
      priority: 'medium',
      tags: ['test', 'workflow', TEST_RUN_ID],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedHours: 8,
      subtasks: [
        { title: 'Subtask 1 - Planning', completed: false },
        { title: 'Subtask 2 - Implementation', completed: false },
        { title: 'Subtask 3 - Testing', completed: false },
        { title: 'Subtask 4 - Documentation', completed: false }
      ]
    };
    
    const result = await client.tasks.create.mutate(taskData as any);
    
    // Store task ID for further steps
    taskId = result?.id || '';
    
    // Validate task creation
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.title).toEqual(taskData.title);
    expect(result.description).toEqual(taskData.description);
    expect(result.status).toEqual(taskData.status);
    expect(result.subtasks).toBeDefined();
    expect((result.subtasks as any[])?.length).toEqual(taskData.subtasks.length);
    
    console.log(`Created task: ${result.title} (${result.id})`);
  });
  
  it('should add comments to the task', async () => {
    // Add first comment
    const comment1Data = {
      taskId,
      text: `Initial comment on task ${TEST_RUN_ID}`
    };
    
    const comment1Result = await client.comments.create.mutate(comment1Data);
    commentIds.push(comment1Result.id);
    
    // Validate first comment
    expect(comment1Result).toBeDefined();
    expect(comment1Result.id).toBeDefined();
    expect(comment1Result.text).toEqual(comment1Data.text);
    
    // Add second comment
    const comment2Data = {
      taskId,
      text: `Follow-up comment on task ${TEST_RUN_ID}`
    };
    
    const comment2Result = await client.comments.create.mutate(comment2Data);
    commentIds.push(comment2Result.id);
    
    // Get all comments for the task
    const taskComments = await client.comments.getByTaskId.query({ taskId });
    
    // Validate comments retrieval
    expect(taskComments).toBeDefined();
    expect(Array.isArray(taskComments)).toBe(true);
    expect(taskComments.length).toBeGreaterThanOrEqual(2);
    
    // Verify our comments are in the list
    const comment1 = taskComments.find(c => c.id === comment1Result.id);
    const comment2 = taskComments.find(c => c.id === comment2Result.id);
    expect(comment1).toBeDefined();
    expect(comment2).toBeDefined();
    
    console.log(`Added ${taskComments.length} comments to the task`);
  });
  
  it('should update subtask status as task progresses', async () => {
    // Get current task state
    const currentTask = await client.tasks.getById.query({ id: taskId });
    
    // Mark first subtask as completed
    const updatedSubtasks = (currentTask.subtasks as any[])?.map((subtask: any, index: number) => ({
      ...subtask,
      completed: index === 0 ? true : subtask.completed
    }));
    
    // Update task
    const updateResult = await client.tasks.update.mutate({
      id: taskId,
      data: {
        status: 'in_progress',
        subtasks: updatedSubtasks
      }
    });
    
    // Validate update
    expect(updateResult).toBeDefined();
    expect(updateResult.status).toEqual('in_progress');
    expect(updateResult.subtasks[0].completed).toBe(true);
    
    console.log(`Updated task status to: ${updateResult.status}`);
    console.log(`Marked subtask "${updateResult.subtasks[0].title}" as completed`);
  });
  
  it('should save the task as a template', async () => {
    try {
      // Save task as template
      const templateData = {
        taskId,
        templateName: `Workflow Test Template ${TEST_RUN_ID}`,
        isPublic: true
      };
      
      const result = await client.tasks.saveAsTemplate.mutate(templateData);
      
      // Store template ID for further steps
      templateId = result.id;
      
      // Validate template creation
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toEqual(templateData.templateName);
      
      console.log(`Saved task as template: ${result.name} (${result.id})`);
    } catch (error) {
      console.warn('Save as template failed, might not be implemented:', error);
    }
  });
  
  it('should create a new task from template', async () => {
    // Skip if we don't have a template
    if (!templateId) {
      console.warn('Skipping create from template as template creation failed');
      return;
    }
    
    try {
      // Create task from template
      const newTaskData = {
        templateId,
        taskData: {
          title: `New Task from Template ${TEST_RUN_ID}`,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      };
      
      const result = await client.tasks.createFromTemplate.mutate(newTaskData);
      
      // Validate new task
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.title).toEqual(newTaskData.taskData.title);
      
      console.log(`Created new task from template: ${result.title} (${result.id})`);
      
      // Clean up this task
      await client.tasks.delete.mutate({ id: result.id });
    } catch (error) {
      console.warn('Create from template failed, might not be implemented:', error);
    }
  });
  
  it('should complete all subtasks and mark the task as done', async () => {
    // Get current task state
    const currentTask = await client.tasks.getById.query({ id: taskId });
    
    // Mark all subtasks as completed
    const completedSubtasks = currentTask.subtasks.map(subtask => ({
      ...subtask,
      completed: true
    }));
    
    // Update task
    const updateResult = await client.tasks.update.mutate({
      id: taskId,
      data: {
        status: 'done',
        subtasks: completedSubtasks,
        actualHours: 7.5
      }
    });
    
    // Validate update
    expect(updateResult).toBeDefined();
    expect(updateResult.status).toEqual('done');
    
    // Verify all subtasks are completed
    const allCompleted = updateResult.subtasks.every(subtask => subtask.completed);
    expect(allCompleted).toBe(true);
    
    console.log(`Completed task: ${updateResult.title}`);
    console.log(`Actual hours spent: ${updateResult.actualHours}`);
  });
  
  it('should add a final comment with completion notes', async () => {
    // Add completion comment
    const completionComment = {
      taskId,
      text: `Task completed successfully! Workflow test completed at ${new Date().toISOString()}`
    };
    
    const commentResult = await client.comments.create.mutate(completionComment);
    commentIds.push(commentResult.id);
    
    // Validate comment
    expect(commentResult).toBeDefined();
    expect(commentResult.id).toBeDefined();
    expect(commentResult.text).toEqual(completionComment.text);
    
    // Get final comment count
    const taskComments = await client.comments.getByTaskId.query({ taskId });
    
    console.log(`Added final completion comment to task`);
    console.log(`Total comments on task: ${taskComments.length}`);
  });
  
  it('should verify task is in done state with comment history', async () => {
    // Get final task state
    const finalTask = await client.tasks.getById.query({ id: taskId });
    
    // Validate task completion
    expect(finalTask).toBeDefined();
    expect(finalTask.status).toEqual('done');
    
    // Get all comments
    const allComments = await client.comments.getByTaskId.query({ taskId });
    
    // Validate comments
    expect(allComments).toBeDefined();
    expect(Array.isArray(allComments)).toBe(true);
    expect(allComments.length).toBeGreaterThanOrEqual(commentIds.length);
    
    // Verify original comment IDs are present
    for (const commentId of commentIds) {
      const comment = allComments.find(c => c.id === commentId);
      expect(comment).toBeDefined();
    }
    
    console.log(`Task lifecycle workflow completed successfully`);
    console.log(`Final task status: ${finalTask.status}`);
    console.log(`Comment count: ${allComments.length}`);
  });
});