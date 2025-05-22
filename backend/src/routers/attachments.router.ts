import { z } from 'zod';
import { router, protectedProcedure, safeProcedure } from '../trpc/trpc';
import { createNotFoundError, createForbiddenError, handleError } from '../utils/error-handler';
import * as attachmentService from '../db/services/attachment.service';
import * as taskService from '../db/services/task.service';

// Helper function to normalize attachment data for API response
const normalizeAttachmentData = (attachment: any) => {
  return {
    ...attachment,
    // Map database column names to API spec names
    fileType: attachment.fileType,
    createdAt: attachment.uploadedAt instanceof Date ? 
      attachment.uploadedAt.toISOString() : attachment.uploadedAt,
    // Format sizes
    size: typeof attachment.fileSize === 'number' ? attachment.fileSize : attachment.size
  };
};

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
      try {
        // Verify task exists
        const task = await taskService.getTaskById(input.taskId);
        
        if (!task) {
          throw createNotFoundError('Task', input.taskId);
        }
        
        // Get all attachments for the task
        const attachments = await attachmentService.getAttachmentsByTaskId(input.taskId);
        
        // Return normalized attachments
        return attachments.map(normalizeAttachmentData);
      } catch (error) {
        return handleError(error);
      }
    })),
  
  upload: protectedProcedure
    .input(uploadAttachmentSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        // Verify task exists
        const task = await taskService.getTaskById(input.taskId);
        
        if (!task) {
          throw createNotFoundError('Task', input.taskId);
        }
        
        // Generate URLs for the file
        const url = attachmentService.generateFileUrl(input.file.name);
        const thumbnailUrl = attachmentService.generateThumbnailUrl(input.file.name, input.file.type);
        
        // Create new attachment
        const newAttachment = await attachmentService.createAttachment({
          fileName: input.file.name,
          fileSize: input.file.size,
          fileType: input.file.type,
          filePath: url,
          googleDriveId: null,
          googleDriveUrl: null,
          task: {
            connect: { id: input.taskId }
          }
        });
        
        // Return the attachment with the additional URL properties
        return normalizeAttachmentData({
          ...newAttachment,
          url,
          thumbnailUrl
        });
      } catch (error) {
        return handleError(error);
      }
    })),
  
  delete: protectedProcedure
    .input(deleteAttachmentSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        // Get attachment by ID
        const attachment = await attachmentService.getAttachmentById(input.id);
        
        if (!attachment) {
          throw createNotFoundError('Attachment', input.id);
        }
        
        // Get task to check permissions
        const task = await taskService.getTaskById(attachment.taskId);
        
        if (!task) {
          throw createNotFoundError('Task', attachment.taskId);
        }
        
        // Check if user has permission to modify this task
        if (task.creatorId !== ctx.user.id && task.assigneeId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw createForbiddenError('You do not have permission to delete attachments for this task');
        }
        
        // Delete attachment
        await attachmentService.deleteAttachment(input.id);
        
        // Return success response as per API specification
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    }))
});