import { z } from 'zod';
import { router, protectedProcedure, safeProcedure } from '../trpc/trpc';
import { createValidationError, handleError } from '../utils/unified-error-handler';
import { logger } from '../server';
import repositories from '../repositories/container';


// Input validation schemas
const createEventSchema = z.object({
  summary: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  start: z.string(),
  end: z.string(),
  attendees: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional()
  })).optional()
});

const updateEventSchema = z.object({
  eventId: z.string(),
  data: z.object({
    summary: z.string().min(1).optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    start: z.string().optional(),
    end: z.string().optional(),
    attendees: z.array(z.object({
      email: z.string().email(),
      name: z.string().optional()
    })).optional()
  })
});

const deleteEventSchema = z.object({
  eventId: z.string()
});

const importGoogleTaskSchema = z.object({
  googleTaskId: z.string()
});

export const googleIntegrationRouter = router({
  // Account status
  getGoogleAccountStatus: protectedProcedure
    .query(({ ctx }) => safeProcedure(async () => {
      try {
        return await repositories.google.getConnectionStatus(ctx.user.id);
      } catch (error) {
        return handleError(error);
      }
    })),

  // Calendar operations
  getCalendarEvents: protectedProcedure
    .query(({ ctx }) => safeProcedure(async () => {
      try {
        return await repositories.google.getCalendarEvents(ctx.user.id);
      } catch (error) {
        return handleError(error);
      }
    })),
  
  createCalendarEvent: protectedProcedure
    .input(createEventSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        return await repositories.google.createCalendarEvent(ctx.user.id, {
          ...input,
          start: { dateTime: input.start },
          end: { dateTime: input.end }
        });
      } catch (error) {
        return handleError(error);
      }
    })),
  
  updateCalendarEvent: protectedProcedure
    .input(updateEventSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {
          ...input.data
        };
        if (input.data.start) {
          updateData.start = { dateTime: input.data.start };
        }
        if (input.data.end) {
          updateData.end = { dateTime: input.data.end };
        }
        return await repositories.google.updateCalendarEvent(ctx.user.id, input.eventId, updateData);
      } catch (error) {
        return handleError(error);
      }
    })),
  
  deleteCalendarEvent: protectedProcedure
    .input(deleteEventSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        return await repositories.google.deleteCalendarEvent(ctx.user.id, input.eventId);
      } catch (error) {
        return handleError(error);
      }
    })),
  
  syncCalendar: protectedProcedure
    .mutation(({ ctx }) => safeProcedure(async () => {
      try {
        logger.info({ userId: ctx.user.id }, 'Syncing calendar for user');
        return await repositories.google.syncCalendar(ctx.user.id);
      } catch (error) {
        return handleError(error);
      }
    })),
  
  // Google Tasks operations
  importGoogleTasks: protectedProcedure
    .query(({ ctx }) => safeProcedure(async () => {
      try {
        // Just return a mock array for now since we don't have a dedicated Google Task service
        const connectionStatus = await repositories.google.getConnectionStatus(ctx.user.id);
        
        if (!connectionStatus.connected) {
          throw createValidationError('Google account not connected', 'connection');
        }
        
        // This would be a real implementation in a production app
        return [
          {
            id: 'gtask1',
            title: 'Update documentation',
            notes: 'Review and update API docs',
            due: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            completed: false
          },
          {
            id: 'gtask2',
            title: 'Prepare client demo',
            notes: 'Create demo script and prepare environment',
            due: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
            completed: false
          }
        ];
      } catch (error) {
        return handleError(error);
      }
    })),
  
  importGoogleTaskAsTask: protectedProcedure
    .input(importGoogleTaskSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        return await repositories.google.importGoogleTaskAsTask(ctx.user.id, input.googleTaskId);
      } catch (error) {
        return handleError(error);
      }
    })),
  
  // Google Drive operations
  getGoogleDriveFiles: protectedProcedure
    .query(({ ctx }) => safeProcedure(async () => {
      try {
        // Just check connection status for now
        const connectionStatus = await repositories.google.getConnectionStatus(ctx.user.id);
        
        if (!connectionStatus.connected) {
          throw createValidationError('Google account not connected', 'connection');
        }
        
        // Mock data - in a real implementation, this would fetch from Google Drive API
        return [
          {
            id: 'file1',
            name: 'Project Requirements.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            webViewLink: 'https://docs.google.com/document/d/123456',
            webContentLink: 'https://drive.google.com/uc?id=123456',
            thumbnailLink: 'https://drive.google.com/thumbnail?id=123456',
            size: 1024 * 1024 * 1.5,
            createdTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            modifiedTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'file2',
            name: 'API Design.pdf',
            mimeType: 'application/pdf',
            webViewLink: 'https://drive.google.com/file/d/234567',
            webContentLink: 'https://drive.google.com/uc?id=234567',
            thumbnailLink: 'https://drive.google.com/thumbnail?id=234567',
            size: 1024 * 1024 * 2.8,
            createdTime: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            modifiedTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
      } catch (error) {
        return handleError(error);
      }
    })),
  
  // Connection status
  getConnectionStatus: protectedProcedure
    .query(({ ctx }) => safeProcedure(async () => {
      try {
        return await repositories.google.getConnectionStatus(ctx.user.id);
      } catch (error) {
        return handleError(error);
      }
    }))
});