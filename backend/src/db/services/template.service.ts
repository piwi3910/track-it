import { prisma } from '../client';
import { TaskTemplate, Prisma, TaskPriority } from '../../generated/prisma';
import { TRPCError } from '@trpc/server';

export interface CreateTemplateInput extends Omit<Prisma.TaskTemplateCreateInput, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'> {}
export interface UpdateTemplateInput extends Partial<Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>> {}

export class TemplateService {
  /**
   * Find a template by ID
   */
  static async findById(id: string): Promise<TaskTemplate | null> {
    return prisma.taskTemplate.findUnique({
      where: { id }
    });
  }

  /**
   * Get all templates
   */
  static async findAll(): Promise<TaskTemplate[]> {
    return prisma.taskTemplate.findMany({
      orderBy: {
        usageCount: 'desc'
      }
    });
  }

  /**
   * Get templates by category
   */
  static async findByCategory(category: string): Promise<TaskTemplate[]> {
    return prisma.taskTemplate.findMany({
      where: { category },
      orderBy: {
        usageCount: 'desc'
      }
    });
  }

  /**
   * Search templates
   */
  static async search(query: string): Promise<TaskTemplate[]> {
    return prisma.taskTemplate.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: {
        usageCount: 'desc'
      }
    });
  }

  /**
   * Get all template categories
   */
  static async getAllCategories(): Promise<string[]> {
    const templates = await prisma.taskTemplate.findMany({
      select: {
        category: true
      },
      where: {
        category: {
          not: null
        }
      },
      distinct: ['category']
    });

    // Filter out null values and return unique categories
    return templates
      .map(t => t.category)
      .filter((category): category is string => category !== null);
  }

  /**
   * Create a new template
   */
  static async create(data: CreateTemplateInput): Promise<TaskTemplate> {
    try {
      return await prisma.taskTemplate.create({
        data
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle any specific Prisma errors here
      }
      throw error;
    }
  }

  /**
   * Create a template from a task
   */
  static async createFromTask(taskId: string, name: string, isPublic: boolean = true): Promise<TaskTemplate> {
    try {
      // First get the task to use as a template
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          subtasks: true
        }
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found'
        });
      }

      // Create template data structure
      const templateData = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
        tags: task.tags,
        subtasks: task.subtasks.map(subtask => ({
          title: subtask.title,
          description: subtask.description,
          priority: subtask.priority,
          estimatedHours: subtask.estimatedHours
        }))
      };

      // Create the template
      return await prisma.taskTemplate.create({
        data: {
          name,
          description: task.description,
          priority: task.priority,
          estimatedHours: task.estimatedHours,
          tags: task.tags,
          isPublic,
          category: 'Custom', // Default category
          templateData: templateData as Prisma.JsonValue
        }
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create template from task'
      });
    }
  }

  /**
   * Update a template
   */
  static async update(id: string, data: UpdateTemplateInput): Promise<TaskTemplate> {
    try {
      return await prisma.taskTemplate.update({
        where: { id },
        data
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Delete a template
   */
  static async delete(id: string): Promise<TaskTemplate> {
    try {
      return await prisma.taskTemplate.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Increment template usage count
   */
  static async incrementUsageCount(id: string): Promise<TaskTemplate> {
    try {
      return await prisma.taskTemplate.update({
        where: { id },
        data: {
          usageCount: {
            increment: 1
          }
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template not found'
          });
        }
      }
      throw error;
    }
  }
}