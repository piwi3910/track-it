import { prisma } from '../client';
import { Comment, Prisma } from '../../generated/prisma';
import { TRPCError } from '@trpc/server';

export interface CreateCommentInput {
  text: string;
  taskId: string;
  authorId: string;
  parentId?: string | null;
}

export interface UpdateCommentInput {
  text: string;
}

export class CommentService {
  /**
   * Find a comment by ID
   */
  static async findById(id: string): Promise<Comment | null> {
    return prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
  }

  /**
   * Get comments for a task
   */
  static async findByTaskId(taskId: string): Promise<Comment[]> {
    return prisma.comment.findMany({
      where: { 
        taskId,
        // Only get top-level comments
        parentId: null
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  /**
   * Get comment count for a task
   */
  static async getCommentCountByTaskId(taskId: string): Promise<number> {
    return prisma.comment.count({
      where: { taskId }
    });
  }

  /**
   * Create a new comment
   */
  static async create(data: CreateCommentInput): Promise<Comment> {
    try {
      return await prisma.comment.create({
        data: {
          text: data.text,
          task: {
            connect: { id: data.taskId }
          },
          author: {
            connect: { id: data.authorId }
          },
          ...(data.parentId ? {
            parent: {
              connect: { id: data.parentId }
            }
          } : {})
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle foreign key constraint violations
        if (error.code === 'P2003') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid task, author or parent comment ID'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Update a comment
   */
  static async update(id: string, data: UpdateCommentInput): Promise<Comment> {
    try {
      return await prisma.comment.update({
        where: { id },
        data: {
          text: data.text,
          updatedAt: new Date()
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Comment not found'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  static async delete(id: string): Promise<Comment> {
    try {
      return await prisma.comment.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Comment not found'
          });
        }
      }
      throw error;
    }
  }
}