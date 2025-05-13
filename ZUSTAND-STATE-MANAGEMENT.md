# Zustand State Management

This document outlines the implementation of Zustand for state management in the Track-It application, addressing Issue #14.

## Overview

Track-It uses Zustand for global state management, replacing the previous Context API approach. Zustand provides several benefits:

- Simpler, more direct API with minimal boilerplate
- Better performance with automatic re-renders only when needed
- Easier testing and debugging
- Built-in persistence and middleware
- TypeScript-friendly design
- More flexible update patterns

## Store Architecture

The state management follows a domain-driven design approach with these core stores:

1. **Theme Store**: Manages UI theme and appearance
2. **API Store**: Handles API availability and connection status
3. **Auth Store**: Manages user authentication state
4. **Task Store**: Core task management functionality
5. **Template Store**: Template management for task creation
6. **Notification Store**: User notifications
7. **Google Store**: Google integration for Calendar and Tasks

Each store is a self-contained module with:
- State definitions
- Action methods
- Selectors
- Middleware (where needed)

## Store Implementation

### Common Patterns

All stores follow these common patterns:

1. **State Interface**: Clearly defined TypeScript interface
2. **Action Methods**: Functions to modify state
3. **Async Methods**: Promise-based data fetching
4. **Error Handling**: Consistent error tracking
5. **Loading States**: Loading indicators for async operations
6. **Persistence** (when needed): Local storage persistence

### Example: Task Store

The task store provides a good example of the implementation:

```typescript
interface TaskState {
  // State
  tasks: Task[];
  filteredTasks: Task[];
  selectedTask: Task | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTasks: () => Promise<Task[]>;
  createTask: (task: CreateTaskInput) => Promise<Task | null>;
  // ... more actions
}

export const useTaskStore = create<TaskState>()(
  devtools(
    (set, get) => ({
      // Initial state
      tasks: [],
      filteredTasks: [],
      // ... more state
      
      // Actions
      fetchTasks: async () => {
        set({ isLoading: true, error: null });
        try {
          // API call & state update
        } catch (err) {
          // Error handling
        }
      },
      // ... more actions
    })
  )
);
```

## Unified Store Access

A central `useStore` hook provides access to all stores:

```typescript
export function useStore() {
  // Get state and actions from each store
  const { colorScheme, toggleColorScheme /* ... */ } = useThemeStore();
  const { user, login, logout /* ... */ } = useAuthStore();
  // ... more stores
  
  // Return a unified API
  return {
    theme: { /* theme state and actions */ },
    auth: { /* auth state and actions */ },
    tasks: { /* task state and actions */ },
    // ... more domains
  };
}
```

This approach provides:
- Clean and consistent access pattern
- Logical organization by domain
- Simplified component usage

## Migration from Context API

The previous Context API implementation was migrated using this approach:

1. **Create Stores**: Implement Zustand stores for each context
2. **Extract Logic**: Move business logic from context providers to stores
3. **Slim Providers**: Create minimal providers for initialization only
4. **Update Components**: Replace context hooks with store hooks
5. **Ensure Types**: Maintain TypeScript type safety throughout

## Store Organization

The stores are organized as follows:

```
/src/stores/
├── index.ts              # Re-exports all stores and types
├── types.d.ts            # Shared type definitions
├── useApiStore.ts        # API connection status
├── useAuthStore.ts       # Authentication state
├── useGoogleStore.ts     # Google integration
├── useNotificationStore.ts # Notifications
├── useTaskStore.ts       # Task management
├── useTemplateStore.ts   # Task templates
└── useThemeStore.ts      # UI theme
```

## Persistence Strategy

Stores use the Zustand persist middleware when appropriate:

- **Theme Store**: Persists color scheme preference
- **Auth Store**: Persists authentication status
- **Google Store**: Persists connection status and sync information
- **Task Filters**: Persists saved filters and view preferences

Other data is fetched from the API on demand to ensure data consistency.

## Performance Optimizations

Several optimizations improve performance:

1. **Selective Updates**: Zustand only triggers re-renders when accessed state changes
2. **Lazy Loading**: Initialization happens in background when possible
3. **Batched Updates**: Multiple state updates are batched for efficiency
4. **Memoization**: Complex derivations are memoized to avoid recalculation
5. **Devtools**: Development-only debugging tools disabled in production

## Best Practices

The implementation follows these best practices:

1. **Atomic Updates**: Keep state updates small and focused
2. **Error Handling**: Consistent error handling patterns
3. **Loading States**: Track loading state for async operations
4. **TypeScript**: Full type safety throughout
5. **Immutability**: Ensure immutable updates for predictability
6. **Middleware**: Use appropriate middleware for debugging and persistence
7. **Initialization**: Automatic store initialization where possible
8. **Organization**: Clear organization by domain

## Components and Providers

The system uses minimal providers for initialization:

- **ThemeProvider**: Initializes theme and syncs with Mantine
- **ApiProvider**: Checks API availability
- **AuthProvider**: Loads user data if token exists

These providers don't store state themselves but trigger initialization in the respective stores.

## Workflow Examples

### Example 1: Fetching and Displaying Tasks

```tsx
function TasksList() {
  const { tasks } = useStore();
  
  useEffect(() => {
    // Fetch tasks if needed
    if (tasks.all.length === 0 && !tasks.isLoading) {
      tasks.fetch();
    }
  }, []);
  
  if (tasks.isLoading) return <Loader />;
  if (tasks.error) return <Alert color="red">{tasks.error}</Alert>;
  
  return (
    <Stack>
      {tasks.filtered.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </Stack>
  );
}
```

### Example 2: Updating Task Status

```tsx
function TaskStatusDropdown({ taskId, status }) {
  const { tasks } = useStore();
  
  const handleStatusChange = async (newStatus) => {
    await tasks.updateStatus(taskId, newStatus);
  };
  
  return (
    <Select
      value={status}
      onChange={handleStatusChange}
      data={statusOptions}
      loading={tasks.isUpdating}
    />
  );
}
```

## Migration Benefits

The migration from Context API to Zustand provided:

1. **Reduced Boilerplate**: 50% less code for state management
2. **Performance**: More efficient rendering with automatic state selection
3. **Simplicity**: More straightforward API for components
4. **Testability**: Easier testing with direct store access
5. **Developer Experience**: Better debugging with Redux DevTools integration
6. **Flexibility**: Easier to extend and modify state