import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc/trpc';
import {
  Task,
  TaskPriority,
  TaskStatus,
  Subtask,
  TaskByIdInput,
  TasksByStatusInput,
  TaskCreateInput,
  TaskUpdateInput,
  TaskDeleteInput,
  TaskSearchInput
} from '@track-it/shared';

// Mock database for now - will be replaced with a real DB
const mockTasks: Task[] = []; 

// Input validation schemas
const taskIdSchema = z.object({
  id: z.string()
});

const taskCreateSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'blocked', 'in_review', 'done'] as const).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  estimatedHours: z.number().optional(),
  subtasks: z.array(
    z.object({
      title: z.string(),
      completed: z.boolean().default(false)
    })
  ).optional()
}) satisfies z.ZodType<TaskCreateInput>;

const taskUpdateSchema = z.object({
  id: z.string(),
  data: z.object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    status: z.enum(['backlog', 'todo', 'in_progress', 'blocked', 'in_review', 'done'] as const).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent'] as const).optional(),
    tags: z.array(z.string()).optional(),
    dueDate: z.string().nullable().optional(),
    assigneeId: z.string().nullable().optional(),
    estimatedHours: z.number().optional(),
    actualHours: z.number().optional(),
    subtasks: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        completed: z.boolean()
      })
    ).optional(),
    timeTrackingActive: z.boolean().optional(),
    trackingTimeSeconds: z.number().optional()
  })
}) satisfies z.ZodType<TaskUpdateInput>;

// Tasks router with endpoints
export const tasksRouter = router({
  // Public procedure - no authentication required
  getAll: publicProcedure.query(() => {
    return mockTasks;
  }),

  // Protected procedure - requires authentication
  getById: protectedProcedure
    .input(z.object({ id: z.string() }).strict())
    .query(({ input }) => {
      return mockTasks.find(task => task.id === input.id) || null;
    }),

  getByStatus: protectedProcedure
    .input(z.object({ status: z.enum(['backlog', 'todo', 'in_progress', 'blocked', 'in_review', 'done'] as const) }).strict())
    .query(({ input }) => {
      return mockTasks.filter(task => task.status === input.status);
    }),

  create: protectedProcedure
    .input(taskCreateSchema)
    .mutation(({ input, ctx }) => {
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...input,
        createdAt: new Date().toISOString(),
        reporterId: ctx.user?.id,
        subtasks: input.subtasks?.map((subtask, index) => ({
          id: `subtask-${Date.now()}-${index}`,
          title: subtask.title,
          completed: subtask.completed
        }))
      };

      mockTasks.push(newTask);
      return newTask;
    }),

  update: protectedProcedure
    .input(taskUpdateSchema)
    .mutation(({ input }) => {
      const taskIndex = mockTasks.findIndex(task => task.id === input.id);
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      const updatedTask = {
        ...mockTasks[taskIndex],
        ...input.data,
        updatedAt: new Date().toISOString()
      };

      mockTasks[taskIndex] = updatedTask;
      return updatedTask;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }).strict())
    .mutation(({ input }) => {
      const taskIndex = mockTasks.findIndex(task => task.id === input.id);
      if (taskIndex !== -1) {
        mockTasks.splice(taskIndex, 1);
      }
      return { success: true };
    }),

  search: protectedProcedure
    .input(z.object({ query: z.string() }).strict())
    .query(({ input }) => {
      const lowercaseQuery = input.query.toLowerCase();
      return mockTasks.filter(
        task =>
          task.title.toLowerCase().includes(lowercaseQuery) ||
          (task.description?.toLowerCase() || '').includes(lowercaseQuery) ||
          (task.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) || false)
      );
    }),

  // Additional endpoints to match the mock API
  saveAsTemplate: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      templateName: z.string().min(1),
      isPublic: z.boolean().default(true)
    }).strict())
    .mutation(({ input, ctx }) => {
      const task = mockTasks.find(t => t.id === input.taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // In a real implementation, this would create a template in the database
      return {
        id: `template-${Date.now()}`,
        name: input.templateName,
        description: task.description,
        priority: task.priority,
        tags: task.tags,
        estimatedHours: task.estimatedHours,
        subtasks: task.subtasks,
        category: task.tags?.[0] || 'General',
        createdAt: new Date().toISOString(),
        createdBy: ctx.user?.id,
        isPublic: input.isPublic,
        usageCount: 0
      };
    })
});