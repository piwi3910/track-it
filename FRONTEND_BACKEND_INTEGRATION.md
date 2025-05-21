# Frontend-Backend Integration Testing

This document outlines how to test the integration between the frontend and backend components of the Track-It application.

## Overview

The application consists of a React frontend and a Fastify backend server with tRPC integration for type-safe API calls. This document explains how to test if the integration is working correctly.

## Prerequisites

Before testing, ensure you have the following:

1. Node.js installed (v18+ recommended)
2. Backend dependencies installed: `cd backend && npm install`
3. Frontend dependencies installed: `cd frontend && npm install`
4. Database properly set up (PostgreSQL running via Docker)
5. Redis running (via Docker)

## Starting the Services

1. Start the Docker services:
   ```bash
   docker-compose up -d
   ```

2. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

3. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

## Testing Scripts

Several scripts have been created to test the integration between frontend and backend:

### Login Flow Testing

Test the login functionality with the backend server:

```bash
cd frontend
node scripts/test-live-login.js
```

This script tests:
- Login with valid credentials
- Get current user with valid token
- Logout
- Get current user after logout (should fail)
- Login with invalid credentials

### Registration Flow Testing

Test the user registration functionality with the backend server:

```bash
cd frontend
node scripts/test-live-registration.js
```

This script tests:
- Register a new user with random credentials
- Login with the newly registered user
- Get current user with valid token
- Attempt to register with an email that already exists (should fail)
- Logout

## Manual Testing

You can also manually test the integration by:

1. Start both backend and frontend servers
2. Open the application in a browser at `http://localhost:3000`
3. Try to log in with the default credentials:
   - Email: `demo@example.com`
   - Password: `password123`
4. After logging in, check if you can see the dashboard and tasks

## Troubleshooting

If you encounter issues with the frontend-backend integration:

1. Check the browser console for any errors
2. Verify the backend server is running and accessible at `http://localhost:3001`
3. Check the backend server logs for any errors
4. Verify the database connection is working properly
5. Try running the test scripts to narrow down where the issue might be
6. Check for any CORS issues in the backend server configuration
7. Verify that the tRPC client in the frontend is configured correctly

## Common Issues

- **CORS errors**: Make sure the backend allows requests from the frontend origin
- **Authentication errors**: Check token handling and JWT secret configuration
- **Database connection issues**: Verify database credentials and connection string
- **tRPC version mismatch**: Ensure the same version is used in both frontend and backend
- **API endpoint mismatch**: Verify the API URL in the frontend matches the backend server address

## Next Steps

Once basic authentication flows are working, you can move on to testing other features like:

1. Task management (create, read, update, delete)
2. Comment management
3. User profile updates
4. Template management
5. Analytics features

Each feature should be tested to ensure proper communication between frontend and backend.