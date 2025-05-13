# tRPC Integration

This document describes the tRPC integration between the frontend and backend for Track-It.

## Overview

Track-It uses tRPC v11 to establish type-safe communication between the frontend and backend. This approach provides several benefits:

- Full type safety across the stack
- Automatic API documentation
- Reduced boilerplate code
- Simplified API calls
- Automatic validation

## Architecture

The tRPC integration follows this architecture:

1. **Backend**
   - Defines procedures (query/mutation) with schemas
   - Groups procedures into routers
   - Exposes a main app router
   - Includes caching middleware for performance

2. **Shared Types**
   - Exports router type definitions
   - Used by both frontend and backend
   - Ensures type consistency

3. **Frontend**
   - Creates a tRPC client
   - Connects to the backend API
   - Provides hooks for data fetching
   - Includes error handling and authentication

## Backend Implementation

### Router Structure

Our backend organizes procedures into domain-specific routers:

- tasks.router.ts
- users.router.ts
- templates.router.ts
- comments.router.ts
- attachments.router.ts
- analytics.router.ts
- googleIntegration.router.ts
- notifications.router.ts
- cachedTasks.router.ts (with Redis caching)
- cacheAdmin.router.ts (for cache management)

These are combined into a main router in `src/trpc/router.ts`.

### Procedure Types

The API includes three types of procedures:

1. **Public Procedures**: Available without authentication
2. **Protected Procedures**: Require authentication
3. **Admin Procedures**: Require admin role

### Redis Caching

Certain procedures use Redis caching for performance optimization:

- Cache-first strategy for reads
- Automatic invalidation on writes
- Configurable TTLs for different resources
- Monitoring and administration APIs

## Frontend Implementation

### Client Configuration

The tRPC client is configured in `src/utils/trpc-client.ts` with:

- HTTP batch link for request batching
- Logging in development mode
- Authentication token management
- Error handling

### API Service

The `src/api/trpc-api-client.ts` file provides a domain-specific API layer:

- Organized by resource type (tasks, users, etc.)
- Consistent error handling
- Type-safe parameters and responses
- Authentication handling

### Mock API Support

The system supports a mock API mode for development and testing:

- Toggle in environment variables (VITE_USE_MOCK_API)
- Fallback when backend unavailable
- Consistent API interface

### API Status Monitoring

The UI includes API status monitoring:

- Displays connection status
- Allows manual connectivity check
- Shows mock mode status
- Only visible in development or on error

## Type Sharing

Types are shared between frontend and backend via the shared package:

```typescript
// From shared/types/trpc.ts
export type AppRouter = {
  // Router structure type definition
  tasks: {
    // Procedure definitions
    getAll: {
      _def: {
        query: () => Task[];
      };
    };
    // ...other procedures
  };
  // ...other routers
};

// Helper types
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
```

## Usage Examples

### Backend Procedure Definition

```typescript
// In backend router
export const tasksRouter = router({
  getAll: publicProcedure.query(async () => {
    return TaskService.findAll();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }).strict())
    .query(async ({ input }) => {
      const task = await TaskService.findById(input.id);
      if (!task) throw new TRPCError({ code: 'NOT_FOUND' });
      return task;
    }),
});
```

### Cached Procedure

```typescript
// In cached router
export const cachedTasksRouter = router({
  getAll: cachedListProcedure.query(async () => {
    return TaskService.findAll();
  }),
});
```

### Frontend API Call

```typescript
// In component
const { data, error } = await api.tasks.getById("task-123");

// Using React Query hooks
const tasks = trpc.tasks.getAll.useQuery();
```

## Environment Configuration

The tRPC integration uses these environment variables:

- `VITE_API_URL`: Backend API endpoint (default: http://localhost:3001/trpc)
- `VITE_USE_MOCK_API`: Toggle mock API mode (true/false)

## Fallback Strategy

If the backend is unavailable, the system:

1. Detects connection failure
2. Shows connection status
3. Falls back to mock API if configured
4. Provides consistent error messages

## Security Considerations

- Authentication via JWT in Authorization header
- Protected routes require valid token
- Admin routes require admin role
- Error messages don't expose sensitive information