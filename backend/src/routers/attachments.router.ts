import { z } from 'zod';
import { router, protectedProcedure, safeProcedure } from '../trpc/trpc';
import { createNotFoundError, createForbiddenError } from '../utils/error-handler';

// Mock attachments database (updated to match API spec)
const mockAttachments = [
  {
    id: 'attachment1',
    taskId: 'task1',
    name: 'API Design.pdf',
    fileType: 'application/pdf', // Changed from 'type' to 'fileType' per API spec
    size: 1024 * 1024 * 2.5, // 2.5 MB
    url: 'https://example.com/files/api-design.pdf',
    thumbnailUrl: 'https://example.com/thumbnails/api-design.jpg',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // Changed from 'uploadedAt' per API spec
  },
  {
    id: 'attachment2',
    taskId: 'task1',
    name: 'Error Handling Flows.png',
    fileType: 'image/png', // Changed from 'type' to 'fileType' per API spec
    size: 1024 * 512, // 512 KB
    url: 'https://example.com/files/error-handling-flows.png',
    thumbnailUrl: 'https://example.com/thumbnails/error-handling-flows.jpg',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // Changed from 'uploadedAt' per API spec
  },
  {
    id: 'attachment3',
    taskId: 'task3',
    name: 'Login Flow Diagram.jpg',
    fileType: 'image/jpeg', // Changed from 'type' to 'fileType' per API spec
    size: 1024 * 768, // 768 KB
    url: 'https://example.com/files/login-flow-diagram.jpg',
    thumbnailUrl: 'https://example.com/thumbnails/login-flow-diagram.jpg',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // Changed from 'uploadedAt' per API spec
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
      
      // Sort by creation time (newest first)
      return attachments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
      
      // Create new attachment (using API spec property names)
      const newAttachment = {
        id: attachmentId,
        taskId: input.taskId,
        name: input.file.name,
        fileType: input.file.type, // Changed from 'type' to 'fileType' per API spec
        size: input.file.size,
        url,
        thumbnailUrl,
        createdAt: new Date().toISOString() // Changed from 'uploadedAt' per API spec
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
      
      // No need to check permissions for the mock implementation
      // In a real implementation, we would check if the user has permission to delete
      const attachment = mockAttachments[attachmentIndex];
      
      // Remove attachment
      mockAttachments.splice(attachmentIndex, 1);
      
      // Return success response as per API specification
      return { success: true };
    }))
});