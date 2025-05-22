# Track-It Test Scripts

This directory contains test scripts for the Track-It application.

## Frontend-Backend Integration Tests

These scripts test the integration between the frontend and backend components using live tRPC calls.

### Running the Complete Test Suite

To run all tests together:

```bash
node scripts/test-suite.js
```

This will execute all test scripts in sequence and provide a summary of the results.

### Individual Test Scripts

You can also run individual test scripts:

#### Authentication Tests

- **Login Flow**: `node scripts/test-live-login.js`
  - Tests login with valid and invalid credentials
  - Tests token retrieval and storage
  - Tests authenticated API calls
  - Tests logout functionality

- **Registration Flow**: `node scripts/test-live-registration.js`
  - Tests user registration with new credentials
  - Tests login with newly registered user
  - Tests for duplicate email validation
  - Tests profile access after authentication

#### User Profile Tests

- **User Profile Management**: `node scripts/test-live-user-profile.js`
  - Tests fetching the current user profile
  - Tests updating profile information (name, avatar)
  - Tests updating user preferences (theme, default view)
  - Tests Google integration settings

#### Task Management Tests

- **Task Management**: `node scripts/test-live-tasks.js`
  - Tests task creation
  - Tests retrieving tasks by ID
  - Tests updating task properties
  - Tests retrieving all tasks
  - Tests filtering tasks by status
  - Tests task deletion

#### Comment Management Tests

- **Comment Management**: `node scripts/test-live-comments.js`
  - Tests adding comments to tasks
  - Tests retrieving task comments
  - Tests adding replies to comments
  - Tests updating comments
  - Tests deleting comments and replies

### Mock API Tests

- **API Availability**: `node scripts/test-api-availability.js`
  - Tests the API health endpoint
  - Verifies backend server connectivity

- **Mock API Switch**: `node scripts/test-mock-api-switch.js`
  - Tests switching between mock and live API
  - Verifies that the API context is working correctly

- **Login (Mock)**: `node scripts/test-login.js`
  - Tests the login functionality with mock data
  - Useful for frontend-only testing

## Prerequisites

Before running these tests:

1. Make sure the backend server is running:
   ```bash
   cd ../backend
   npm run dev
   ```

2. Make sure the database services are running:
   ```bash
   docker-compose up -d
   ```

3. Make sure you have the test dependencies installed:
   ```bash
   npm install
   ```

## Troubleshooting

- **Backend Connection Issues**: The tests automatically check for backend availability before starting. Make sure the backend is running on http://localhost:3001.

- **Authentication Failures**: The test scripts use default credentials (`demo@example.com` / `password123`). Make sure the database is properly seeded with this user.

- **Database Errors**: Check the database connection and schema. Run `npx prisma migrate reset` in the backend directory if needed.

- **Test Failures**: The test scripts will log detailed error information to help diagnose issues.

If you're still having issues, please open an issue in the GitHub repository.

## Extending Tests

To add new tests:

1. Create a new test script file in the scripts directory
2. Follow the pattern of existing scripts
3. Add the script name to the `tests` array in `test-suite.js`