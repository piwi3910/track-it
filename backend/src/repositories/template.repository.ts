import { Prisma, TaskTemplate, PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';

/**
 * TaskTemplate repository interface extending base repository with template-specific methods
 */
export interface ITaskTemplateRepository extends BaseRepository<TaskTemplate, Prisma.TaskTemplateCreateInput, Prisma.TaskTemplateUpdateInput> {
  findByCategory(category: string): Promise<TaskTemplate[]>;
  findPublic(): Promise<TaskTemplate[]>;
  search(query: string): Promise<TaskTemplate[]>;
  incrementUsageCount(id: string): Promise<TaskTemplate>;
}

/**
 * TaskTemplate repository implementation
 */
export class TaskTemplateRepository extends BaseRepository<TaskTemplate, Prisma.TaskTemplateCreateInput, Prisma.TaskTemplateUpdateInput> 
  implements ITaskTemplateRepository {
  
  constructor(prisma: PrismaClient) {
    super(prisma, 'TaskTemplate');
  }

  async findAll(): Promise<TaskTemplate[]> {
    try {
      return await this.prisma.taskTemplate.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      this.handleError('find all', error);
    }
  }

  async findById(id: string): Promise<TaskTemplate | null> {
    try {
      return await this.prisma.taskTemplate.findUnique({
        where: { id }
      });
    } catch (error) {
      this.handleError(`find by id ${id}`, error);
    }
  }

  async findByCategory(category: string): Promise<TaskTemplate[]> {
    try {
      return await this.prisma.taskTemplate.findMany({
        where: { 
          category,
          isPublic: true 
        },
        orderBy: {
          usageCount: 'desc'
        }
      });
    } catch (error) {
      this.handleError(`find by category ${category}`, error);
    }
  }

  async findPublic(): Promise<TaskTemplate[]> {
    try {
      return await this.prisma.taskTemplate.findMany({
        where: { 
          isPublic: true 
        },
        orderBy: {
          usageCount: 'desc'
        }
      });
    } catch (error) {
      this.handleError('find public', error);
    }
  }

  async search(query: string): Promise<TaskTemplate[]> {
    try {
      return await this.prisma.taskTemplate.findMany({
        where: {
          AND: [
            { isPublic: true },
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { category: { contains: query, mode: 'insensitive' } },
                { tags: { has: query } }
              ]
            }
          ]
        },
        orderBy: {
          usageCount: 'desc'
        }
      });
    } catch (error) {
      this.handleError(`search with query ${query}`, error);
    }
  }

  async create(data: Prisma.TaskTemplateCreateInput): Promise<TaskTemplate> {
    try {
      return await this.prisma.taskTemplate.create({
        data
      });
    } catch (error) {
      this.handleError('create', error);
    }
  }

  async update(id: string, data: Prisma.TaskTemplateUpdateInput): Promise<TaskTemplate> {
    try {
      return await this.prisma.taskTemplate.update({
        where: { id },
        data
      });
    } catch (error) {
      this.handleError(`update with id ${id}`, error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.taskTemplate.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      this.handleError(`delete with id ${id}`, error);
    }
  }

  async incrementUsageCount(id: string): Promise<TaskTemplate> {
    try {
      return await this.prisma.taskTemplate.update({
        where: { id },
        data: {
          usageCount: {
            increment: 1
          }
        }
      });
    } catch (error) {
      this.handleError(`increment usage count for id ${id}`, error);
    }
  }
}