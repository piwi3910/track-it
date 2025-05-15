import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, safeProcedure } from '../trpc/trpc';
import type {
  TaskTemplate
} from '@track-it/shared';
import { createNotFoundError, createForbiddenError } from '../utils/error-handler';

// Mock templates database
const mockTemplates: TaskTemplate[] = [];

// Templates router with endpoints
export const templatesRouter = router({
  // Get all templates (public endpoint - available without auth)
  getAll: publicProcedure
    .query(() => safeProcedure(async () => {
      return mockTemplates;
    })),
    
  // Get template by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }).strict())
    .query(({ input }) => safeProcedure(async () => {
      const template = mockTemplates.find(template => template.id === input.id);
      if (!template) {
        throw createNotFoundError('Template', input.id);
      }
      return template;
    })),
    
  // Get templates by category
  getByCategory: protectedProcedure
    .input(z.object({ category: z.string() }).strict())
    .query(({ input }): TaskTemplate[] => {
      return mockTemplates.filter(template => template.category === input.category);
    }),
    
  // Get all template categories
  getCategories: protectedProcedure
    .query((): string[] => {
      return Array.from(new Set(mockTemplates.map(template => template.category || 'General')));
    }),
    
  // Create a new template
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']),
      tags: z.array(z.string()).optional(),
      estimatedHours: z.number().optional(),
      subtasks: z.array(
        z.object({
          title: z.string(),
          completed: z.boolean()
        })
      ).optional(),
      category: z.string().optional(),
      isPublic: z.boolean().default(true)
    }).strict())
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      const newTemplate: TaskTemplate = {
        id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        createdBy: ctx.user?.id,
        usageCount: 0,
        name: input.name,
        description: input.description,
        priority: input.priority,
        tags: input.tags,
        estimatedHours: input.estimatedHours,
        category: input.category,
        isPublic: input.isPublic,
        subtasks: input.subtasks ? input.subtasks.map((subtask, index) => ({
          id: `subtask-${Date.now()}-${index}`,
          title: subtask.title,
          completed: subtask.completed
        })) : undefined
      };
      
      mockTemplates.push(newTemplate);
      return newTemplate;
    })),
    
  // Update an existing template
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        tags: z.array(z.string()).optional(),
        estimatedHours: z.number().optional(),
        subtasks: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            completed: z.boolean()
          })
        ).optional(),
        category: z.string().optional(),
        isPublic: z.boolean().optional()
      })
    }).strict())
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      const templateIndex = mockTemplates.findIndex(template => template.id === input.id);
      
      if (templateIndex === -1) {
        throw createNotFoundError('Template', input.id);
      }
      
      // Check if user is authorized to update the template
      const template = mockTemplates[templateIndex];
      if (template.createdBy !== ctx.user?.id && ctx.user?.role !== 'admin') {
        throw createForbiddenError('You do not have permission to update this template');
      }
      
      const updatedTemplate = {
        ...template,
        ...input.data,
        updatedAt: new Date().toISOString()
      };
      
      mockTemplates[templateIndex] = updatedTemplate;
      return updatedTemplate;
    })),
    
  // Delete a template
  delete: protectedProcedure
    .input(z.object({ id: z.string() }).strict())
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      const templateIndex = mockTemplates.findIndex(template => template.id === input.id);
      
      if (templateIndex === -1) {
        throw createNotFoundError('Template', input.id);
      }
      
      // Check if user is authorized to delete the template
      const template = mockTemplates[templateIndex];
      if (template.createdBy !== ctx.user?.id && ctx.user?.role !== 'admin') {
        throw createForbiddenError('You do not have permission to delete this template');
      }
      
      mockTemplates.splice(templateIndex, 1);
      return { success: true };
    })),
    
  // Search templates
  search: protectedProcedure
    .input(z.object({ query: z.string() }).strict())
    .query(({ input }) => safeProcedure(async () => {
      const lowercaseQuery = input.query.toLowerCase();
      return mockTemplates.filter(
        template =>
          template.name.toLowerCase().includes(lowercaseQuery) ||
          (template.description?.toLowerCase() || '').includes(lowercaseQuery) ||
          (template.category?.toLowerCase() || '').includes(lowercaseQuery) ||
          (template.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) || false)
      );
    }))
});