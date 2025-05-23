import { z } from 'zod';
import { router, protectedProcedure, safeProcedure } from '../trpc/trpc';
import { createNotFoundError, createForbiddenError, handleError } from '../utils/error-handler';
import * as commentService from '../db/services/comment.service';
import * as taskService from '../db/services/task.service';

// Define the Comment type from the service response
type CommentAuthor = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

interface CommentWithAuthor {
  id: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  taskId: string;
  authorId: string;
  parentId: string | null;
  author?: CommentAuthor;
  replies?: Array<Omit<CommentWithAuthor, 'author'> & { author?: Omit<CommentAuthor, 'email'> }>;
}

// Type for normalized comment data
type NormalizedComment = {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  taskId: string;
  authorId: string;
  parentId: string | null;
  author?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  replies?: Array<NormalizedComment>;
};

// Helper function to normalize comment data for API response
const normalizeCommentData = (comment: CommentWithAuthor): NormalizedComment => {
  return {
    ...comment,
    // Format dates as ISO strings if they exist as Date objects
    createdAt: comment.createdAt instanceof Date ? comment.createdAt.toISOString() : comment.createdAt,
    updatedAt: comment.updatedAt instanceof Date ? comment.updatedAt.toISOString() : comment.updatedAt
  };
};

// Input validation schemas
const getCommentsByTaskSchema = z.object({
  taskId: z.string()
});

const getCommentCountSchema = z.object({
  taskId: z.string()
});

const createCommentSchema = z.object({
  taskId: z.string(),
  text: z.string().min(1)
});

const updateCommentSchema = z.object({
  id: z.string(),
  text: z.string().min(1)
});

const deleteCommentSchema = z.object({
  id: z.string()
});

export const commentsRouter = router({
  getByTaskId: protectedProcedure
    .input(getCommentsByTaskSchema)
    .query(({ input }) => safeProcedure(async (): Promise<Array<{
      id: string;
      text: string;
      createdAt: string;
      updatedAt: string;
      taskId: string;
      authorId: string;
      parentId: string | null;
      author?: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
      };
      replies?: Array<ReturnType<typeof normalizeCommentData>>;
    }>> => {
      try {
        // Verify task exists
        const task = await taskService.getTaskById(input.taskId);
        
        if (!task) {
          throw createNotFoundError('Task', input.taskId);
        }
        
        // Get all comments for the task
        const comments = await commentService.getCommentsByTaskId(input.taskId);
        
        // Return normalized comments
        return comments.map(normalizeCommentData);
      } catch (error) {
        return handleError(error);
      }
    })),
    
  getCommentCount: protectedProcedure
    .input(getCommentCountSchema)
    .query(({ input }) => safeProcedure(async (): Promise<number> => {
      try {
        // Verify task exists
        const task = await taskService.getTaskById(input.taskId);
        
        if (!task) {
          throw createNotFoundError('Task', input.taskId);
        }
        
        // Get comment count for the task
        const count = await commentService.getCommentCount(input.taskId);
        
        // Return just the number as per API specification
        return count;
      } catch (error) {
        return handleError(error);
      }
    })),
    
  create: protectedProcedure
    .input(createCommentSchema)
    .mutation(({ input, ctx }) => safeProcedure(async (): Promise<{
      id: string;
      text: string;
      createdAt: string;
      updatedAt: string;
      taskId: string;
      authorId: string;
      parentId: string | null;
      author?: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
      };
      replies?: Array<ReturnType<typeof normalizeCommentData>>;
    }> => {
      try {
        // Verify task exists
        const task = await taskService.getTaskById(input.taskId);
        
        if (!task) {
          throw createNotFoundError('Task', input.taskId);
        }
        
        // Extract mentions from text
        const mentionedUsernames = commentService.extractMentions(input.text);
        
        // Create new comment
        const newComment = await commentService.createComment({
          text: input.text,
          task: {
            connect: { id: input.taskId }
          },
          author: {
            connect: { id: ctx.user.id }
          }
        });
        
        // If there are mentions, we would handle them here
        // For example, create notifications for mentioned users
        if (mentionedUsernames.length > 0) {
          // Resolve usernames to user IDs
          await commentService.resolveUserIds(mentionedUsernames);
          
          // In a real app, you would create notifications for mentioned users here
          // This could be done in a background job to avoid blocking the response
        }
        
        return normalizeCommentData(newComment);
      } catch (error) {
        return handleError(error);
      }
    })),
    
  update: protectedProcedure
    .input(updateCommentSchema)
    .mutation(({ input, ctx }) => safeProcedure(async (): Promise<{
      id: string;
      text: string;
      createdAt: string;
      updatedAt: string;
      taskId: string;
      authorId: string;
      parentId: string | null;
      author?: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
      };
      replies?: Array<ReturnType<typeof normalizeCommentData>>;
    }> => {
      try {
        // Get comment by ID
        const comment = await commentService.getCommentById(input.id);
        
        if (!comment) {
          throw createNotFoundError('Comment', input.id);
        }
        
        // Check permissions (only creator or admin can update)
        if (comment.authorId !== ctx.user?.id && ctx.user?.role !== 'admin') {
          throw createForbiddenError('You do not have permission to update this comment');
        }
        
        // Extract mentions from text
        const mentionedUsernames = commentService.extractMentions(input.text);
        
        // Update comment
        const updatedComment = await commentService.updateComment(input.id, {
          text: input.text,
          updatedAt: new Date()
        });
        
        // If there are mentions, we would handle them here
        if (mentionedUsernames.length > 0) {
          // Resolve usernames to user IDs
          await commentService.resolveUserIds(mentionedUsernames);
          
          // In a real app, you would create notifications for mentioned users here
          // This could be done in a background job to avoid blocking the response
        }
        
        return normalizeCommentData(updatedComment);
      } catch (error) {
        return handleError(error);
      }
    })),
    
  delete: protectedProcedure
    .input(deleteCommentSchema)
    .mutation(({ input, ctx }) => safeProcedure(async (): Promise<{ success: boolean }> => {
      try {
        // Get comment by ID
        const comment = await commentService.getCommentById(input.id);
        
        if (!comment) {
          throw createNotFoundError('Comment', input.id);
        }
        
        // Check permissions (only creator or admin can delete)
        if (comment.authorId !== ctx.user?.id && ctx.user?.role !== 'admin') {
          throw createForbiddenError('You do not have permission to delete this comment');
        }
        
        // Delete comment
        await commentService.deleteComment(input.id);
        
        // Return success response as per API specification
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    }))
});