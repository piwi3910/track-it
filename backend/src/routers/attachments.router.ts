import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { TRPCError } from '@trpc/server';
import type {
  Attachment
} from '@track-it/shared';

// Mock attachments database
const mockAttachments: Attachment[] = [];

// Attachments router with endpoints
export const attachmentsRouter = router({
  // Get attachments by task ID
  getByTaskId: protectedProcedure
    .input(z.object({ taskId: z.string() }).strict())
    .query(({ input }): Attachment[] => {
      return mockAttachments.filter(attachment => attachment.taskId === input.taskId);
    }),
    
  // Upload a new attachment
  upload: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      file: z.object({
        name: z.string(),
        type: z.string(),
        size: z.number().positive()
      })
    }).strict())
    .mutation(({ input }): Attachment => {
      // In a real implementation, the file would be uploaded to a storage service
      // and the URL would be returned
      const timestamp = new Date().toISOString();
      const newAttachment: Attachment = {
        id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        taskId: input.taskId,
        name: input.file.name,
        fileType: input.file.type,
        size: input.file.size,
        url: `https://mock-cdn.example.com/files/${input.taskId}/${input.file.name}`,
        createdAt: timestamp,
        // Generate thumbnail URL for image types
        thumbnailUrl: input.file.type.startsWith('image/') 
          ? `https://mock-cdn.example.com/thumbnails/${input.taskId}/${input.file.name}`
          : undefined
      };
      
      mockAttachments.push(newAttachment);
      return newAttachment;
    }),
    
  // Delete an attachment
  delete: protectedProcedure
    .input(z.object({ id: z.string() }).strict())
    .mutation(({ input }): { success: boolean } => {
      const attachmentIndex = mockAttachments.findIndex(attachment => attachment.id === input.id);
      
      if (attachmentIndex === -1) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Attachment not found'
        });
      }
      
      // In a real implementation, the file would be deleted from the storage service
      
      mockAttachments.splice(attachmentIndex, 1);
      return { success: true };
    })
});