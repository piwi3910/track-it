/**
 * Comment service for database operations on Comment model
 */
import { Prisma } from '../../generated/prisma';
import prisma from '../client';
import { createDatabaseError } from '../../utils/error-handler';

/**
 * Get comments by task ID
 */
export async function getCommentsByTaskId(taskId: string) {
  try {
    return await prisma.comment.findMany({
      where: { taskId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
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
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to get comments for task with ID ${taskId}`, { error });
  }
}

/**
 * Get comment count for a task
 */
export async function getCommentCount(taskId: string) {
  try {
    return await prisma.comment.count({
      where: { taskId }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to get comment count for task with ID ${taskId}`, { error });
  }
}

/**
 * Create a new comment
 */
export async function createComment(data: Prisma.CommentCreateInput) {
  try {
    return await prisma.comment.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });
  } catch (error) {
    throw createDatabaseError('Failed to create comment', { error });
  }
}

/**
 * Get comment by ID
 */
export async function getCommentById(id: string) {
  try {
    return await prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            creatorId: true,
            assigneeId: true
          }
        }
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to get comment with ID ${id}`, { error });
  }
}

/**
 * Update a comment
 */
export async function updateComment(id: string, data: Prisma.CommentUpdateInput) {
  try {
    return await prisma.comment.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to update comment with ID ${id}`, { error });
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(id: string) {
  try {
    await prisma.comment.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    throw createDatabaseError(`Failed to delete comment with ID ${id}`, { error });
  }
}

/**
 * Extract mentions from comment text
 * @param text Comment text
 * @returns Array of usernames mentioned
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentionMatches = [...text.matchAll(mentionRegex)];
  return mentionMatches.map(match => match[1]);
}

/**
 * Resolve user IDs from usernames
 * @param usernames Array of usernames 
 * @returns Array of user IDs
 */
export async function resolveUserIds(usernames: string[]): Promise<string[]> {
  try {
    if (usernames.length === 0) return [];
    
    const users = await prisma.user.findMany({
      where: {
        OR: usernames.map(name => ({
          name: {
            equals: name,
            mode: 'insensitive'
          }
        }))
      },
      select: {
        id: true
      }
    });
    
    return users.map(user => user.id);
  } catch (error) {
    throw createDatabaseError('Failed to resolve user IDs from usernames', { error });
  }
}