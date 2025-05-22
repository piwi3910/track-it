# API Integration Tests for Track-It Frontend

This directory contains integration tests for the Track-It API client implementation. These tests validate the behavior of our tRPC API client, ensuring it correctly interacts with the backend and handles responses and errors properly.

## Test Structure

- `helpers/` - Utility functions and test helpers
  - `trpc-test-utils.ts` - Helper functions for creating test tRPC clients and related utilities
- `trpc-client.test.ts` - Tests for our main tRPC client implementation
- Additional test files for specific API endpoints

## Running Tests

To run these tests, you can use the following npm scripts:

```bash
# Run all API client tests
npm run test:api-client

# Run all integration tests (requires backend to be running)
npm run test:integration

# Run specific integration test suites
npm run test:integration:auth
npm run test:integration:tasks
npm run test:integration:comments
npm run test:integration:templates
npm run test:integration:workflows
```

## Test Environments

### Unit Tests

Unit tests mock the tRPC client and don't require a backend to be running. These tests validate the client-side behavior, error handling, and retry logic.

### Integration Tests

Integration tests require the backend server to be running. These tests make actual API calls to verify the end-to-end behavior of the client.

To run integration tests:

1. Start the backend server in a separate terminal:
   ```bash
   cd ../backend && npm run dev
   ```

2. Run the integration tests:
   ```bash
   npm run test:integration
   ```

## Writing New Tests

When adding new tests:

1. For unit tests:
   - Mock the tRPC client responses
   - Test error handling and response processing
   - Focus on the client-side logic

2. For integration tests:
   - Use the helpers in `trpc-test-utils.ts`
   - Create isolated test data to prevent test interference
   - Check for backend availability before running tests

## Mocking

The tests use Jest's mocking capabilities:

- `jest.mock()` - To mock modules
- `jest.fn()` - To create mock functions
- `jest.spyOn()` - To spy on function calls

Example of mocking localStorage:

```typescript
const localStorageMock = createLocalStorageMock();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });
```

## Debugging

To debug API requests during tests, set the `DEBUG_API_REQUESTS` environment variable:

```bash
DEBUG_API_REQUESTS=true npm run test:api-client
```

This will log API requests to the console during test execution.