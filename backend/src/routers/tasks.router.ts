import { z } from 'zod';
import { router, protectedProcedure, safeProcedure } from '../trpc/trpc';
import { createNotFoundError, createForbiddenError, handleError } from '../utils/error-handler';
import { logger } from '../server';
import * as taskService from '../db/services/task.service';
import * as templateService from '../db/services/template.service';
import { TASK_STATUS, TASK_PRIORITY, formatEnumForApi, formatEnumForDb } from '../utils/constants';

// Define helper function to normalize task data for API response
const normalizeTaskData = (task: any) => {
  // Ensure consistent casing of status and priority
  return {
    ...task,
    status: formatEnumForApi(task.status),
    priority: formatEnumForApi(task.priority),
    // Format dates as ISO strings if they exist as Date objects
    createdAt: task.createdAt instanceof Date ? task.createdAt.toISOString() : task.createdAt,
    updatedAt: task.updatedAt instanceof Date ? task.updatedAt.toISOString() : task.updatedAt,
    dueDate: task.dueDate instanceof Date ? task.dueDate.toISOString() : task.dueDate
  };
};

// Enum definitions for task properties using constants
const taskStatusEnum = z.enum(Object.values(TASK_STATUS) as [string, ...string[]]);
const taskPriorityEnum = z.enum(Object.values(TASK_PRIORITY) as [string, ...string[]]);

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
      try {
        const tasks = await taskService.getAllTasks(ctx.user.id);
        return tasks.map(normalizeTaskData);
      } catch (error) {
        return handleError(error);
      }
    })),
    
  getById: protectedProcedure
    .input(getTaskByIdSchema)
    .query(({ input, ctx }) => safeProcedure(async () => {
      try {
        const task = await taskService.getTaskById(input.id);
        
        if (!task) {
          throw createNotFoundError('Task', input.id);
        }
        
        // Check if user is allowed to view this task
        if (task.creatorId !== ctx.user?.id && task.assigneeId !== ctx.user?.id) {
          if (ctx.user?.role !== 'admin') {
            throw createForbiddenError('You do not have permission to view this task');
          }
        }
        
        return normalizeTaskData(task);
      } catch (error) {
        return handleError(error);
      }
    })),
    
  getByStatus: protectedProcedure
    .input(getTasksByStatusSchema)
    .query(({ input, ctx }) => safeProcedure(async () => {
      try {
        const tasks = await taskService.getTasksByStatus(input.status, ctx.user.id);
        return tasks.map(normalizeTaskData);
      } catch (error) {
        return handleError(error);
      }
    })),
    
  create: protectedProcedure
    .input(createTaskSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        // Format data for database
        const taskData = {
          title: input.title,
          description: input.description,
          status: formatEnumForDb(input.status),
          priority: formatEnumForDb(input.priority),
          tags: input.tags || [],
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          estimatedHours: input.estimatedHours,
          creator: { connect: { id: ctx.user.id } },
          assignee: input.assigneeId ? { connect: { id: input.assigneeId } } : undefined,
          // Handle subtasks if present
          subtasks: input.subtasks ? {
            create: input.subtasks.map(subtask => ({
              title: subtask.title,
              completed: subtask.completed || false,
              creator: { connect: { id: ctx.user.id } }
            }))
          } : undefined
        };

        const newTask = await taskService.createTask(taskData);
        return normalizeTaskData(newTask);
      } catch (error) {
        return handleError(error);
      }
    })),
    
  update: protectedProcedure
    .input(updateTaskSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        // First get the task to check permissions
        const task = await taskService.getTaskById(input.id);
        
        if (!task) {
          throw createNotFoundError('Task', input.id);
        }
        
        // Check permissions (only creator, assignee or admin can update)
        if (task.creatorId !== ctx.user?.id && task.assigneeId !== ctx.user?.id) {
          if (ctx.user?.role !== 'admin') {
            throw createForbiddenError('You do not have permission to update this task');
          }
        }
        
        // Prepare update data
        const updateData: any = {
          ...(input.data.title && { title: input.data.title }),
          ...(input.data.description !== undefined && { description: input.data.description }),
          ...(input.data.status && { status: formatEnumForDb(input.data.status) }),
          ...(input.data.priority && { priority: formatEnumForDb(input.data.priority) }),
          ...(input.data.tags && { tags: input.data.tags }),
          ...(input.data.dueDate !== undefined && { dueDate: input.data.dueDate ? new Date(input.data.dueDate) : null }),
          ...(input.data.estimatedHours !== undefined && { estimatedHours: input.data.estimatedHours }),
          ...(input.data.actualHours !== undefined && { actualHours: input.data.actualHours }),
          ...(input.data.timeTrackingActive !== undefined && { timeTrackingActive: input.data.timeTrackingActive }),
          ...(input.data.trackingTimeSeconds !== undefined && { trackingTimeSeconds: input.data.trackingTimeSeconds }),
          ...(input.data.assigneeId !== undefined && { 
            assignee: input.data.assigneeId 
              ? { connect: { id: input.data.assigneeId } } 
              : { disconnect: true } 
          })
        };
        
        // Handle subtask updates if present
        if (input.data.subtasks) {
          // Note: This is a simplified approach. In a real app, you would need to
          // handle creation, updates, and deletion of subtasks more carefully.
          // For simplicity, we're deleting all existing subtasks and creating new ones.
          updateData.subtasks = {
            deleteMany: {},
            create: input.data.subtasks.map(subtask => ({
              title: subtask.title,
              completed: subtask.completed,
              creator: { connect: { id: ctx.user.id } }
            }))
          };
        }
        
        // Update the task
        const updatedTask = await taskService.updateTask(input.id, updateData);
        return normalizeTaskData(updatedTask);
      } catch (error) {
        return handleError(error);
      }
    })),
    
  delete: protectedProcedure
    .input(deleteTaskSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        // First get the task to check permissions
        const task = await taskService.getTaskById(input.id);
        
        if (!task) {
          throw createNotFoundError('Task', input.id);
        }
        
        // Check permissions (only creator or admin can delete)
        if (task.creatorId !== ctx.user?.id && ctx.user?.role !== 'admin') {
          throw createForbiddenError('You do not have permission to delete this task');
        }
        
        // Delete the task
        await taskService.deleteTask(input.id);
        
        return { id: input.id, deleted: true };
      } catch (error) {
        return handleError(error);
      }
    })),
    
  search: protectedProcedure
    .input(searchTasksSchema)
    .query(({ input, ctx }) => safeProcedure(async () => {
      try {
        const tasks = await taskService.searchTasks(input.query, ctx.user.id);
        return tasks.map(normalizeTaskData);
      } catch (error) {
        return handleError(error);
      }
    })),
    
  saveAsTemplate: protectedProcedure
    .input(saveTemplateSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        // First get the task to check permissions
        const task = await taskService.getTaskById(input.taskId);
        
        if (!task) {
          throw createNotFoundError('Task', input.taskId);
        }
        
        // Check if user can create template from this task
        if (task.creatorId !== ctx.user?.id && ctx.user?.role !== 'admin') {
          throw createForbiddenError('You do not have permission to create a template from this task');
        }
        
        // Extract subtasks data for template
        const subtasksData = task.subtasks.map(subtask => ({
          title: subtask.title,
          completed: false // Always set to false in templates
        }));
        
        // Create template data
        const templateData = {
          name: input.templateName,
          description: task.description,
          priority: task.priority,
          tags: task.tags,
          estimatedHours: task.estimatedHours,
          isPublic: input.isPublic,
          category: task.tags?.length ? task.tags[0] : 'uncategorized',
          createdBy: { connect: { id: ctx.user.id } },
          // Store subtasks as JSON to be used when creating tasks from this template
          templateData: { subtasks: subtasksData }
        };
        
        // Create the template
        const newTemplate = await templateService.createTemplate(templateData);
        
        // Mark the task as saved as template
        await taskService.updateTask(input.taskId, { savedAsTemplate: true });
        
        return {
          id: newTemplate.id,
          name: newTemplate.name,
          taskId: input.taskId
        };
      } catch (error) {
        return handleError(error);
      }
    })),
    
  createFromTemplate: protectedProcedure
    .input(createFromTemplateSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        // First get the template to check permissions
        const template = await templateService.getTemplateById(input.templateId);
        
        if (!template) {
          throw createNotFoundError('Template', input.templateId);
        }
        
        // Check if user can use this template (for now, only check if template is public since createdById doesn't exist)
        if (!template.isPublic && ctx.user?.role !== 'admin') {
          throw createForbiddenError('You do not have permission to use this template');
        }
        
        // Extract subtasks from template data
        const templateData = template.templateData as { subtasks: Array<{ title: string, completed: boolean }> };
        
        // Create task from template
        const taskData = {
          title: input.taskData?.title || template.name,
          description: input.taskData?.description || template.description,
          status: formatEnumForDb(input.taskData?.status || TASK_STATUS.TODO),
          priority: formatEnumForDb(input.taskData?.priority || template.priority),
          tags: template.tags,
          dueDate: input.taskData?.dueDate ? new Date(input.taskData.dueDate) : null,
          estimatedHours: template.estimatedHours,
          creator: { connect: { id: ctx.user.id } },
          assignee: { connect: { id: input.taskData?.assigneeId || ctx.user.id } },
          // Create subtasks from template
          subtasks: {
            create: templateData.subtasks.map(subtask => ({
              title: subtask.title,
              completed: false, // Always start with uncompleted subtasks
              creator: { connect: { id: ctx.user.id } }
            }))
          }
        };
        
        // Create the task
        const newTask = await taskService.createTask(taskData);
        
        // Increment template usage count
        await templateService.incrementTemplateUsage(input.templateId);
        
        return normalizeTaskData(newTask);
      } catch (error) {
        return handleError(error);
      }
    }))
});