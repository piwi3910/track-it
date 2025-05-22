/**
 * Example test file demonstrating how to use the API test utilities
 */

import {
  createTestClient,
  isBackendRunning,
  mockStorage,
  authenticateTestUser,
  generators,
  testSetup,
  testTeardown,
  assertions
} from './api-test-utils';

/**
 * Example test suite for tasks API
 */
describe('Tasks API Integration Example', () => {
  // Test client and cleanup list
  let client: ReturnType<typeof createTestClient>;
  const createdTaskIds: string[] = [];
  
  // Set up test environment - run before all tests
  beforeAll(async () => {
    // Check if backend is running
    const backendAvailable = await isBackendRunning();
    if (!backendAvailable) {
      console.error('Backend not available - skipping tests');
      return;
    }
    
    // Initialize test client
    client = createTestClient();
    
    // Authenticate with test user
    try {
      await authenticateTestUser();
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  });
  
  // Clean up after all tests
  afterAll(async () => {
    // Clean up any tasks created during tests
    await testTeardown.cleanupTestTasks(client, createdTaskIds);
    
    // Clear storage
    mockStorage.clear();
  });
  
  // Example test: Create a task
  it('should create a new task', async () => {
    // Skip if not fully initialized
    if (!client) return;
    
    // Generate test task data
    const taskData = generators.task({
      title: `Example Test Task ${Date.now()}`,
      priority: 'high'
    });
    
    // Create task
    const result = await client.tasks.create.mutate(taskData);
    
    // Add to cleanup list
    if (result?.id) {
      createdTaskIds.push(result.id);
    }
    
    // Assert the result
    assertions.assertValidTask(result, taskData);
    expect(result.priority).toBe('high');
  });
  
  // Example test: Get tasks by status
  it('should retrieve tasks by status', async () => {
    // Skip if not fully initialized
    if (!client) return;
    
    // Create a test task with specific status
    const taskData = generators.task({
      status: 'in_progress'
    });
    
    const task = await testSetup.createTestTask(
      client,
      taskData,
      createdTaskIds
    );
    
    // Get tasks with that status
    const results = await client.tasks.getByStatus.query({ status: 'in_progress' });
    
    // Validate response
    expect(Array.isArray(results)).toBe(true);
    
    // Check if our test task is in the results
    const foundTask = results.find(t => t.id === task.id);
    expect(foundTask).toBeDefined();
    
    // Check structure and data
    if (foundTask) {
      assertions.assertValidTask(foundTask, taskData);
    }
  });
  
  // Example test: Create multiple tasks and search
  it('should create multiple tasks and search them', async () => {
    // Skip if not fully initialized
    if (!client) return;
    
    // Create multiple test tasks
    const searchTerm = `UNIQUESEARCH${Date.now()}`;
    
    await testSetup.createMultipleTestTasks(
      client,
      3,
      {
        title: `${searchTerm} Task`,
        tags: ['search-test']
      },
      createdTaskIds
    );
    
    // Search for tasks with our unique term
    const results = await client.tasks.search.query({ query: searchTerm });
    
    // Validate response
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(3);
    
    // Check that all found tasks have our search term
    results.forEach(task => {
      expect(task.title).toContain(searchTerm);
    });
  });
});

/**
 * Example test suite for authentication
 */
describe('Authentication API Example', () => {
  let client: ReturnType<typeof createTestClient>;
  
  beforeAll(async () => {
    const backendAvailable = await isBackendRunning();
    if (!backendAvailable) {
      console.error('Backend not available - skipping tests');
      return;
    }
    
    client = createTestClient();
  });
  
  beforeEach(() => {
    // Clear storage before each test
    mockStorage.clear();
  });
  
  it('should authenticate a valid user', async () => {
    // Skip if not fully initialized
    if (!client) return;
    
    const { token, user } = await authenticateTestUser();
    
    // Verify we got a token
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(10);
    
    // Verify user data
    expect(user.id).toBeDefined();
    expect(user.name).toBeDefined();
    expect(user.email).toBeDefined();
    
    // Verify token was stored
    expect(mockStorage.getItem('token')).toBe(token);
  });
  
  it('should get current user after authentication', async () => {
    // Skip if not fully initialized
    if (!client) return;
    
    // Authenticate
    await authenticateTestUser();
    
    // Get current user
    const userResult = await client.users.getCurrentUser.query();
    
    // Validate response
    assertions.assertValidUser(userResult);
  });
  
  it('should reject unauthorized requests', async () => {
    // Skip if not fully initialized
    if (!client) return;
    
    // Ensure we're logged out
    mockStorage.removeItem('token');
    
    // Try to get current user without auth
    await expect(client.users.getCurrentUser.query())
      .rejects.toThrow(/authentication|unauthorized/i);
  });
});

/**
 * Example of advanced test setup with shared test state
 */
describe('Advanced Testing Example', () => {
  let testState: {
    client: ReturnType<typeof createTestClient>;
    auth?: { token: string; user: Partial<User> };
    testTaskId?: string;
    createdItemIds: {
      tasks: string[];
      templates: string[];
      comments: string[];
    };
  };
  
  beforeAll(async () => {
    // Initialize state
    testState = {
      client: createTestClient(),
      createdItemIds: {
        tasks: [],
        templates: [],
        comments: []
      }
    };
    
    try {
      // Set up test environment
      const { client, auth } = await testSetup.initializeTestEnvironment();
      
      // Update state with initialized values
      testState.client = client;
      testState.auth = auth;
      
      // Create a shared task for tests that need it
      const testTask = await testSetup.createTestTask(
        client,
        { title: 'Shared Test Task' },
        testState.createdItemIds.tasks
      );
      
      testState.testTaskId = testTask.id;
    } catch (error) {
      console.error('Test setup failed:', error);
    }
  });
  
  afterAll(async () => {
    if (testState.client) {
      // Full test environment teardown
      await testTeardown.teardownTestEnvironment(
        testState.client,
        {
          taskIds: testState.createdItemIds.tasks,
          templateIds: testState.createdItemIds.templates,
          commentIds: testState.createdItemIds.comments
        }
      );
    }
  });
  
  it('should use shared test task', async () => {
    // Skip if setup failed
    if (!testState.client || !testState.testTaskId) {
      console.warn('Test environment not properly initialized');
      return;
    }
    
    // Get our shared task
    const task = await testState.client.tasks.getById.query({ 
      id: testState.testTaskId 
    });
    
    // Validate
    expect(task).toBeDefined();
    expect(task.id).toBe(testState.testTaskId);
    expect(task.title).toBe('Shared Test Task');
  });
  
  it('should add a comment to shared test task', async () => {
    // Skip if setup failed
    if (!testState.client || !testState.testTaskId) {
      console.warn('Test environment not properly initialized');
      return;
    }
    
    // Generate comment data
    const commentData = generators.comment(testState.testTaskId);
    
    // Create comment
    const comment = await testState.client.comments.create.mutate({
      taskId: testState.testTaskId,
      text: commentData.text
    });
    
    // Add to cleanup
    if (comment?.id) {
      testState.createdItemIds.comments.push(comment.id);
    }
    
    // Validate
    expect(comment).toBeDefined();
    expect(comment.id).toBeDefined();
    expect(comment.taskId).toBe(testState.testTaskId);
    expect(comment.text).toBe(commentData.text);
  });
});