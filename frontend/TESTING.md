# Testing Strategy for Track-It

This document outlines the testing strategy for the Track-It application, focusing on frontend-backend integration testing using Jest.

## Overview

We use Jest as our primary testing framework for both unit tests and integration tests. Integration tests validate that the frontend and backend components work together correctly, focusing on API communication and data flow between the components.

## Testing Structure

Tests are organized in the following directories:

- `/src/__tests__/unit/` - Unit tests for individual components, hooks, utilities, etc.
- `/src/__tests__/integration/` - Integration tests for frontend-backend communication
  - `/src/__tests__/integration/api/` - API integration tests (auth, tasks, etc.)
  - `/src/__tests__/integration/e2e/` - End-to-end user flow tests (upcoming)

## Test Categories

### Unit Tests

Unit tests focus on testing individual functions, components, or modules in isolation. These tests typically mock external dependencies to ensure the unit being tested works correctly on its own.

### Integration Tests

Integration tests focus on how different parts of the application work together. For our application, this primarily means testing the communication between the frontend React components and the backend tRPC API.

The integration tests are further categorized by feature area:

1. **Authentication**
   - Login
   - Registration
   - Token management
   - Session handling

2. **Task Management**
   - Creating tasks
   - Retrieving tasks
   - Updating tasks
   - Deleting tasks

3. **User Management**
   - User profile retrieval
   - User profile updates
   - Preference management

4. **Comment Management**
   - Adding comments to tasks
   - Retrieving comments
   - Updating/deleting comments

## Running Tests

### Prerequisites

Before running integration tests, make sure:

1. The backend server is running locally on port 3001
2. The database is properly initialized
3. Required test users exist in the database

### Test Commands

The following npm scripts are available for running tests:

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run only integration tests
npm run test:integration

# Run tests with coverage report
npm run test:coverage
```

## Writing New Tests

### Integration Test Structure

Integration tests should follow this general structure:

1. **Setup**: Initialize the test environment, including any required authentication
2. **Test Actions**: Execute the API calls being tested
3. **Assertions**: Verify the results match expected outcomes
4. **Cleanup**: Clean up any test data created during the test

### Helper Functions

The test helpers (`/src/__tests__/integration/testHelpers.ts`) provide utility functions for common operations:

- `createTestClient()`: Creates a tRPC client for testing
- `isBackendAvailable()`: Checks if the backend server is running
- `loginTestUser()`: Authenticates a test user and stores the token
- `generators`: Functions for generating random test data

### Example: Testing Task Creation

```typescript
import { createTestClient, loginTestUser, generators } from '../testHelpers';

describe('Task Creation', () => {
  let client;
  
  beforeAll(async () => {
    // Authenticate test user
    await loginTestUser();
    client = createTestClient();
  });
  
  it('should create a new task', async () => {
    // Generate test data
    const taskData = generators.randomTask();
    
    // Call API
    const result = await client.tasks.create.mutate(taskData);
    
    // Verify response
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.title).toEqual(taskData.title);
  });
});
```

## Best Practices

1. **Independence**: Each test should be independent of other tests
2. **Isolation**: Mock external dependencies when possible
3. **Thorough**: Cover both successful and error scenarios
4. **Clean**: Tests should clean up after themselves
5. **Fast**: Tests should run quickly to support rapid development
6. **Readable**: Tests should be easy to understand and maintain

## Mocking

We use Jest's mocking capabilities to mock various browser APIs and external dependencies:

- `localStorage` and `sessionStorage`: Mocked in `setupTests.ts`
- `fetch`: Mocked for HTTP requests that don't use the tRPC client
- External APIs: Mocked using MSW (Mock Service Worker) when needed

## Continuous Integration

Integration tests are part of our CI pipeline and run on every pull request to ensure that changes don't break existing functionality.

For CI environments, we have a special setup that automatically starts the backend server and database before running tests.

## Known Limitations

1. Integration tests require a running backend server
2. Tests may be sensitive to changes in the database schema
3. Some edge cases may not be fully covered

## Further Reading

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing React Applications](https://reactjs.org/docs/testing.html)
- [tRPC Testing Guide](https://trpc.io/docs/v10/testing)