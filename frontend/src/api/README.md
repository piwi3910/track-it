# Mock API with tRPC Pattern

This directory contains a mock API implementation that follows the tRPC pattern, making it easy to replace with a real tRPC API in the future.

## Structure

- `/trpc-mock/` - Contains the mock tRPC implementation
  - `client.ts` - Main client API that mimics tRPC client
  - `types.ts` - Type definitions for API procedures and inputs/outputs
  - `trpc.ts` - Mock implementation of tRPC core functionality
  - `router.ts` - Main router combining all sub-routers
  - `db.ts` - Mock database with centralized data access methods
  - `/routers/` - Individual domain routers
    - `tasks.ts` - Task-related endpoints
    - `templates.ts` - Template-related endpoints
    - `users.ts` - User-related endpoints
    - `comments.ts` - Comment-related endpoints
    - `attachments.ts` - Attachment-related endpoints
    - `analytics.ts` - Analytics-related endpoints
    - `googleIntegration.ts` - Google integration endpoints
    - `notifications.ts` - Notification-related endpoints

## Usage

Import and use the API in your components:

```typescript
import { api, apiHandler } from '@/api';

// Example usage in a component
const handleGetTasks = async () => {
  const { data, error } = await apiHandler(() => api.tasks.getAll());
  
  if (error) {
    console.error('Failed to fetch tasks:', error);
    return;
  }
  
  // Use the data
  console.log('Tasks:', data);
};
```

## Migrating to Real tRPC

When ready to migrate to a real tRPC implementation:

1. Create a real tRPC API with the same router structure
2. Replace the exports in `index.ts` to use the real client
3. No changes needed in components that use the API

## Type Safety

The mock API provides the same type safety as a real tRPC implementation, ensuring:

- Correct input types for procedures
- Type-safe return values
- Autocomplete for available endpoints