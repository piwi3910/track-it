import { z } from 'zod';
import { router, protectedProcedure, safeProcedure } from '../trpc/trpc';
import { createNotFoundError, createForbiddenError } from '../utils/error-handler';

// Mock templates data
const mockTemplates = [
  {
    id: 'template1',
    name: 'Bug Report',
    description: 'Template for reporting bugs',
    priority: 'high',
    tags: ['bug', 'issue'],
    estimatedHours: 3,
    subtasks: [
      { id: 'subtask1', title: 'Reproduce issue', completed: false },
      { id: 'subtask2', title: 'Identify root cause', completed: false },
      { id: 'subtask3', title: 'Fix issue', completed: false },
      { id: 'subtask4', title: 'Write tests', completed: false }
    ],
    category: 'bug',
    isPublic: true,
    createdById: 'user1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'template2',
    name: 'Feature Implementation',
    description: 'Template for implementing new features',
    priority: 'medium',
    tags: ['feature', 'enhancement'],
    estimatedHours: 8,
    subtasks: [
      { id: 'subtask5', title: 'Design feature', completed: false },
      { id: 'subtask6', title: 'Implement backend', completed: false },
      { id: 'subtask7', title: 'Implement frontend', completed: false },
      { id: 'subtask8', title: 'Write tests', completed: false },
      { id: 'subtask9', title: 'Document feature', completed: false }
    ],
    category: 'feature',
    isPublic: true,
    createdById: 'user1',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'template3',
    name: 'Documentation Task',
    description: 'Template for documentation tasks',
    priority: 'low',
    tags: ['documentation'],
    estimatedHours: 4,
    subtasks: [
      { id: 'subtask10', title: 'Gather requirements', completed: false },
      { id: 'subtask11', title: 'Write documentation', completed: false },
      { id: 'subtask12', title: 'Review with team', completed: false },
      { id: 'subtask13', title: 'Publish documentation', completed: false }
    ],
    category: 'documentation',
    isPublic: true,
    createdById: 'user2',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  }
];

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
  priority: z.string(),
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
    priority: z.string().optional(),
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
    .query(({ ctx }) => safeProcedure(async () => {
      // Return all public templates and private templates created by the user
      return mockTemplates.filter(template => 
        template.isPublic || template.createdById === ctx.user?.id
      );
    })),
    
  getById: protectedProcedure
    .input(getTemplateByIdSchema)
    .query(({ input, ctx }) => safeProcedure(async () => {
      const template = mockTemplates.find(template => template.id === input.id);
      
      if (!template) {
        throw createNotFoundError('Template', input.id);
      }
      
      // Check permissions for private templates
      if (!template.isPublic && template.createdById !== ctx.user?.id && ctx.user?.role !== 'admin') {
        throw createForbiddenError('You do not have permission to view this template');
      }
      
      return template;
    })),
    
  getByCategory: protectedProcedure
    .input(getByCategorySchema)
    .query(({ input, ctx }) => safeProcedure(async () => {
      // Filter templates by category
      return mockTemplates.filter(template => 
        template.category === input.category && 
        (template.isPublic || template.createdById === ctx.user?.id)
      );
    })),
    
  getCategories: protectedProcedure
    .query(() => safeProcedure(async () => {
      // Get unique categories
      const categories = [...new Set(mockTemplates.map(template => template.category))];
      return categories;
    })),
    
  create: protectedProcedure
    .input(createTemplateSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      // Generate unique ID
      const templateId = `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create subtasks with IDs
      const subtasks = input.subtasks?.map(subtask => ({
        id: `subtask-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: subtask.title,
        completed: subtask.completed || false
      })) || [];
      
      // Create new template
      const newTemplate = {
        id: templateId,
        ...input,
        subtasks,
        createdById: ctx.user.id,
        createdAt: new Date().toISOString(),
        category: input.category || (input.tags?.length ? input.tags[0] : 'uncategorized')
      };
      
      mockTemplates.push(newTemplate);
      
      return newTemplate;
    })),
    
  update: protectedProcedure
    .input(updateTemplateSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      const templateIndex = mockTemplates.findIndex(template => template.id === input.id);
      
      if (templateIndex === -1) {
        throw createNotFoundError('Template', input.id);
      }
      
      // Check permissions (only creator or admin can update)
      const template = mockTemplates[templateIndex];
      if (template.createdById !== ctx.user?.id && ctx.user?.role !== 'admin') {
        throw createForbiddenError('You do not have permission to update this template');
      }
      
      // Process subtasks: preserve existing IDs, generate new ones for new subtasks
      let subtasks = template.subtasks;
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
      
      // Update template
      mockTemplates[templateIndex] = {
        ...mockTemplates[templateIndex],
        ...input.data,
        subtasks
      };
      
      return mockTemplates[templateIndex];
    })),
    
  delete: protectedProcedure
    .input(deleteTemplateSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      const templateIndex = mockTemplates.findIndex(template => template.id === input.id);
      
      if (templateIndex === -1) {
        throw createNotFoundError('Template', input.id);
      }
      
      // Check permissions (only creator or admin can delete)
      const template = mockTemplates[templateIndex];
      if (template.createdById !== ctx.user?.id && ctx.user?.role !== 'admin') {
        throw createForbiddenError('You do not have permission to delete this template');
      }
      
      // Remove template
      mockTemplates.splice(templateIndex, 1);
      
      return { id: input.id, deleted: true };
    })),
    
  search: protectedProcedure
    .input(searchTemplatesSchema)
    .query(({ input, ctx }) => safeProcedure(async () => {
      const query = input.query.toLowerCase();
      
      // Search templates by name, description, or tags
      return mockTemplates.filter(template => 
        (template.isPublic || template.createdById === ctx.user?.id) && 
        (
          template.name.toLowerCase().includes(query) || 
          (template.description && template.description.toLowerCase().includes(query)) ||
          template.tags?.some(tag => tag.toLowerCase().includes(query)) ||
          template.category.toLowerCase().includes(query)
        )
      );
    }))
});