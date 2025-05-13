import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc/trpc';
import { TRPCError } from '@trpc/server';
import { TaskService } from '../db/services/task.service';
import { TaskStatus, TaskPriority } from '../../generated/prisma';
import { createCachedProcedures } from '../cache/cache-procedures';
import { CacheService } from '../cache';

// Resource-specific caching configuration
const taskCacheConfig = {
  resourceType: 'tasks',  // Key prefix for cache keys
  queryTTL: 300,          // Single task queries (5 minutes)
  listTTL: 60,            // Lists of tasks (1 minute)
  searchTTL: 30,          // Search results (30 seconds)
};

// Create cached procedures for tasks
const {
  cachedItemProcedure,
  cachedListProcedure,
  cachedSearchProcedure,
  cachedMutationProcedure,
  invalidateCache
} = createCachedProcedures(taskCacheConfig);

// Input validation schemas
const taskCreateSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.string().datetime().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  estimatedHours: z.number().min(0).optional(),
  creatorId: z.string().uuid(),
  tags: z.array(z.string()).optional(),
  subtasks: z.array(
    z.object({
      title: z.string().min(1),
      completed: z.boolean().default(false),
      assigneeId: z.string().uuid().nullable().optional()
    })
  ).optional()
});

const taskUpdateSchema = z.object({
  id: z.string().uuid(),
  data: z.object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    dueDate: z.string().datetime().nullable().optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    estimatedHours: z.number().min(0).optional(),
    tags: z.array(z.string()).optional(),
    subtasks: z.array(
      z.object({
        id: z.string().optional(),
        title: z.string().min(1),
        completed: z.boolean(),
        assigneeId: z.string().uuid().nullable().optional()
      })
    ).optional()
  })
});

// Cache helper to access task by ID
async function getCachedTaskById(id: string) {
  const cacheKey = `tasks:id:${id}`;
  
  // Try to get from cache first
  const cachedTask = await CacheService.get(cacheKey);
  if (cachedTask) {
    CacheService.recordCacheHit(cacheKey);
    return cachedTask;
  }
  
  // Cache miss - get from database
  CacheService.recordCacheMiss(cacheKey);
  const task = await TaskService.findById(id);
  
  if (task) {
    // Cache the result
    await CacheService.set(cacheKey, task);
  }
  
  return task;
}

// Tasks router with cached procedures
export const cachedTasksRouter = router({
  // Public procedure with caching - no authentication required
  getAll: cachedListProcedure.query(async () => {
    return TaskService.findAll();
  }),

  // Cached procedure that requires authentication
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }).strict())
    .use(cachedItemProcedure.middleware)
    .query(async ({ input }) => {
      const task = await TaskService.findById(input.id);
      
      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found'
        });
      }
      
      return task;
    }),

  // Cached procedure for getting tasks by status
  getByStatus: protectedProcedure
    .input(z.object({ status: z.nativeEnum(TaskStatus) }).strict())
    .use(cachedListProcedure.middleware)
    .query(async ({ input }) => {
      return TaskService.findByStatus(input.status);
    }),

  // Cached procedure for getting tasks assigned to a user
  getByAssignee: protectedProcedure
    .input(z.object({ assigneeId: z.string().uuid() }).strict())
    .use(cachedListProcedure.middleware)
    .query(async ({ input }) => {
      return TaskService.findByAssignee(input.assigneeId);
    }),

  // Cached procedure for search
  search: protectedProcedure
    .input(z.object({ query: z.string().min(1) }).strict())
    .use(cachedSearchProcedure.middleware)
    .query(async ({ input }) => {
      return TaskService.search(input.query);
    }),

  // Mutation procedure with cache invalidation (create)
  create: protectedProcedure
    .input(taskCreateSchema)
    .use(cachedMutationProcedure.middleware)
    .mutation(async ({ input }) => {
      const task = await TaskService.create(input);
      // Manual cache invalidation for lists that include this task
      await invalidateCache();
      return task;
    }),

  // Mutation procedure with cache invalidation (update)
  update: protectedProcedure
    .input(taskUpdateSchema)
    .use(cachedMutationProcedure.middleware)
    .mutation(async ({ input }) => {
      const task = await TaskService.update(input.id, input.data);
      
      // Invalidate specific cache entries
      await CacheService.delete(`tasks:id:${input.id}`);
      await invalidateCache();
      
      return task;
    }),

  // Mutation procedure with cache invalidation (delete)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }).strict())
    .use(cachedMutationProcedure.middleware)
    .mutation(async ({ input }) => {
      const task = await TaskService.delete(input.id);
      
      // Invalidate specific cache entries
      await CacheService.delete(`tasks:id:${input.id}`);
      await invalidateCache();
      
      return task;
    }),

  // Update status with cache invalidation
  updateStatus: protectedProcedure
    .input(z.object({ 
      id: z.string().uuid(),
      status: z.nativeEnum(TaskStatus)
    }).strict())
    .use(cachedMutationProcedure.middleware)
    .mutation(async ({ input }) => {
      const task = await TaskService.updateStatus(input.id, input.status);
      
      // Invalidate cache for this task and related lists
      await CacheService.delete(`tasks:id:${input.id}`);
      await CacheService.deleteByPattern(`tasks:status:*`);
      
      return task;
    }),

  // Update assignee with cache invalidation
  updateAssignee: protectedProcedure
    .input(z.object({ 
      id: z.string().uuid(),
      assigneeId: z.string().uuid().nullable()
    }).strict())
    .use(cachedMutationProcedure.middleware)
    .mutation(async ({ input }) => {
      const task = await TaskService.updateAssignee(input.id, input.assigneeId);
      
      // Invalidate specific cache entries
      await CacheService.delete(`tasks:id:${input.id}`);
      await CacheService.deleteByPattern(`tasks:assignee:*`);
      
      return task;
    }),
});