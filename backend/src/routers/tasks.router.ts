import { z } from 'zod';
import { router, protectedProcedure, safeProcedure } from '../trpc/trpc';
import { createNotFoundError, createForbiddenError, handleError } from '../utils/unified-error-handler';
import { logger } from '../server';
import repositories from '../repositories/container';
import { Task, TaskStatus, TaskPriority, Prisma } from '@prisma/client';

// Define helper function to normalize task data for API response
const normalizeTaskData = (task: {
  createdAt: Date | string;
  updatedAt: Date | string;
  dueDate?: Date | string | null;
  [key: string]: unknown;
}): Record<string, unknown> => {
  // Format dates as ISO strings if they exist as Date objects
  return {
    ...task,
    createdAt: task.createdAt instanceof Date ? task.createdAt.toISOString() : task.createdAt,
    updatedAt: task.updatedAt instanceof Date ? task.updatedAt.toISOString() : task.updatedAt,
    dueDate: task.dueDate instanceof Date ? task.dueDate.toISOString() : task.dueDate
  };
};

// Task enum schemas using lowercase values (matching Prisma schema)
const taskStatusSchema = z.enum(['backlog', 'todo', 'in_progress', 'review', 'done', 'archived']);
const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

// Input validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: taskStatusSchema.default('todo'),
  priority: taskPrioritySchema,
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
    // Core fields that exist in database
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    tags: z.array(z.string()).optional(),
    dueDate: z.string().nullable().optional(),
    assigneeId: z.string().nullable().optional(),
    estimatedHours: z.number().nullable().optional(),
    actualHours: z.number().nullable().optional(),
    timeTrackingActive: z.boolean().optional(),
    trackingTimeSeconds: z.number().optional(),
    
    // Frontend fields that will be ignored until database supports them
    weight: z.number().nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    isMultiDay: z.boolean().optional(),
    reporterId: z.string().nullable().optional(),
    startTrackedTimestamp: z.string().nullable().optional(),
    lastTrackedTimestamp: z.string().nullable().optional(),
    lastSavedTimestamp: z.string().nullable().optional(),
    parentTaskId: z.string().nullable().optional(),
    childTaskIds: z.array(z.string()).optional(),
    source: z.enum(['app', 'google', 'import']).optional(),
    isSubtask: z.boolean().optional(),
    recurrence: z.object({
      pattern: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
      interval: z.number().optional(),
      endDate: z.string().nullable().optional(),
      daysOfWeek: z.array(z.number()).optional(),
      dayOfMonth: z.number().optional(),
      monthOfYear: z.number().optional()
    }).nullable().optional(),
    isRecurrenceInstance: z.boolean().optional(),
    originalTaskId: z.string().optional(),
    isRecurring: z.boolean().optional(),
    
    // Subtasks array (will be handled specially)
    subtasks: z.array(z.object({
      id: z.string().optional(),
      title: z.string(),
      completed: z.boolean()
    })).optional(),
    
    // Alternative field names that frontend might send
    assignee: z.string().nullable().optional(), // Frontend sometimes sends 'assignee' instead of 'assigneeId'
  })
}).superRefine((val) => {
  // Add debug logging for validation
  logger.info('Validating task update schema:', JSON.stringify(val, null, 2));
  return true;
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
    .query(() => safeProcedure(async () => {
      try {
        const tasks = await repositories.tasks.findAllWithRelations();
        return tasks.map(normalizeTaskData);
      } catch (error) {
        return handleError(error);
      }
    })),
    
  getById: protectedProcedure
    .input(getTaskByIdSchema)
    .query(({ input, ctx }) => safeProcedure(async () => {
      try {
        const task = await repositories.tasks.findWithRelations(input.id);
        
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
        const tasks = await repositories.tasks.findByStatus(input.status, ctx.user.id);
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
          status: input.status,
          priority: input.priority,
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

        const newTask = await repositories.tasks.create(taskData);
        return normalizeTaskData(newTask);
      } catch (error) {
        return handleError(error);
      }
    })),
    
  update: protectedProcedure
    .input(updateTaskSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        // Debug logging to see what data is being received
        logger.info('Task update request received:', {
          input: JSON.stringify(input, null, 2),
          userId: ctx.user?.id
        });
        
        // First get the task to check permissions
        const task = await repositories.tasks.findById(input.id);
        
        if (!task) {
          throw createNotFoundError('Task', input.id);
        }
        
        // Check permissions (only creator, assignee or admin can update)
        if (task.creatorId !== ctx.user?.id && task.assigneeId !== ctx.user?.id) {
          if (ctx.user?.role !== 'admin') {
            throw createForbiddenError('You do not have permission to update this task');
          }
        }
        
        // Prepare update data - only include fields that exist in the database schema
        // Handle assignee field (frontend might send 'assignee' instead of 'assigneeId')
        const assigneeId = input.data.assigneeId ?? input.data.assignee;
        
        // Only include database-supported fields to avoid Prisma errors
        const updateData: Prisma.TaskUpdateInput = {
          // Core database fields
          ...(input.data.title && { title: input.data.title }),
          ...(input.data.description !== undefined && { description: input.data.description }),
          ...(input.data.status && { status: input.data.status }),
          ...(input.data.priority && { priority: input.data.priority }),
          ...(input.data.tags && { tags: input.data.tags }),
          ...(input.data.dueDate !== undefined && { dueDate: input.data.dueDate ? new Date(input.data.dueDate) : null }),
          ...(input.data.estimatedHours !== undefined && { estimatedHours: input.data.estimatedHours }),
          ...(input.data.actualHours !== undefined && { actualHours: input.data.actualHours }),
          ...(input.data.timeTrackingActive !== undefined && { timeTrackingActive: input.data.timeTrackingActive }),
          ...(input.data.trackingTimeSeconds !== undefined && { trackingTimeSeconds: input.data.trackingTimeSeconds }),
          
          // Handle assignee relationship
          ...((input.data.assigneeId !== undefined || input.data.assignee !== undefined) && { 
            assignee: assigneeId 
              ? { connect: { id: assigneeId } } 
              : { disconnect: true } 
          })
        };
        
        // Log which frontend fields are being ignored (for future database schema updates)
        const ignoredFields = [];
        if (input.data.weight !== undefined) ignoredFields.push('weight');
        if (input.data.startDate !== undefined) ignoredFields.push('startDate');
        if (input.data.endDate !== undefined) ignoredFields.push('endDate');
        if (input.data.isMultiDay !== undefined) ignoredFields.push('isMultiDay');
        if (input.data.reporterId !== undefined) ignoredFields.push('reporterId');
        if (input.data.recurrence !== undefined) ignoredFields.push('recurrence');
        if (input.data.isRecurring !== undefined) ignoredFields.push('isRecurring');
        
        if (ignoredFields.length > 0) {
          logger.info('Ignoring unsupported fields until database schema update:', { 
            taskId: input.id,
            ignoredFields 
          });
        }
        
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
        
        // Log the final update data being sent to Prisma
        logger.info('Sending update data to Prisma:', {
          taskId: input.id,
          updateData: JSON.stringify(updateData, null, 2)
        });

        // Update the task
        const updatedTask = await repositories.tasks.update(input.id, updateData);
        logger.info('Task updated successfully:', { taskId: input.id });
        return normalizeTaskData(updatedTask);
      } catch (error) {
        logger.error('Task update failed:', {
          taskId: input.id,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        return handleError(error);
      }
    })),
    
  delete: protectedProcedure
    .input(deleteTaskSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        // First get the task to check permissions
        const task = await repositories.tasks.findById(input.id);
        
        if (!task) {
          throw createNotFoundError('Task', input.id);
        }
        
        // Check permissions (only creator or admin can delete)
        if (task.creatorId !== ctx.user?.id && ctx.user?.role !== 'admin') {
          throw createForbiddenError('You do not have permission to delete this task');
        }
        
        // Delete the task
        await repositories.tasks.delete(input.id);
        
        return { id: input.id, deleted: true };
      } catch (error) {
        return handleError(error);
      }
    })),
    
  search: protectedProcedure
    .input(searchTasksSchema)
    .query(({ input }) => safeProcedure(async () => {
      try {
        const tasks = await repositories.tasks.search(input.query);
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
        const task = await repositories.tasks.findWithRelations(input.taskId);
        
        if (!task) {
          throw createNotFoundError('Task', input.taskId);
        }
        
        // Check if user can create template from this task
        if (task.creatorId !== ctx.user?.id && ctx.user?.role !== 'admin') {
          throw createForbiddenError('You do not have permission to create a template from this task');
        }
        
        // Extract subtasks data for template
        const taskWithSubtasks = task as Task & { subtasks?: Array<{ title: string; description: string | null; priority: TaskPriority }> };
        const subtasksData = taskWithSubtasks.subtasks?.map((subtask) => ({
          title: subtask.title,
          completed: false // Always set to false in templates
        })) || [];
        
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
        const newTemplate = await repositories.templates.create(templateData);
        
        // Mark the task as saved as template
        await repositories.tasks.update(input.taskId, { savedAsTemplate: true });
        
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
        const template = await repositories.templates.findById(input.templateId);
        
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
          status: (input.taskData?.status as TaskStatus) || 'todo',
          priority: (input.taskData?.priority as TaskPriority) || template.priority,
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
        const newTask = await repositories.tasks.create(taskData);
        
        // Increment template usage count
        await repositories.templates.incrementUsageCount(input.templateId);
        
        return normalizeTaskData(newTask);
      } catch (error) {
        return handleError(error);
      }
    }))
});