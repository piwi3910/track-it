import { z } from 'zod';
import { router, protectedProcedure, safeProcedure } from '../trpc/trpc';
import type {
  Comment
} from '@track-it/shared';
import { createNotFoundError, createForbiddenError } from '../utils/error-handler';

// Mock comments database
const mockComments: Comment[] = [];

// Comments router with endpoints
export const commentsRouter = router({
  // Get comments by task ID
  getByTaskId: protectedProcedure
    .input(z.object({ taskId: z.string() }).strict())
    .query(({ input }) => safeProcedure(async () => {
      return mockComments.filter(comment => comment.taskId === input.taskId);
    })),
    
  // Get comment count by task ID
  getCommentCount: protectedProcedure
    .input(z.object({ taskId: z.string() }).strict())
    .query(({ input }) => {
      return mockComments.filter(comment => comment.taskId === input.taskId).length;
    }),
    
  // Create a new comment
  create: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      text: z.string().min(1)
    }).strict())
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      const now = new Date().toISOString();
      
      // Extract mentions from text (optional feature)
      const mentionRegex = /@(\w+)/g;
      const mentions = Array.from(input.text.matchAll(mentionRegex), match => match[1]);
      
      const newComment: Comment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        taskId: input.taskId,
        authorId: ctx.user?.id || 'unknown',
        text: input.text,
        createdAt: now,
        mentions: mentions.length > 0 ? mentions : undefined
      };
      
      mockComments.push(newComment);
      return newComment;
    })),
    
  // Update an existing comment
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      text: z.string().min(1)
    }).strict())
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      const commentIndex = mockComments.findIndex(comment => comment.id === input.id);
      
      if (commentIndex === -1) {
        throw createNotFoundError('Comment', input.id);
      }
      
      // Check if user is authorized to update the comment
      const comment = mockComments[commentIndex];
      if (comment.authorId !== ctx.user?.id && ctx.user?.role !== 'admin') {
        throw createForbiddenError('You do not have permission to update this comment');
      }
      
      // Extract mentions from text (optional feature)
      const mentionRegex = /@(\w+)/g;
      const mentions = Array.from(input.text.matchAll(mentionRegex), match => match[1]);
      
      const updatedComment: Comment = {
        ...comment,
        text: input.text,
        updatedAt: new Date().toISOString(),
        mentions: mentions.length > 0 ? mentions : comment.mentions
      };
      
      mockComments[commentIndex] = updatedComment;
      return updatedComment;
    })),
    
  // Delete a comment
  delete: protectedProcedure
    .input(z.object({ id: z.string() }).strict())
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      const commentIndex = mockComments.findIndex(comment => comment.id === input.id);
      
      if (commentIndex === -1) {
        throw createNotFoundError('Comment', input.id);
      }
      
      // Check if user is authorized to delete the comment
      const comment = mockComments[commentIndex];
      if (comment.authorId !== ctx.user?.id && ctx.user?.role !== 'admin') {
        throw createForbiddenError('You do not have permission to delete this comment');
      }
      
      mockComments.splice(commentIndex, 1);
      return { success: true };
    }))
});