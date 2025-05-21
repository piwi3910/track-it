import { z } from 'zod';
import { router, protectedProcedure, safeProcedure } from '../trpc/trpc';
import { createNotFoundError, createForbiddenError } from '../utils/error-handler';

// Mock comments database (updated to match API spec)
const mockComments = [
  {
    id: 'comment1',
    taskId: 'task1',
    authorId: 'user1',
    text: 'This is coming along nicely. Let\'s implement the error handling next.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: null,
    mentions: []
  },
  {
    id: 'comment2',
    taskId: 'task1',
    authorId: 'user2',
    text: 'I\'ve started working on the error handling. Will update when complete.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: null,
    mentions: ['user1']
  },
  {
    id: 'comment3',
    taskId: 'task3',
    authorId: 'user3',
    text: 'Login issue has been fixed. Root cause was an invalid token handling.',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    mentions: []
  }
];

// Mock tasks for validation
const mockTasks = [
  { id: 'task1' },
  { id: 'task2' },
  { id: 'task3' }
];

// Mock users for validation
const mockUsers = [
  { id: 'user1', name: 'John Doe', avatarUrl: 'https://i.pravatar.cc/150?u=user1' },
  { id: 'user2', name: 'Jane Smith', avatarUrl: 'https://i.pravatar.cc/150?u=user2' },
  { id: 'user3', name: 'Demo User', avatarUrl: 'https://i.pravatar.cc/150?u=demo' }
];

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
    .query(({ input }) => safeProcedure(async () => {
      // Verify task exists
      const taskExists = mockTasks.some(task => task.id === input.taskId);
      
      if (!taskExists) {
        throw createNotFoundError('Task', input.taskId);
      }
      
      // Find all comments for the task
      const comments = mockComments.filter(comment => comment.taskId === input.taskId);
      
      // Sort by creation time (oldest first)
      return comments.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    })),
    
  getCommentCount: protectedProcedure
    .input(getCommentCountSchema)
    .query(({ input }) => safeProcedure(async () => {
      // Verify task exists
      const taskExists = mockTasks.some(task => task.id === input.taskId);
      
      if (!taskExists) {
        throw createNotFoundError('Task', input.taskId);
      }
      
      // Count comments for the task
      const count = mockComments.filter(comment => comment.taskId === input.taskId).length;
      
      // Return just the number as per API specification
      return count;
    })),
    
  create: protectedProcedure
    .input(createCommentSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      // Verify task exists
      const taskExists = mockTasks.some(task => task.id === input.taskId);
      
      if (!taskExists) {
        throw createNotFoundError('Task', input.taskId);
      }
      
      // Generate unique ID
      const commentId = `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Find user info
      const user = mockUsers.find(user => user.id === ctx.user?.id);
      
      if (!user) {
        throw createNotFoundError('User', ctx.user?.id);
      }
      
      // Parse mentions (looking for @username patterns)
      const mentionRegex = /@(\w+)/g;
      const mentionMatches = [...input.text.matchAll(mentionRegex)];
      const mentions = mentionMatches
        .map(match => match[1])
        .map(username => {
          // In a real app, look up user by username
          // For mock data, just return a random user ID
          return mockUsers[Math.floor(Math.random() * mockUsers.length)].id;
        });
      
      // Create new comment
      const newComment = {
        id: commentId,
        taskId: input.taskId,
        authorId: ctx.user.id, // Changed from userId to authorId per API spec
        text: input.text,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        mentions
      };
      
      mockComments.push(newComment);
      
      return newComment;
    })),
    
  update: protectedProcedure
    .input(updateCommentSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      const commentIndex = mockComments.findIndex(comment => comment.id === input.id);
      
      if (commentIndex === -1) {
        throw createNotFoundError('Comment', input.id);
      }
      
      // Check permissions (only creator or admin can update)
      const comment = mockComments[commentIndex];
      if (comment.authorId !== ctx.user?.id && ctx.user?.role !== 'admin') {
        throw createForbiddenError('You do not have permission to update this comment');
      }
      
      // Parse mentions (looking for @username patterns)
      const mentionRegex = /@(\w+)/g;
      const mentionMatches = [...input.text.matchAll(mentionRegex)];
      const mentions = mentionMatches
        .map(match => match[1])
        .map(username => {
          // In a real app, look up user by username
          // For mock data, just return a random user ID
          return mockUsers[Math.floor(Math.random() * mockUsers.length)].id;
        });
      
      // Update comment
      mockComments[commentIndex] = {
        ...mockComments[commentIndex],
        text: input.text,
        updatedAt: new Date().toISOString(),
        mentions
      };
      
      return mockComments[commentIndex];
    })),
    
  delete: protectedProcedure
    .input(deleteCommentSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      const commentIndex = mockComments.findIndex(comment => comment.id === input.id);
      
      if (commentIndex === -1) {
        throw createNotFoundError('Comment', input.id);
      }
      
      // Check permissions (only creator or admin can delete)
      const comment = mockComments[commentIndex];
      if (comment.authorId !== ctx.user?.id && ctx.user?.role !== 'admin') {
        throw createForbiddenError('You do not have permission to delete this comment');
      }
      
      // Remove comment
      mockComments.splice(commentIndex, 1);
      
      // Return success response as per API specification
      return { success: true };
    }))
});