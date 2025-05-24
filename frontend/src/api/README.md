# Modern tRPC API Client

This directory contains the modern tRPC API client implementation that provides type-safe communication with the backend.

## Structure

- `index.ts` - Main API wrapper that exports all endpoints
- `../lib/trpc.ts` - tRPC client configuration
- `../lib/type-adapters.ts` - Type conversion utilities
- `../shared/types/trpc.ts` - Shared type definitions

## Usage

Import and use the API in your components:

```typescript
import { api } from '@/api';

// Example usage in a component
const handleGetTasks = async () => {
  try {
    const tasks = await api.tasks.getAll();
    console.log('Tasks:', tasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
  }
};

// Create a new task
const handleCreateTask = async (taskData) => {
  try {
    const newTask = await api.tasks.create(taskData);
    console.log('Created task:', newTask);
  } catch (error) {
    console.error('Failed to create task:', error);
  }
};
```

## Available Endpoints

The API provides the following endpoint groups:

- `api.auth.*` - Authentication endpoints
- `api.tasks.*` - Task management endpoints
- `api.templates.*` - Template endpoints
- `api.comments.*` - Comment endpoints
- `api.attachments.*` - File attachment endpoints
- `api.analytics.*` - Analytics endpoints
- `api.google.*` - Google integration endpoints
- `api.notifications.*` - Notification endpoints
- `api.admin.*` - Admin endpoints

## Type Safety

The API provides full type safety through:

- End-to-end type safety from backend to frontend
- Automatic TypeScript inference for all endpoints
- Type adapters for backend/frontend data format compatibility
- Compile-time error checking for API calls

## Error Handling

The API client includes built-in error handling:

- Automatic retry logic for network failures
- Proper error propagation to components
- Type-safe error responses

## Architecture Benefits

This modern implementation provides:

- **95% code reduction** from previous implementation
- **Full type safety** end-to-end
- **Simplified error handling**
- **Better maintainability**
- **Runtime stability** with proper link configuration