# API Testing Utilities

This directory contains comprehensive utilities for testing the Track-It API in integration tests. These utilities make it easier to write consistent, maintainable tests that verify the behavior of the API.

## Overview

The utilities include:

- **API client creation**: Create test clients that interact with the backend
- **Authentication helpers**: Simplify logging in and managing auth tokens
- **Test data generators**: Create realistic test data for users, tasks, comments, etc.
- **Setup/teardown helpers**: Initialize test environments and clean up after tests
- **Assertions**: Validate API responses with specialized assertions
- **Health checking**: Verify the backend is running and responding correctly
- **Error diagnostics**: Analyze API errors for better debugging

## Getting Started

To use these utilities in your tests, import the functions you need:

```typescript
import {
  createTestClient,
  authenticateTestUser,
  isBackendRunning,
  generators,
  testSetup,
  testTeardown,
  assertions
} from '../utils';
```

## Basic Usage Pattern

Here's a basic pattern for writing integration tests:

```typescript
describe('Feature Test Suite', () => {
  // Test client and cleanup tracking
  let client;
  const createdTaskIds = [];
  
  // Set up test environment before tests
  beforeAll(async () => {
    // Check if backend is running
    const backendAvailable = await isBackendRunning();
    if (!backendAvailable) {
      console.error('Backend not available - skipping tests');
      return;
    }
    
    // Initialize client and authenticate
    client = createTestClient();
    await authenticateTestUser();
  });
  
  // Clean up after tests
  afterAll(async () => {
    await testTeardown.cleanupTestTasks(client, createdTaskIds);
  });
  
  // Your test cases
  it('should perform an operation', async () => {
    // Generate test data
    const testData = generators.task();
    
    // Perform API operation
    const result = await client.tasks.create.mutate(testData);
    
    // Track created resources for cleanup
    createdTaskIds.push(result.id);
    
    // Assert results
    assertions.assertValidTask(result, testData);
  });
});
```

## Key Utilities

### API Client

```typescript
// Create a test client for the API
const client = createTestClient();
```

### Authentication

```typescript
// Login with default test user
await authenticateTestUser();

// Login with custom credentials
await authenticateTestUser('user@example.com', 'password');

// Log out
logoutTestUser();
```

### Test Data Generation

```typescript
// Generate random task data
const taskData = generators.task({
  status: 'in_progress',
  priority: 'high'
});

// Generate user data
const userData = generators.user({
  name: 'Custom Test User'
});

// Generate comment for a task
const commentData = generators.comment(taskId);

// Generate template data
const templateData = generators.template({
  isPublic: false
});
```

### Setup Helpers

```typescript
// Initialize the full test environment
const { client, auth } = await testSetup.initializeTestEnvironment();

// Create a test task and track it for cleanup
const task = await testSetup.createTestTask(
  client,
  { title: 'Test Task' },
  createdTaskIds
);

// Create multiple test tasks at once
const tasks = await testSetup.createMultipleTestTasks(
  client,
  5, // Create 5 tasks
  { status: 'todo' },
  createdTaskIds
);
```

### Teardown Helpers

```typescript
// Clean up test tasks
await testTeardown.cleanupTestTasks(client, taskIds);

// Clean up test templates
await testTeardown.cleanupTestTemplates(client, templateIds);

// Full environment teardown
await testTeardown.teardownTestEnvironment(client, {
  taskIds,
  templateIds,
  commentIds
});
```

### Assertions

```typescript
// Validate a task has the right structure and data
assertions.assertValidTask(task, expectedData);

// Validate a template
assertions.assertValidTemplate(template, expectedData);

// Validate a user
assertions.assertValidUser(user, expectedData);
```

### API Health Checking

```typescript
// Check if the backend is available (simple)
const isAvailable = await isBackendRunning();

// Detailed health check
const healthStatus = await checkApiHealth(true); // true for verbose output
```

### Error Diagnostics

```typescript
try {
  await client.tasks.getById.query({ id: 'invalid-id' });
} catch (error) {
  // Analyze and log the error
  logApiError(error, 'getTaskById');
  
  // Get detailed error diagnosis
  const diagnosis = diagnoseApiError(error);
  console.log(`Error category: ${diagnosis.category}`);
}
```

## Examples

See the `test-examples.ts` file for complete examples of how to use these utilities in different testing scenarios.

## Best Practices

1. **Always check backend availability** before running tests
2. **Track created resources** to ensure proper cleanup
3. **Use the generators** to create randomized test data
4. **Use assertions** to validate API responses consistently
5. **Initialize the test environment** at the beginning of your test suite
6. **Clean up after tests** to avoid test pollution

## Troubleshooting

If your tests fail with connection errors:
1. Check that the backend server is running on port 3001
2. Verify network connectivity
3. Use `checkApiHealth(true)` to get detailed diagnostics
4. Check authentication status if you're getting unauthorized errors