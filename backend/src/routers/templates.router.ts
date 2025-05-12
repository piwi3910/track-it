import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc/trpc';
import { TRPCError } from '@trpc/server';
import {
  TaskTemplate,
  TemplateByIdInput,
  TemplateByCategoryInput,
  TemplateCreateInput,
  TemplateUpdateInput,
  TemplateDeleteInput,
  TemplateSearchInput
} from '@track-it/shared';

// Mock templates database
const mockTemplates: TaskTemplate[] = [];

// Templates router with endpoints
export const templatesRouter = router({
  // Get all templates (public endpoint - available without auth)
  getAll: publicProcedure
    .query(() => {
      return mockTemplates;
    }),
    
  // Get template by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }).strict())
    .query(({ input }) => {
      return mockTemplates.find(template => template.id === input.id) || null;
    }),
    
  // Get templates by category
  getByCategory: protectedProcedure
    .input(z.object({ category: z.string() }).strict())
    .query(({ input }) => {
      return mockTemplates.filter(template => template.category === input.category);
    }),
    
  // Get all template categories
  getCategories: protectedProcedure
    .query(() => {
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
          completed: z.boolean().default(false)
        })
      ).optional(),
      category: z.string().optional(),
      isPublic: z.boolean().default(true)
    }).strict())
    .mutation(({ input, ctx }) => {
      const newTemplate: TaskTemplate = {
        id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        createdBy: ctx.user?.id,
        usageCount: 0,
        ...input
      };
      
      mockTemplates.push(newTemplate);
      return newTemplate;
    }),
    
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
    .mutation(({ input, ctx }) => {
      const templateIndex = mockTemplates.findIndex(template => template.id === input.id);
      
      if (templateIndex === -1) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Template not found'
        });
      }
      
      // Check if user is authorized to update the template
      const template = mockTemplates[templateIndex];
      if (template.createdBy !== ctx.user?.id && ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this template'
        });
      }
      
      const updatedTemplate = {
        ...template,
        ...input.data,
        updatedAt: new Date().toISOString()
      };
      
      mockTemplates[templateIndex] = updatedTemplate;
      return updatedTemplate;
    }),
    
  // Delete a template
  delete: protectedProcedure
    .input(z.object({ id: z.string() }).strict())
    .mutation(({ input, ctx }) => {
      const templateIndex = mockTemplates.findIndex(template => template.id === input.id);
      
      if (templateIndex === -1) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Template not found'
        });
      }
      
      // Check if user is authorized to delete the template
      const template = mockTemplates[templateIndex];
      if (template.createdBy !== ctx.user?.id && ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this template'
        });
      }
      
      mockTemplates.splice(templateIndex, 1);
      return { success: true };
    }),
    
  // Search templates
  search: protectedProcedure
    .input(z.object({ query: z.string() }).strict())
    .query(({ input }) => {
      const lowercaseQuery = input.query.toLowerCase();
      return mockTemplates.filter(
        template =>
          template.name.toLowerCase().includes(lowercaseQuery) ||
          (template.description?.toLowerCase() || '').includes(lowercaseQuery) ||
          (template.category?.toLowerCase() || '').includes(lowercaseQuery) ||
          (template.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) || false)
      );
    })
});