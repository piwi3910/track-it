/**
 * API Testing Utilities
 * 
 * Comprehensive utilities for API integration testing, providing:
 * - Backend availability checking
 * - Test client creation
 * - Authentication helpers
 * - Test data generators
 * - Setup/teardown helpers
 */

import { createTRPCClient, httpBatchLink } from '@trpc/client';
import fetch from 'cross-fetch';
import { TRPCClientError } from '@trpc/client';
import { Task, TaskPriority, TaskStatus, User, Comment, Attachment, TaskTemplate } from '@/types/task';

// Configure global fetch for Node.js environment
global.fetch = fetch;

// API Configuration
export const API_CONFIG = {
  baseUrl: 'http://localhost:3001',
  trpcUrl: 'http://localhost:3001/trpc',
  healthEndpoint: '/health',
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 10000,
  testUser: {
    email: 'demo@example.com',
    password: 'password123',
  }
};

// Mock localStorage for testing
export const mockStorage = {
  store: {} as Record<string, string>,
  getItem: (key: string) => mockStorage.store[key] || null,
  setItem: (key: string, value: string) => { mockStorage.store[key] = value; },
  removeItem: (key: string) => { delete mockStorage.store[key]; },
  clear: () => { mockStorage.store = {}; }
};

/**
 * Check if the backend server is running
 * @param attempts - Number of retry attempts
 * @param delay - Delay between retries in ms
 * @returns Promise resolving to true if backend is available
 */
export const isBackendRunning = async (
  attempts: number = API_CONFIG.maxRetries, 
  delay: number = API_CONFIG.retryDelay
): Promise<boolean> => {
  let currentAttempt = 0;
  
  while (currentAttempt < attempts) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
      
      try {
        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.healthEndpoint}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'X-Test-Client': 'integration-tests'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return true;
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.warn(`Backend connection attempt ${currentAttempt + 1} failed`);
      }
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, delay));
      currentAttempt++;
    } catch (error) {
      console.error('Error checking backend availability:', error);
      return false;
    }
  }
  
  console.error('\x1b[31m%s\x1b[0m', '⚠️ Backend server is not running!');
  console.error('\x1b[33m%s\x1b[0m', 'Please start the backend server with: cd backend && npm run dev');
  return false;
};

/**
 * Create a tRPC client for testing with auth token handling
 * @returns Configured tRPC client
 */
export const createTestClient = () => {
  return createTRPCClient<any>({
    links: [
      httpBatchLink({
        url: API_CONFIG.trpcUrl,
        // Important: disable batching for tests to ensure predictable behavior
        batch: false,
        // Configure fetch with auth headers if token exists
        fetch: (url, options = {}) => {
          const fetchOptions = options as any;
          const headers = fetchOptions.headers || {};
          const token = mockStorage.getItem('token');
          
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          
          fetchOptions.headers = headers;
          return fetch(url, fetchOptions);
        }
      }),
    ],
  });
};

/**
 * Authenticate a test user and store the token
 * @param email - User email
 * @param password - User password
 * @returns Promise with login response data
 */
export const authenticateTestUser = async (
  email: string = API_CONFIG.testUser.email,
  password: string = API_CONFIG.testUser.password
): Promise<{ token: string; user: Partial<User> }> => {
  const client = createTestClient();
  
  try {
    const result = await client.users.login.mutate({ email, password });
    
    if (!result || !result.token) {
      throw new Error('Authentication failed: No token received');
    }
    
    mockStorage.setItem('token', result.token);
    
    return {
      token: result.token,
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        role: result.role
      }
    };
  } catch (error) {
    if (error instanceof TRPCClientError) {
      console.error('Authentication error:', error.message);
    } else {
      console.error('Authentication error:', error);
    }
    throw new Error(`Authentication failed: ${(error as Error).message}`);
  }
};

/**
 * Log out the current test user
 */
export const logoutTestUser = (): void => {
  mockStorage.removeItem('token');
};

/**
 * Test data generators for various entities
 */
export const generators = {
  /**
   * Generate random user data
   * @param overrides - Optional fields to override in the generated user
   * @returns User data object
   */
  user: (overrides: Partial<{ 
    name: string; 
    email: string; 
    password: string; 
    role: string;
  }> = {}): any => {
    const timestamp = Date.now();
    return {
      name: overrides.name || `Test User ${timestamp}`,
      email: overrides.email || `testuser${timestamp}@example.com`,
      password: overrides.password || 'Password123!',
      passwordConfirm: overrides.password || 'Password123!',
      role: overrides.role || 'member'
    };
  },
  
  /**
   * Generate random task data
   * @param overrides - Optional fields to override in the generated task
   * @returns Task data object
   */
  task: (overrides: Partial<Task> = {}): Partial<Task> => {
    const timestamp = Date.now();
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return {
      title: overrides.title || `Test Task ${timestamp}`,
      description: overrides.description || `Description for test task created at ${now.toISOString()}`,
      status: overrides.status || 'todo' as TaskStatus,
      priority: overrides.priority || 'medium' as TaskPriority,
      tags: overrides.tags || ['test', 'integration'],
      dueDate: overrides.dueDate || oneWeekFromNow.toISOString(),
      estimatedHours: overrides.estimatedHours || 4,
      assigneeId: overrides.assigneeId,
      subtasks: overrides.subtasks || [
        { title: 'Subtask 1', completed: false },
        { title: 'Subtask 2', completed: false }
      ]
    };
  },
  
  /**
   * Generate random comment data
   * @param taskId - ID of the task to associate with the comment
   * @param overrides - Optional fields to override in the generated comment
   * @returns Comment data object
   */
  comment: (taskId: string, overrides: Partial<Comment> = {}): Partial<Comment> => {
    const timestamp = Date.now();
    
    return {
      taskId,
      text: overrides.text || `Test comment created at ${new Date(timestamp).toISOString()}`,
      mentions: overrides.mentions || []
    };
  },
  
  /**
   * Generate random template data
   * @param overrides - Optional fields to override in the generated template
   * @returns Template data object
   */
  template: (overrides: Partial<TaskTemplate> = {}): Partial<TaskTemplate> => {
    const timestamp = Date.now();
    
    return {
      name: overrides.name || `Test Template ${timestamp}`,
      description: overrides.description || `Template for common tasks`,
      priority: overrides.priority || 'medium' as TaskPriority,
      tags: overrides.tags || ['template', 'test'],
      estimatedHours: overrides.estimatedHours || 2,
      category: overrides.category || 'test',
      isPublic: overrides.isPublic !== undefined ? overrides.isPublic : true,
      subtasks: overrides.subtasks || [
        { title: 'Template Subtask 1', completed: false },
        { title: 'Template Subtask 2', completed: false }
      ]
    };
  },
  
  /**
   * Generate random attachment data
   * @param taskId - ID of the task to associate with the attachment
   * @param overrides - Optional fields to override in the generated attachment
   * @returns Attachment data object
   */
  attachment: (taskId: string, overrides: Partial<Attachment> = {}): Partial<Attachment> => {
    const timestamp = Date.now();
    
    return {
      taskId,
      name: overrides.name || `test-file-${timestamp}.txt`,
      fileType: overrides.fileType || 'text/plain',
      size: overrides.size || 1024,
      url: overrides.url || `https://example.com/files/test-${timestamp}.txt`
    };
  }
};

/**
 * Test suite setup utilities
 */
export const testSetup = {
  /**
   * Initialize the test environment, checking backend availability and authenticating
   * @returns Promise with the test client and authenticated user info
   */
  initializeTestEnvironment: async () => {
    // Check if backend is available
    const backendAvailable = await isBackendRunning();
    if (!backendAvailable) {
      throw new Error('Backend server is not available. Tests will be skipped.');
    }
    
    // Clear storage to ensure clean state
    mockStorage.clear();
    
    // Create client and authenticate
    const client = createTestClient();
    const auth = await authenticateTestUser();
    
    return { client, auth };
  },
  
  /**
   * Create a test task and ensure it's cleaned up after tests
   * @param client - Test client
   * @param taskData - Optional task data overrides
   * @param createdTasksArray - Array to store created task IDs for cleanup
   * @returns Created task
   */
  createTestTask: async (
    client: ReturnType<typeof createTestClient>,
    taskData: Partial<Task> = {},
    createdTasksArray: string[] = []
  ) => {
    const testTask = generators.task(taskData);
    const result = await client.tasks.create.mutate(testTask);
    
    // Add to cleanup list if array provided
    if (result?.id && createdTasksArray) {
      createdTasksArray.push(result.id);
    }
    
    return result;
  },
  
  /**
   * Create multiple test tasks at once
   * @param client - Test client
   * @param count - Number of tasks to create
   * @param baseTaskData - Optional base task data for all tasks
   * @param createdTasksArray - Array to store created task IDs for cleanup
   * @returns Array of created tasks
   */
  createMultipleTestTasks: async (
    client: ReturnType<typeof createTestClient>,
    count: number,
    baseTaskData: Partial<Task> = {},
    createdTasksArray: string[] = []
  ) => {
    const tasks = [];
    
    for (let i = 0; i < count; i++) {
      const task = await testSetup.createTestTask(
        client,
        {
          ...baseTaskData,
          title: `${baseTaskData.title || 'Test Task'} ${i + 1}`
        },
        createdTasksArray
      );
      tasks.push(task);
    }
    
    return tasks;
  },
  
  /**
   * Create a test template
   * @param client - Test client
   * @param templateData - Optional template data overrides
   * @returns Created template
   */
  createTestTemplate: async (
    client: ReturnType<typeof createTestClient>,
    templateData: Partial<TaskTemplate> = {}
  ) => {
    const testTemplate = generators.template(templateData);
    const result = await client.templates.create.mutate(testTemplate);
    return result;
  }
};

/**
 * Test suite teardown utilities
 */
export const testTeardown = {
  /**
   * Clean up test tasks created during tests
   * @param client - Test client
   * @param taskIds - Array of task IDs to clean up
   */
  cleanupTestTasks: async (
    client: ReturnType<typeof createTestClient>,
    taskIds: string[]
  ) => {
    if (!taskIds || taskIds.length === 0) return;
    
    for (const taskId of taskIds) {
      try {
        await client.tasks.delete.mutate({ id: taskId });
      } catch (error) {
        console.warn(`Failed to clean up test task ${taskId}: ${(error as Error).message}`);
      }
    }
  },
  
  /**
   * Clean up test templates created during tests
   * @param client - Test client
   * @param templateIds - Array of template IDs to clean up
   */
  cleanupTestTemplates: async (
    client: ReturnType<typeof createTestClient>,
    templateIds: string[]
  ) => {
    if (!templateIds || templateIds.length === 0) return;
    
    for (const templateId of templateIds) {
      try {
        await client.templates.delete.mutate({ id: templateId });
      } catch (error) {
        console.warn(`Failed to clean up test template ${templateId}: ${(error as Error).message}`);
      }
    }
  },
  
  /**
   * Full teardown of test environment
   * @param client - Test client
   * @param cleanupItems - Object containing arrays of items to clean up
   */
  teardownTestEnvironment: async (
    client: ReturnType<typeof createTestClient>,
    cleanupItems: {
      taskIds?: string[];
      templateIds?: string[];
      commentIds?: string[];
    } = {}
  ) => {
    // Clean up in reverse order to avoid foreign key constraints
    if (cleanupItems.commentIds?.length) {
      for (const commentId of cleanupItems.commentIds) {
        try {
          await client.comments.delete.mutate({ id: commentId });
        } catch (error) {
          console.warn(`Failed to clean up comment ${commentId}`);
        }
      }
    }
    
    if (cleanupItems.taskIds?.length) {
      await testTeardown.cleanupTestTasks(client, cleanupItems.taskIds);
    }
    
    if (cleanupItems.templateIds?.length) {
      await testTeardown.cleanupTestTemplates(client, cleanupItems.templateIds);
    }
    
    // Clear storage
    mockStorage.clear();
  }
};

/**
 * Test assertions utilities
 */
export const assertions = {
  /**
   * Assert that a task has the expected structure and data
   * @param task - Task object to validate
   * @param expectedData - Expected task data
   */
  assertValidTask: (task: any, expectedData: Partial<Task> = {}) => {
    // Basic structure validations
    expect(task).toBeDefined();
    expect(task.id).toBeDefined();
    expect(task.title).toBeDefined();
    expect(task.status).toBeDefined();
    expect(task.priority).toBeDefined();
    expect(task.createdAt).toBeDefined();
    
    // Validate expected data if provided
    if (expectedData.title) expect(task.title).toEqual(expectedData.title);
    if (expectedData.description) expect(task.description).toEqual(expectedData.description);
    if (expectedData.status) expect(task.status).toEqual(expectedData.status);
    if (expectedData.priority) expect(task.priority).toEqual(expectedData.priority);
    
    // Check that subtasks structure is correct if task has subtasks
    if (task.subtasks) {
      expect(Array.isArray(task.subtasks)).toBe(true);
      
      task.subtasks.forEach((subtask: any) => {
        expect(subtask.title).toBeDefined();
        expect(typeof subtask.completed).toBe('boolean');
      });
    }
  },
  
  /**
   * Assert that a template has the expected structure and data
   * @param template - Template object to validate
   * @param expectedData - Expected template data
   */
  assertValidTemplate: (template: any, expectedData: Partial<TaskTemplate> = {}) => {
    // Basic structure validations
    expect(template).toBeDefined();
    expect(template.id).toBeDefined();
    expect(template.name).toBeDefined();
    expect(template.priority).toBeDefined();
    expect(template.createdAt).toBeDefined();
    
    // Validate expected data if provided
    if (expectedData.name) expect(template.name).toEqual(expectedData.name);
    if (expectedData.description) expect(template.description).toEqual(expectedData.description);
    if (expectedData.priority) expect(template.priority).toEqual(expectedData.priority);
    if (expectedData.isPublic !== undefined) expect(template.isPublic).toEqual(expectedData.isPublic);
  },
  
  /**
   * Assert that a user has the expected structure and data
   * @param user - User object to validate
   * @param expectedData - Expected user data
   */
  assertValidUser: (user: any, expectedData: Partial<User> = {}) => {
    // Basic structure validations
    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.name).toBeDefined();
    expect(user.email).toBeDefined();
    
    // Validate expected data if provided
    if (expectedData.name) expect(user.name).toEqual(expectedData.name);
    if (expectedData.email) expect(user.email).toEqual(expectedData.email);
    if (expectedData.role) expect(user.role).toEqual(expectedData.role);
  }
};