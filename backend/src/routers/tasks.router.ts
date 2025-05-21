import { z } from 'zod';
import { router, protectedProcedure, safeProcedure } from '../trpc/trpc';
import { createNotFoundError, createForbiddenError } from '../utils/error-handler';
import { logger } from '../server';

// Mock task database
const mockTasks = [
  {
    id: 'task1',
    title: 'Complete API Implementation',
    description: 'Implement all API endpoints and test with Postman',
    status: 'in_progress',
    priority: 'high',
    tags: ['backend', 'api'],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: 'user1',
    assigneeId: 'user1',
    estimatedHours: 8,
    actualHours: 4,
    timeTrackingActive: false,
    trackingTimeSeconds: 0,
    subtasks: [
      { id: 'subtask1', title: 'Define API routes', completed: true },
      { id: 'subtask2', title: 'Implement auth endpoints', completed: true },
      { id: 'subtask3', title: 'Implement task endpoints', completed: false },
      { id: 'subtask4', title: 'Write tests', completed: false }
    ]
  },
  {
    id: 'task2',
    title: 'Add Dark Mode',
    description: 'Implement dark mode theme for the app',
    status: 'todo',
    priority: 'medium',
    tags: ['frontend', 'ui'],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdById: 'user1',
    assigneeId: 'user2',
    estimatedHours: 4,
    actualHours: 0,
    timeTrackingActive: false,
    trackingTimeSeconds: 0,
    subtasks: [
      { id: 'subtask5', title: 'Create theme switcher', completed: false },
      { id: 'subtask6', title: 'Implement dark styles', completed: false }
    ]
  },
  {
    id: 'task3',
    title: 'Fix Login Issues',
    description: 'Debug and fix login issues reported by users',
    status: 'done',
    priority: 'high',
    tags: ['bug', 'auth'],
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 'user1',
    assigneeId: 'user3',
    estimatedHours: 2,
    actualHours: 3,
    timeTrackingActive: false,
    trackingTimeSeconds: 0,
    subtasks: []
  }
];

// Mock template for saving tasks as templates
const mockTemplates = [];

// Enum definitions for task properties
const taskStatusEnum = z.enum(['backlog', 'todo', 'in_progress', 'blocked', 'in_review', 'done']);
const taskPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);

// Input validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: taskStatusEnum.default('todo'),
  priority: taskPriorityEnum,
  tags: z.array(z.string()).optional(),
  dueDate: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  estimatedHours: z.number().optional(),
  subtasks: z.array(z.object({
    title: z.string(),
    completed: z.boolean().default(false)
  })).optional()
});

const updateTaskSchema = z.object({
  id: z.string(),
  data: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: taskStatusEnum.optional(),
    priority: taskPriorityEnum.optional(),
    tags: z.array(z.string()).optional(),
    dueDate: z.string().nullable().optional(),
    assigneeId: z.string().nullable().optional(),
    estimatedHours: z.number().optional(),
    actualHours: z.number().optional(),
    subtasks: z.array(z.object({
      id: z.string().optional(),
      title: z.string(),
      completed: z.boolean()
    })).optional(),
    timeTrackingActive: z.boolean().optional(),
    trackingTimeSeconds: z.number().optional()
  })
});

const getTaskByIdSchema = z.object({
  id: z.string()
});

const getTasksByStatusSchema = z.object({
  status: z.string()
});

const deleteTaskSchema = z.object({
  id: z.string()
});

const searchTasksSchema = z.object({
  query: z.string()
});

const saveTemplateSchema = z.object({
  taskId: z.string(),
  templateName: z.string().min(1),
  isPublic: z.boolean().default(true)
});

const createFromTemplateSchema = z.object({
  templateId: z.string(),
  taskData: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    dueDate: z.string().nullable().optional(),
    assigneeId: z.string().nullable().optional()
  }).optional()
});

export const tasksRouter = router({
  getAll: protectedProcedure
    .query(({ ctx }) => safeProcedure(async () => {
      // In a real app, you would query the database here
      const userTasks = mockTasks.filter(task => 
        // Show tasks created by the user or assigned to them
        task.createdById === ctx.user?.id || 
        task.assigneeId === ctx.user?.id
      );
      
      return userTasks;
    })),
    
  getById: protectedProcedure
    .input(getTaskByIdSchema)
    .query(({ input, ctx }) => safeProcedure(async () => {
      const task = mockTasks.find(task => task.id === input.id);
      
      if (!task) {
        throw createNotFoundError('Task', input.id);
      }
      
      // Check if user is allowed to view this task
      if (task.createdById !== ctx.user?.id && task.assigneeId !== ctx.user?.id) {
        if (ctx.user?.role !== 'admin') {
          throw createForbiddenError('You do not have permission to view this task');
        }
      }
      
      return task;
    })),
    
  getByStatus: protectedProcedure
    .input(getTasksByStatusSchema)
    .query(({ input, ctx }) => safeProcedure(async () => {
      // Filter tasks by status
      const userTasks = mockTasks.filter(task => 
        task.status === input.status && 
        (task.createdById === ctx.user?.id || task.assigneeId === ctx.user?.id)
      );
      
      return userTasks;
    })),
    
  create: protectedProcedure
    .input(createTaskSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      // Generate unique ID
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create subtasks with IDs
      const subtasks = input.subtasks?.map(subtask => ({
        id: `subtask-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: subtask.title,
        completed: subtask.completed || false
      })) || [];
      
      // Create new task
      const newTask = {
        id: taskId,
        ...input,
        subtasks,
        createdById: ctx.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeTrackingActive: false,
        trackingTimeSeconds: 0,
        actualHours: 0
      };
      
      mockTasks.push(newTask);
      
      return newTask;
    })),
    
  update: protectedProcedure
    .input(updateTaskSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      const taskIndex = mockTasks.findIndex(task => task.id === input.id);
      
      if (taskIndex === -1) {
        throw createNotFoundError('Task', input.id);
      }
      
      // Check permissions (only creator, assignee or admin can update)
      const task = mockTasks[taskIndex];
      if (task.createdById !== ctx.user?.id && task.assigneeId !== ctx.user?.id) {
        if (ctx.user?.role !== 'admin') {
          throw createForbiddenError('You do not have permission to update this task');
        }
      }
      
      // Process subtasks: preserve existing IDs, generate new ones for new subtasks
      let subtasks = task.subtasks;
      if (input.data.subtasks) {
        subtasks = input.data.subtasks.map(subtask => {
          if (subtask.id) {
            return subtask;
          } else {
            return {
              id: `subtask-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              title: subtask.title,
              completed: subtask.completed
            };
          }
        });
      }
      
      // Update task
      mockTasks[taskIndex] = {
        ...mockTasks[taskIndex],
        ...input.data,
        subtasks,
        updatedAt: new Date().toISOString()
      };
      
      return mockTasks[taskIndex];
    })),
    
  delete: protectedProcedure
    .input(deleteTaskSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      const taskIndex = mockTasks.findIndex(task => task.id === input.id);
      
      if (taskIndex === -1) {
        throw createNotFoundError('Task', input.id);
      }
      
      // Check permissions (only creator or admin can delete)
      const task = mockTasks[taskIndex];
      if (task.createdById !== ctx.user?.id && ctx.user?.role !== 'admin') {
        throw createForbiddenError('You do not have permission to delete this task');
      }
      
      // Remove task
      mockTasks.splice(taskIndex, 1);
      
      return { id: input.id, deleted: true };
    })),
    
  search: protectedProcedure
    .input(searchTasksSchema)
    .query(({ input, ctx }) => safeProcedure(async () => {
      const query = input.query.toLowerCase();
      
      // Search tasks by title, description, or tags
      const userTasks = mockTasks.filter(task => 
        (task.createdById === ctx.user?.id || task.assigneeId === ctx.user?.id) && 
        (
          task.title.toLowerCase().includes(query) || 
          (task.description && task.description.toLowerCase().includes(query)) ||
          task.tags?.some(tag => tag.toLowerCase().includes(query))
        )
      );
      
      return userTasks;
    })),
    
  saveAsTemplate: protectedProcedure
    .input(saveTemplateSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      const task = mockTasks.find(task => task.id === input.taskId);
      
      if (!task) {
        throw createNotFoundError('Task', input.taskId);
      }
      
      // Check if user can create template from this task
      if (task.createdById !== ctx.user?.id && ctx.user?.role !== 'admin') {
        throw createForbiddenError('You do not have permission to create a template from this task');
      }
      
      // Create template
      const templateId = `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      const newTemplate = {
        id: templateId,
        name: input.templateName,
        description: task.description,
        priority: task.priority,
        tags: task.tags,
        estimatedHours: task.estimatedHours,
        subtasks: task.subtasks,
        isPublic: input.isPublic,
        createdById: ctx.user.id,
        createdAt: new Date().toISOString(),
        category: task.tags?.length ? task.tags[0] : 'uncategorized'
      };
      
      mockTemplates.push(newTemplate);
      
      return {
        id: templateId,
        name: input.templateName,
        taskId: input.taskId
      };
    })),
    
  createFromTemplate: protectedProcedure
    .input(createFromTemplateSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      const template = mockTemplates.find(template => template.id === input.templateId);
      
      if (!template) {
        throw createNotFoundError('Template', input.templateId);
      }
      
      // Check if user can use this template
      if (!template.isPublic && template.createdById !== ctx.user?.id && ctx.user?.role !== 'admin') {
        throw createForbiddenError('You do not have permission to use this template');
      }
      
      // Create task from template
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Generate new IDs for subtasks
      const subtasks = template.subtasks.map(subtask => ({
        id: `subtask-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: subtask.title,
        completed: false // Always start with uncompleted subtasks
      }));
      
      const newTask = {
        id: taskId,
        title: input.taskData?.title || template.name,
        description: input.taskData?.description || template.description,
        status: input.taskData?.status || 'todo',
        priority: input.taskData?.priority || template.priority,
        tags: template.tags,
        dueDate: input.taskData?.dueDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdById: ctx.user.id,
        assigneeId: input.taskData?.assigneeId || ctx.user.id,
        estimatedHours: template.estimatedHours,
        actualHours: 0,
        timeTrackingActive: false,
        trackingTimeSeconds: 0,
        subtasks
      };
      
      mockTasks.push(newTask);
      
      return newTask;
    }))
});