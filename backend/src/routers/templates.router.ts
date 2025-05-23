import { z } from 'zod';
import { router, protectedProcedure, safeProcedure } from '../trpc/trpc';
import { createNotFoundError, createForbiddenError, handleError } from '../utils/error-handler';
import * as templateService from '../db/services/template.service';
import { formatEnumForApi } from '../utils/constants';
import { TaskPriority, Prisma } from '../generated/prisma';

// Define helper function to normalize template data for API response
export interface TemplateData {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  priority: TaskPriority;
  estimatedHours: number | null;
  tags: string[];
  isPublic: boolean;
  category: string | null;
  templateData: unknown;
  usageCount: number;
}

const normalizeTemplateData = (template: TemplateData): TemplateData & { priority: string } => {
  // Ensure consistent casing of priority
  return {
    ...template,
    priority: formatEnumForApi(template.priority),
    // Format dates as ISO strings if they exist as Date objects
    createdAt: template.createdAt instanceof Date ? template.createdAt.toISOString() : template.createdAt,
    updatedAt: template.updatedAt instanceof Date ? template.updatedAt.toISOString() : template.updatedAt
  };
};

// Enum definitions for template properties using constants
const taskPriorityEnum = z.nativeEnum(TaskPriority);

// Schema definitions
const getTemplateByIdSchema = z.object({
  id: z.string()
});

const getByCategorySchema = z.object({
  category: z.string()
});

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  priority: taskPriorityEnum,
  tags: z.array(z.string()).optional(),
  estimatedHours: z.number().optional(),
  subtasks: z.array(z.object({
    title: z.string(),
    completed: z.boolean().default(false)
  })).optional(),
  category: z.string().optional(),
  isPublic: z.boolean().default(true)
});

const updateTemplateSchema = z.object({
  id: z.string(),
  data: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    priority: taskPriorityEnum.optional(),
    tags: z.array(z.string()).optional(),
    estimatedHours: z.number().optional(),
    subtasks: z.array(z.object({
      id: z.string().optional(),
      title: z.string(),
      completed: z.boolean()
    })).optional(),
    category: z.string().optional(),
    isPublic: z.boolean().optional()
  })
});

const deleteTemplateSchema = z.object({
  id: z.string()
});

const searchTemplatesSchema = z.object({
  query: z.string()
});

export const templatesRouter = router({
  getAll: protectedProcedure
    .query(() => safeProcedure(async () => {
      try {
        const templates = await templateService.getAllTemplates();
        return templates.map(normalizeTemplateData);
      } catch (error) {
        return handleError(error);
      }
    })),
    
  getById: protectedProcedure
    .input(getTemplateByIdSchema)
    .query(({ input, ctx }) => safeProcedure(async () => {
      try {
        const template = await templateService.getTemplateById(input.id);
        
        if (!template) {
          throw createNotFoundError('Template', input.id);
        }
        
        // Check permissions for private templates (simplified since createdById doesn't exist)
        if (!template.isPublic && ctx.user?.role !== 'admin') {
          throw createForbiddenError('You do not have permission to view this template');
        }
        
        return normalizeTemplateData(template);
      } catch (error) {
        return handleError(error);
      }
    })),
    
  getByCategory: protectedProcedure
    .input(getByCategorySchema)
    .query(({ input }) => safeProcedure(async () => {
      try {
        const templates = await templateService.getTemplatesByCategory(input.category);
        return templates.map(normalizeTemplateData);
      } catch (error) {
        return handleError(error);
      }
    })),
    
  getCategories: protectedProcedure
    .query(() => safeProcedure(async () => {
      try {
        const categories = await templateService.getTemplateCategories();
        return categories;
      } catch (error) {
        return handleError(error);
      }
    })),
    
  create: protectedProcedure
    .input(createTemplateSchema)
    .mutation(({ input }) => safeProcedure(async () => {
      try {
        // Process subtasks for template data
        const subtasks = input.subtasks?.map(subtask => ({
          title: subtask.title,
          completed: subtask.completed || false
        })) || [];
        
        // Create template data
        const templateData = {
          name: input.name,
          description: input.description,
          priority: input.priority,
          tags: input.tags || [],
          estimatedHours: input.estimatedHours,
          isPublic: input.isPublic ?? true,
          category: input.category || (input.tags?.length ? input.tags[0] : 'uncategorized'),
          // Note: createdBy relation is commented out in schema, so we skip it for now
          // Store subtasks and other template data as JSON
          templateData: { subtasks }
        };
        
        const newTemplate = await templateService.createTemplate(templateData);
        return normalizeTemplateData(newTemplate);
      } catch (error) {
        return handleError(error);
      }
    })),
    
  update: protectedProcedure
    .input(updateTemplateSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        // First get the template to check permissions
        const template = await templateService.getTemplateById(input.id);
        
        if (!template) {
          throw createNotFoundError('Template', input.id);
        }
        
        // Check permissions (simplified since createdById doesn't exist in schema)
        if (!template.isPublic && ctx.user?.role !== 'admin') {
          throw createForbiddenError('You do not have permission to update this template');
        }
        
        // Extract current template data from JSON
        const currentTemplateData = template.templateData as { subtasks: Array<{ title: string, completed: boolean }> };
        
        // Prepare update data
        const updateData: Prisma.TaskTemplateUpdateInput = {
          ...(input.data.name && { name: input.data.name }),
          ...(input.data.description !== undefined && { description: input.data.description }),
          ...(input.data.priority && { priority: input.data.priority }),
          ...(input.data.tags && { tags: input.data.tags }),
          ...(input.data.estimatedHours !== undefined && { estimatedHours: input.data.estimatedHours }),
          ...(input.data.isPublic !== undefined && { isPublic: input.data.isPublic }),
          ...(input.data.category && { category: input.data.category })
        };
        
        // Process subtasks if provided
        if (input.data.subtasks) {
          const subtasks = input.data.subtasks.map(subtask => ({
            title: subtask.title,
            completed: subtask.completed
          }));
          
          updateData.templateData = { 
            ...currentTemplateData,
            subtasks 
          };
        }
        
        // Update the template
        const updatedTemplate = await templateService.updateTemplate(input.id, updateData);
        return normalizeTemplateData(updatedTemplate);
      } catch (error) {
        return handleError(error);
      }
    })),
    
  delete: protectedProcedure
    .input(deleteTemplateSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        // First get the template to check permissions
        const template = await templateService.getTemplateById(input.id);
        
        if (!template) {
          throw createNotFoundError('Template', input.id);
        }
        
        // Check permissions (simplified since createdById doesn't exist in schema)
        if (!template.isPublic && ctx.user?.role !== 'admin') {
          throw createForbiddenError('You do not have permission to delete this template');
        }
        
        // Delete the template
        await templateService.deleteTemplate(input.id);
        
        return { success: true, id: input.id };
      } catch (error) {
        return handleError(error);
      }
    })),
    
  search: protectedProcedure
    .input(searchTemplatesSchema)
    .query(({ input }) => safeProcedure(async () => {
      try {
        const templates = await templateService.searchTemplates(input.query);
        return templates.map(normalizeTemplateData);
      } catch (error) {
        return handleError(error);
      }
    }))
});