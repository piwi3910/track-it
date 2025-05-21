# Frontend Testing Guide

This document outlines the approach and processes for testing the frontend application against the backend API.

## Integration Testing

The frontend has comprehensive integration tests that verify the correct implementation of the API specification. These tests are located in:

- `/frontend/src/__tests__/integration/api/`

### Running the Tests

To run the integration tests:

```bash
# Start backend server in one terminal
cd backend
npm run dev

# Run all integration tests in another terminal
cd frontend
NODE_OPTIONS=--experimental-vm-modules npx jest src/__tests__/integration/
```

You can also run specific test files:

```bash
# Run just the authentication tests
NODE_OPTIONS=--experimental-vm-modules npx jest src/__tests__/integration/api/auth.test.ts

# Run just the task management tests
NODE_OPTIONS=--experimental-vm-modules npx jest src/__tests__/integration/api/tasks.test.ts
```

### Test Structure

The integration tests follow this structure:

1. **Authentication Tests**: Login, registration, profile management
2. **Task Management Tests**: CRUD operations for tasks
3. **Comment Tests**: Adding/editing/deleting comments
4. **Template Tests**: Using and managing task templates
5. **Workflow Tests**: End-to-end task lifecycle flows

### Debugging Integration Issues

If the integration tests are failing:

1. **Check Backend Availability**: Ensure the backend server is running and reachable
2. **Check API Consistency**: Verify that the backend API matches the API specification
3. **Use Debug Scripts**: Run the debug scripts in `/frontend/scripts/` to check specific API interactions
4. **Manual Testing**: Use tools like Postman to manually test API endpoints

An additional debug client is available at `/frontend/src/__tests__/integration/api/debug-client.js` which can be used to test the API directly:

```bash
cd frontend
node src/__tests__/integration/api/debug-client.js
```

### Common Issues and Solutions

#### Error: "Email already exists" doesn't trigger during registration

The backend must properly handle unique constraint violations on email fields and return the error in the format:

```json
{
  "message": "Email already exists",
  "code": "VALIDATION_ERROR"
}
```

#### Error: "Invalid email or password" during login

If users can register but not log in:

1. Check the request format in the frontend client
2. Verify token generation in the backend
3. Check that password verification is working correctly

#### Error: Authentication token issues

When authenticated endpoints fail:

1. Verify token is being properly stored in localStorage
2. Check that Authorization headers are correctly applied
3. Ensure JWT token format is valid and properly verified by the backend

## End-to-End Tests

For complete end-to-end flows like user onboarding or task management lifecycle, refer to the workflow tests in:

- `/frontend/src/__tests__/integration/workflows/`

## Mocking API for Unit Tests

For unit tests that don't need a live backend, you can use the mock API handlers in:

- `/frontend/src/api/mocks/`