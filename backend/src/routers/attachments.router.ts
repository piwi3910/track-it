import { z } from 'zod';
import { router, protectedProcedure, safeProcedure } from '../trpc/trpc';
import { createNotFoundError, createForbiddenError } from '../utils/error-handler';

// Mock attachments database
const mockAttachments = [
  {
    id: 'attachment1',
    taskId: 'task1',
    name: 'API Design.pdf',
    type: 'application/pdf',
    size: 1024 * 1024 * 2.5, // 2.5 MB
    url: 'https://example.com/files/api-design.pdf',
    thumbnailUrl: 'https://example.com/thumbnails/api-design.jpg',
    uploadedBy: 'user1',
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'attachment2',
    taskId: 'task1',
    name: 'Error Handling Flows.png',
    type: 'image/png',
    size: 1024 * 512, // 512 KB
    url: 'https://example.com/files/error-handling-flows.png',
    thumbnailUrl: 'https://example.com/thumbnails/error-handling-flows.jpg',
    uploadedBy: 'user2',
    uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'attachment3',
    taskId: 'task3',
    name: 'Login Flow Diagram.jpg',
    type: 'image/jpeg',
    size: 1024 * 768, // 768 KB
    url: 'https://example.com/files/login-flow-diagram.jpg',
    thumbnailUrl: 'https://example.com/thumbnails/login-flow-diagram.jpg',
    uploadedBy: 'user3',
    uploadedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Mock tasks for validation
const mockTasks = [
  { id: 'task1' },
  { id: 'task2' },
  { id: 'task3' }
];

// Input validation schemas
const getAttachmentsByTaskSchema = z.object({
  taskId: z.string()
});

const uploadAttachmentSchema = z.object({
  taskId: z.string(),
  file: z.object({
    name: z.string(),
    type: z.string(),
    size: z.number()
  })
});

const deleteAttachmentSchema = z.object({
  id: z.string()
});

export const attachmentsRouter = router({
  getByTaskId: protectedProcedure
    .input(getAttachmentsByTaskSchema)
    .query(({ input }) => safeProcedure(async () => {
      // Verify task exists
      const taskExists = mockTasks.some(task => task.id === input.taskId);
      
      if (!taskExists) {
        throw createNotFoundError('Task', input.taskId);
      }
      
      // Find all attachments for the task
      const attachments = mockAttachments.filter(attachment => attachment.taskId === input.taskId);
      
      // Sort by upload time (newest first)
      return attachments.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
    })),
  
  upload: protectedProcedure
    .input(uploadAttachmentSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      // Verify task exists
      const taskExists = mockTasks.some(task => task.id === input.taskId);
      
      if (!taskExists) {
        throw createNotFoundError('Task', input.taskId);
      }
      
      // Generate unique ID
      const attachmentId = `attachment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Generate fake URLs based on file type
      let url = `https://example.com/files/${input.file.name.toLowerCase().replace(/\s+/g, '-')}`;
      let thumbnailUrl = null;
      
      // Generate thumbnail URL for image types
      if (input.file.type.startsWith('image/')) {
        thumbnailUrl = `https://example.com/thumbnails/${input.file.name.toLowerCase().replace(/\s+/g, '-')}`;
      }
      
      // Create new attachment
      const newAttachment = {
        id: attachmentId,
        taskId: input.taskId,
        name: input.file.name,
        type: input.file.type,
        size: input.file.size,
        url,
        thumbnailUrl,
        uploadedBy: ctx.user.id,
        uploadedAt: new Date().toISOString()
      };
      
      mockAttachments.push(newAttachment);
      
      return newAttachment;
    })),
  
  delete: protectedProcedure
    .input(deleteAttachmentSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      const attachmentIndex = mockAttachments.findIndex(attachment => attachment.id === input.id);
      
      if (attachmentIndex === -1) {
        throw createNotFoundError('Attachment', input.id);
      }
      
      // Check permissions (only uploader or admin can delete)
      const attachment = mockAttachments[attachmentIndex];
      if (attachment.uploadedBy !== ctx.user?.id && ctx.user?.role !== 'admin') {
        throw createForbiddenError('You do not have permission to delete this attachment');
      }
      
      // Remove attachment
      mockAttachments.splice(attachmentIndex, 1);
      
      return { id: input.id, deleted: true };
    }))
});