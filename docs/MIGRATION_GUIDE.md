# Migration Guide: Recent Architecture Improvements

This document outlines the major changes made to the Track-It codebase and provides guidance for developers working with the updated architecture.

## Overview of Changes

### 1. UI Component Library Migration (Mantine → shadcn/ui)

**Before:**
```tsx
import { Button, TextInput, Badge } from '@mantine/core';

<Button variant="filled" color="blue">Click me</Button>
<TextInput label="Name" required />
<Badge color="red">Urgent</Badge>
```

**After:**
```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

<Button variant="default">Click me</Button>
<div>
  <Label htmlFor="name">Name</Label>
  <Input id="name" required />
</div>
<Badge variant="destructive">Urgent</Badge>
```

**Key Differences:**
- shadcn/ui components are copied into the codebase, not imported from node_modules
- More granular component composition (Label + Input vs TextInput)
- Different prop naming conventions
- Full TypeScript support with better type inference

### 2. State Management Migration (React Context → Zustand)

**Before:**
```tsx
// Using React Context
import { useAppContext } from '@/context/AppContext';

function MyComponent() {
  const { tasks, updateTask } = useAppContext();
  // ...
}
```

**After:**
```tsx
// Using Zustand
import { useTaskStore } from '@/stores/useTaskStore';

function MyComponent() {
  const tasks = useTaskStore(state => state.tasks);
  const updateTask = useTaskStore(state => state.updateTask);
  // ...
}
```

**Benefits:**
- No provider wrapping needed
- Better performance with selective subscriptions
- Simpler async actions
- Built-in Redux DevTools support

### 3. Enum System Simplification

**Before:**
```typescript
// Uppercase enums with conversion functions
export enum TaskStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS'
}

// Manual conversions everywhere
const dbStatus = toUpperCase(apiStatus);
const apiStatus = toLowerCase(dbStatus);
```

**After:**
```typescript
// Lowercase enums matching database
export type TaskStatus = 'backlog' | 'todo' | 'in_progress';

// No conversions needed!
const status: TaskStatus = 'todo';
```

### 4. Backend Repository Pattern

**Before:**
```typescript
// Direct service calls in routers
import * as taskService from '../db/services/task.service';

export const tasksRouter = router({
  getAll: protectedProcedure.query(async () => {
    const tasks = await taskService.getAllTasks();
    return tasks;
  })
});
```

**After:**
```typescript
// Repository pattern with dependency injection
import repositories from '../repositories/container';

export const tasksRouter = router({
  getAll: protectedProcedure.query(async () => {
    const tasks = await repositories.tasks.findAllWithRelations();
    return tasks;
  })
});
```

**Benefits:**
- Clear separation of data access and business logic
- Easier to mock for testing
- Consistent error handling
- Better TypeScript support

### 5. Component Refactoring

**Before:**
```tsx
// Large 961-line TaskCard component with everything inside
function TaskCard({ task, onEdit, onDelete }) {
  // 900+ lines of mixed logic and UI
}
```

**After:**
```tsx
// Modular components and hooks
import { useTaskState } from '@/hooks/useTaskState';
import { useTaskTimeTracking } from '@/hooks/useTaskTimeTracking';
import { TaskNumber } from '@/components/TaskNumber';
import { TaskAssignee } from '@/components/TaskAssignee';
import { TaskPrioritySelector } from '@/components/TaskPrioritySelector';

function TaskCard({ task, onEdit, onDelete }) {
  const { localTask, handleTitleChange } = useTaskState({ task });
  const { isTracking, handleToggleTracking } = useTaskTimeTracking({ task });
  
  return (
    <Card>
      <TaskNumber taskNumber={task.taskNumber} />
      <TaskAssignee task={task} onAssigneeChange={handleAssigneeChange} />
      <TaskPrioritySelector priority={task.priority} onChange={handlePriorityChange} />
    </Card>
  );
}
```

## Migration Steps for New Features

### Adding a New Store

1. Create the store file:
```typescript
// stores/useMyStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface MyState {
  items: Item[];
  isLoading: boolean;
  
  // Actions
  fetchItems: () => Promise<void>;
  addItem: (item: Item) => void;
}

export const useMyStore = create<MyState>()(
  devtools((set, get) => ({
    items: [],
    isLoading: false,
    
    fetchItems: async () => {
      set({ isLoading: true });
      const items = await api.items.getAll();
      set({ items, isLoading: false });
    },
    
    addItem: (item) => {
      set(state => ({ items: [...state.items, item] }));
    }
  }))
);
```

2. Use in components:
```tsx
function MyComponent() {
  const items = useMyStore(state => state.items);
  const fetchItems = useMyStore(state => state.fetchItems);
  
  useEffect(() => {
    fetchItems();
  }, []);
  
  return <div>{/* render items */}</div>;
}
```

### Adding a New Repository

1. Create the repository:
```typescript
// repositories/myentity.repository.ts
import { BaseRepository } from './base.repository';

export interface IMyEntityRepository extends BaseRepository<MyEntity, CreateInput, UpdateInput> {
  customMethod(): Promise<MyEntity[]>;
}

export class MyEntityRepository extends BaseRepository<MyEntity, CreateInput, UpdateInput> 
  implements IMyEntityRepository {
  
  constructor(prisma: PrismaClient) {
    super(prisma, 'MyEntity');
  }
  
  async findAll(): Promise<MyEntity[]> {
    return await this.prisma.myEntity.findMany();
  }
  
  // Implement other required methods...
}
```

2. Add to container:
```typescript
// repositories/container.ts
class RepositoryContainer {
  private _myEntities: IMyEntityRepository;
  
  constructor(prismaClient: PrismaClient) {
    this._myEntities = new MyEntityRepository(prismaClient);
  }
  
  get myEntities(): IMyEntityRepository {
    return this._myEntities;
  }
}
```

### Adding New UI Components

1. Install from shadcn/ui:
```bash
npx shadcn-ui@latest add dialog
```

2. Use in your component:
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function MyComponent() {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>My Dialog</DialogTitle>
        </DialogHeader>
        {/* content */}
      </DialogContent>
    </Dialog>
  );
}
```

## Common Patterns

### Error Handling
```typescript
// In repositories
try {
  return await this.prisma.task.findMany();
} catch (error) {
  this.handleError('find all', error);
}

// In components
const { data, error, isLoading } = useQuery({
  queryKey: ['tasks'],
  queryFn: () => api.tasks.getAll()
});

if (error) return <ErrorAlert error={error} />;
```

### Type-Safe API Calls
```typescript
// Shared types are automatically inferred
const task = await api.tasks.create({
  title: 'New Task',
  priority: 'high', // TypeScript knows valid values
  status: 'todo'
});
```

### Optimistic Updates
```typescript
const utils = api.useContext();

const createTask = api.tasks.create.useMutation({
  onMutate: async (newTask) => {
    // Cancel outgoing refetches
    await utils.tasks.getAll.cancel();
    
    // Snapshot previous value
    const previousTasks = utils.tasks.getAll.getData();
    
    // Optimistically update
    utils.tasks.getAll.setData(old => [...old, newTask]);
    
    return { previousTasks };
  },
  onError: (err, newTask, context) => {
    // Rollback on error
    utils.tasks.getAll.setData(context.previousTasks);
  },
  onSettled: () => {
    // Refetch after error or success
    utils.tasks.getAll.invalidate();
  }
});
```

## Troubleshooting

### Common Issues

1. **Missing types after enum migration**
   - Run `npx prisma generate` to regenerate Prisma client
   - Restart TypeScript server in your IDE

2. **Component ref warnings**
   - Wrap components with `React.forwardRef` when using with Radix UI's `asChild`

3. **Store not updating**
   - Check you're not mutating state directly
   - Use Zustand DevTools to debug

4. **Repository not found**
   - Ensure it's added to the container
   - Check the import path

## Best Practices

1. **Keep stores focused** - One store per domain (tasks, users, etc.)
2. **Use selective subscriptions** - Only subscribe to needed state
3. **Leverage TypeScript** - Let the type system guide you
4. **Component composition** - Build complex UIs from simple components
5. **Error boundaries** - Wrap feature areas with error boundaries
6. **Loading states** - Always handle loading and error states

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [tRPC Documentation](https://trpc.io/)
- [Prisma Documentation](https://www.prisma.io/docs)