# tRPC Usage Examples - Before vs After

This document shows how to properly use tRPC in your React components, comparing your current approach with the recommended approach.

## Authentication Example

### ❌ Current Approach (Complex)
```typescript
// useAuthStore.ts - Current implementation
const login = async (email, password) => {
  set({ isLoading: true, error: null });
  
  try {
    const response = await api.auth.login(email, password);
    
    if (response.error) {
      set({ 
        isLoading: false, 
        error: response.error,
        isAuthenticated: false
      });
      return { success: false, error: response.error };
    }
    
    set({ 
      user: response.data as User, 
      isLoading: false,
      isAuthenticated: true
    });
    
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Login failed';
    set({ 
      isLoading: false, 
      error: errorMessage,
      isAuthenticated: false
    });
    return { success: false, error: errorMessage };
  }
};
```

### ✅ Recommended Approach (Simple)
```typescript
// useAuthStore.ts - Recommended implementation
import { trpc } from '@/lib/trpc';

const useAuthStore = create((set, get) => ({
  user: null,
  
  // Use tRPC mutation directly
  loginMutation: trpc.users.login.useMutation({
    onSuccess: (data) => {
      set({ user: data, isAuthenticated: true });
      // Token is automatically handled by tRPC client
    },
    onError: (error) => {
      set({ error: error.message, isAuthenticated: false });
    },
  }),
  
  login: (email: string, password: string) => {
    get().loginMutation.mutate({ email, password });
  },
}));
```

## Task Management Example

### ❌ Current Approach
```typescript
// TaskStore - Current implementation
const useTaskStore = create((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,
  
  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.tasks.getAll();
      
      if (response.error) {
        set({ isLoading: false, error: response.error });
        return;
      }
      
      set({ 
        tasks: response.data || [], 
        isLoading: false 
      });
    } catch (err) {
      set({ 
        isLoading: false, 
        error: err instanceof Error ? err.message : 'Failed to fetch tasks' 
      });
    }
  },
  
  createTask: async (taskData) => {
    try {
      const response = await api.tasks.create(taskData);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Manually update local state
      set(state => ({
        tasks: [...state.tasks, response.data]
      }));
      
      return response.data;
    } catch (err) {
      throw err;
    }
  }
}));
```

### ✅ Recommended Approach
```typescript
// No need for complex task store - use tRPC hooks directly in components
import { trpc } from '@/lib/trpc';

// In your component:
function TaskList() {
  // Automatic loading, error handling, and caching
  const { data: tasks, isLoading, error } = trpc.tasks.getAll.useQuery();
  
  const createTaskMutation = trpc.tasks.create.useMutation({
    // Automatically refetch tasks after creation
    onSuccess: () => {
      trpc.useContext().tasks.getAll.invalidate();
    },
  });
  
  const handleCreateTask = (taskData) => {
    createTaskMutation.mutate(taskData);
  };
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {tasks?.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
      <button 
        onClick={() => handleCreateTask(newTaskData)}
        disabled={createTaskMutation.isLoading}
      >
        {createTaskMutation.isLoading ? 'Creating...' : 'Create Task'}
      </button>
    </div>
  );
}
```

## Component Usage Examples

### ❌ Current Component Pattern
```typescript
// DashboardPage.tsx - Current approach
function DashboardPage() {
  const { tasks, isLoading, error, fetchTasks } = useTaskStore();
  const { user } = useAuthStore();
  
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <TaskList tasks={tasks} />
    </div>
  );
}
```

### ✅ Recommended Component Pattern
```typescript
// DashboardPage.tsx - Recommended approach
function DashboardPage() {
  // Automatic data fetching, caching, and error handling
  const { data: user } = trpc.users.getCurrentUser.useQuery();
  const { data: tasks, isLoading, error } = trpc.tasks.getAll.useQuery();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <TaskList tasks={tasks} />
    </div>
  );
}
```

## Form Handling Example

### ❌ Current Form Pattern
```typescript
// TaskModal.tsx - Current approach
function TaskModal({ taskId, onClose }) {
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);
  
  const loadTask = async () => {
    setIsLoading(true);
    try {
      const response = await api.tasks.getById(taskId);
      if (response.error) {
        setError(response.error);
      } else {
        setTask(response.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (formData) => {
    try {
      const response = await api.tasks.update(taskId, formData);
      if (response.error) {
        setError(response.error);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.message);
    }
  };
  
  // ... rest of component
}
```

### ✅ Recommended Form Pattern
```typescript
// TaskModal.tsx - Recommended approach
function TaskModal({ taskId, onClose }) {
  // Automatic loading and caching
  const { data: task, isLoading } = trpc.tasks.getById.useQuery(
    { id: taskId },
    { enabled: !!taskId }
  );
  
  // Automatic error handling and optimistic updates
  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      // Automatically update cache
      trpc.useContext().tasks.getById.invalidate({ id: taskId });
      trpc.useContext().tasks.getAll.invalidate();
      onClose();
    },
  });
  
  const handleSubmit = (formData) => {
    updateTaskMutation.mutate({ id: taskId, data: formData });
  };
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button 
        type="submit" 
        disabled={updateTaskMutation.isLoading}
      >
        {updateTaskMutation.isLoading ? 'Saving...' : 'Save'}
      </button>
      {updateTaskMutation.error && (
        <div>Error: {updateTaskMutation.error.message}</div>
      )}
    </form>
  );
}
```

## Key Benefits of Recommended Approach

### 1. **Automatic State Management**
- No manual loading states
- No manual error handling
- Automatic caching and background updates

### 2. **Type Safety**
```typescript
// ✅ Fully typed - autocomplete and error checking
const { data: tasks } = trpc.tasks.getAll.useQuery();
//     ^? Task[] | undefined (properly typed)

// ❌ Current - no type safety
const response = await api.tasks.getAll();
//    ^? { data: any, error: string | null } (not helpful)
```

### 3. **Better Performance**
- Automatic request batching
- Intelligent caching
- Background refetching
- Optimistic updates

### 4. **Simpler Code**
- Less boilerplate
- No manual state management
- Consistent patterns
- Better error boundaries

## Migration Steps

1. **Start with one component** (e.g., DashboardPage)
2. **Replace store calls with tRPC hooks**
3. **Remove manual state management**
4. **Test thoroughly**
5. **Repeat for other components**

The migration can be done incrementally without breaking existing functionality.