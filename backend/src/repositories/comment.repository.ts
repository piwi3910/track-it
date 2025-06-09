import { Prisma, Comment, PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';

/**
 * Comment repository interface extending base repository with comment-specific methods
 */
export interface ICommentRepository extends BaseRepository<Comment, Prisma.CommentCreateInput, Prisma.CommentUpdateInput> {
  findByTaskId(taskId: string): Promise<Comment[]>;
  countByTaskId(taskId: string): Promise<number>;
  findWithAuthor(id: string): Promise<Comment | null>;
}

/**
 * Comment repository implementation
 */
export class CommentRepository extends BaseRepository<Comment, Prisma.CommentCreateInput, Prisma.CommentUpdateInput> 
  implements ICommentRepository {
  
  constructor(prisma: PrismaClient) {
    super(prisma, 'Comment');
  }

  /**
   * Default include clause for comment queries
   */
  private get defaultInclude() {
    return {
      author: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      },
      _count: {
        select: {
          replies: true
        }
      }
    };
  }

  async findAll(): Promise<Comment[]> {
    try {
      return await this.prisma.comment.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      this.handleError('find all', error);
    }
  }

  async findById(id: string): Promise<Comment | null> {
    try {
      return await this.prisma.comment.findUnique({
        where: { id }
      });
    } catch (error) {
      this.handleError(`find by id ${id}`, error);
    }
  }

  async findWithAuthor(id: string): Promise<Comment | null> {
    try {
      return await this.prisma.comment.findUnique({
        where: { id },
        include: this.defaultInclude
      });
    } catch (error) {
      this.handleError(`find with author by id ${id}`, error);
    }
  }

  async findByTaskId(taskId: string): Promise<Comment[]> {
    try {
      return await this.prisma.comment.findMany({
        where: { 
          taskId,
          parentId: null // Only get top-level comments
        },
        include: {
          ...this.defaultInclude,
          replies: {
            include: this.defaultInclude
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
    } catch (error) {
      this.handleError(`find by task id ${taskId}`, error);
    }
  }

  async countByTaskId(taskId: string): Promise<number> {
    try {
      return await this.prisma.comment.count({
        where: { taskId }
      });
    } catch (error) {
      this.handleError(`count by task id ${taskId}`, error);
    }
  }

  async create(data: Prisma.CommentCreateInput): Promise<Comment> {
    try {
      return await this.prisma.comment.create({
        data,
        include: this.defaultInclude
      });
    } catch (error) {
      this.handleError('create', error);
    }
  }

  async update(id: string, data: Prisma.CommentUpdateInput): Promise<Comment> {
    try {
      return await this.prisma.comment.update({
        where: { id },
        data,
        include: this.defaultInclude
      });
    } catch (error) {
      this.handleError(`update with id ${id}`, error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      // Delete all replies first
      await this.prisma.comment.deleteMany({
        where: { parentId: id }
      });
      
      // Then delete the comment
      await this.prisma.comment.delete({
        where: { id }
      });
      
      return true;
    } catch (error) {
      this.handleError(`delete with id ${id}`, error);
    }
  }
}