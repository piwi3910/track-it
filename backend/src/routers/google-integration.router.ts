import { z } from 'zod';
import { router, protectedProcedure, publicProcedure, safeProcedure } from '../trpc/trpc';
import { prisma } from '../db/client';
import { GoogleApiService } from '../services/google-api.service';
import { GoogleCalendarService } from '../services/google-calendar.service';
import { GoogleTasksService } from '../services/google-tasks.service';
import { GoogleDriveService } from '../services/google-drive.service';
import { createNotFoundError, createGoogleApiError } from '../utils/error-handler';

/**
 * Google integration router with endpoints for Google services
 * including Calendar, Tasks, and Drive
 */
export const googleIntegrationRouter = router({
  // *** OAuth and Account Management *** //
  
  // Generate authorization URL
  getAuthUrl: publicProcedure
    .query(() => safeProcedure(async () => {
      // In a real implementation, this would generate a URL for the OAuth flow
      const authUrl = GoogleApiService.generateAuthUrl({
        scope: [
          'profile', 
          'email', 
          'https://www.googleapis.com/auth/calendar', 
          'https://www.googleapis.com/auth/tasks',
          'https://www.googleapis.com/auth/drive.readonly'
        ],
        redirectUri: 'http://localhost:3000/auth/google/callback',
        state: 'track-it-auth-' + Date.now()
      });
      
      return { authUrl };
    })),
    
  // Verify Google ID token
  verifyGoogleToken: publicProcedure
    .input(z.object({ token: z.string() }).strict())
    .query(({ input }) => safeProcedure(async () => {
      try {
        // Verify token with Google
        const profile = await GoogleApiService.getUserInfo(input.token);
        
        return {
          valid: true,
          email: profile.email,
          name: profile.name,
          picture: profile.picture
        };
      } catch (error) {
        console.error('Error verifying Google token:', error);
        return { valid: false };
      }
    })),
    
  // Link Google account
  linkGoogleAccount: protectedProcedure
    .input(z.object({ authCode: z.string() }).strict())
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      // Get user ID from context
      const userId = ctx.user?.id;
      if (!userId) {
        throw createNotFoundError('User');
      }
      
      try {
        // Exchange auth code for tokens
        const tokenResponse = await GoogleApiService.exchangeCodeForTokens(input.authCode);
        
        // Verify ID token to get user profile
        const profile = await GoogleApiService.getUserInfo(tokenResponse.id_token || '');
        
        // Store tokens and profile in database
        const googleAccount = await prisma.googleAccount.upsert({
          where: {
            userId_googleId: {
              userId,
              googleId: profile.sub
            }
          },
          update: {
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            tokenExpiry: new Date(tokenResponse.expiry_date),
            scopes: tokenResponse.scope,
            name: profile.name,
            email: profile.email,
            picture: profile.picture
          },
          create: {
            userId,
            googleId: profile.sub,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            tokenExpiry: new Date(tokenResponse.expiry_date),
            scopes: tokenResponse.scope,
            name: profile.name,
            email: profile.email,
            picture: profile.picture
          }
        });
        
        return {
          success: true,
          email: profile.email,
          name: profile.name,
          picture: profile.picture
        };
      } catch (error) {
        throw createGoogleApiError('Failed to link Google account', { error });
      }
    })),
  
  // Unlink Google account
  unlinkGoogleAccount: protectedProcedure
    .mutation(({ ctx }) => safeProcedure(async () => {
      // Get user ID from context
      const userId = ctx.user?.id;
      if (!userId) {
        throw createNotFoundError('User');
      }
      
      try {
        // Delete Google account for this user
        await prisma.googleAccount.deleteMany({
          where: { userId }
        });
        
        return { success: true };
      } catch (error) {
        throw createGoogleApiError('Failed to unlink Google account', { error });
      }
    })),
  
  // Get Google account status
  getGoogleAccountStatus: protectedProcedure
    .query(({ ctx }) => safeProcedure(async () => {
      // Get user ID from context
      const userId = ctx.user?.id;
      if (!userId) {
        throw createNotFoundError('User');
      }
      
      try {
        // Get Google account from database
        const googleAccount = await prisma.googleAccount.findFirst({
          where: { userId }
        });
        
        if (!googleAccount) {
          return {
            connected: false
          };
        }
        
        // Check if token is expired
        const tokenExpired = googleAccount.tokenExpiry < new Date();
        
        if (tokenExpired && googleAccount.refreshToken) {
          // Refresh the token
          const tokenResponse = await GoogleApiService.refreshAccessToken(googleAccount.refreshToken);
          
          // Update token in database
          await prisma.googleAccount.update({
            where: { id: googleAccount.id },
            data: {
              accessToken: tokenResponse.access_token,
              tokenExpiry: new Date(tokenResponse.expiry_date)
            }
          });
        }
        
        return {
          connected: true,
          email: googleAccount.email,
          name: googleAccount.name,
          picture: googleAccount.picture,
          lastSyncTime: googleAccount.lastCalendarSync || googleAccount.lastTasksSync || googleAccount.lastDriveSync,
          scopes: googleAccount.scopes?.split(' ')
        };
      } catch (error) {
        throw createGoogleApiError('Failed to get Google account status', { error });
      }
    })),
  
  // *** Calendar Integration *** //
  
  // Sync Google Calendar
  syncCalendar: protectedProcedure
    .mutation(({ ctx }) => safeProcedure(async () => {
      // Get user ID from context
      const userId = ctx.user?.id;
      if (!userId) {
        throw createNotFoundError('User');
      }
      
      try {
        // Sync calendar events
        const syncResult = await GoogleCalendarService.syncWithGoogleCalendar(userId);
        
        return syncResult;
      } catch (error) {
        throw createGoogleApiError('Failed to sync with Google Calendar', { error });
      }
    })),
  
  // Get calendar events
  getCalendarEvents: protectedProcedure
    .input(z.object({
      days: z.number().int().positive().default(30).optional(),
      includeTask: z.boolean().default(false).optional()
    }).strict().optional())
    .query(({ ctx, input }) => safeProcedure(async () => {
      // Get user ID from context
      const userId = ctx.user?.id;
      if (!userId) {
        throw createNotFoundError('User');
      }
      
      try {
        // Get calendar events from database
        const events = await GoogleCalendarService.getUpcomingEventsForUser(userId, {
          days: input?.days,
          includeTask: input?.includeTask
        });
        
        // Map to expected response format
        return events.map(event => ({
          id: event.googleEventId,
          title: event.title,
          description: event.description,
          start: event.startTime.toISOString(),
          end: event.endTime.toISOString(),
          location: event.location,
          link: event.eventLink || '',
          taskId: event.taskId || undefined,
          task: event.task
        }));
      } catch (error) {
        throw createGoogleApiError('Failed to get calendar events', { error });
      }
    })),
  
  // Get events by date range
  getEventsByDateRange: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      includeTask: z.boolean().default(false).optional()
    }).strict())
    .query(({ ctx, input }) => safeProcedure(async () => {
      // Get user ID from context
      const userId = ctx.user?.id;
      if (!userId) {
        throw createNotFoundError('User');
      }
      
      try {
        // Get calendar events from database
        const events = await GoogleCalendarService.getEventsInDateRange(
          userId,
          new Date(input.startDate),
          new Date(input.endDate),
          { includeTask: input.includeTask }
        );
        
        // Map to expected response format
        return events.map(event => ({
          id: event.googleEventId,
          title: event.title,
          description: event.description,
          start: event.startTime.toISOString(),
          end: event.endTime.toISOString(),
          location: event.location,
          link: event.eventLink || '',
          taskId: event.taskId || undefined,
          task: event.task
        }));
      } catch (error) {
        throw createGoogleApiError('Failed to get events by date range', { error });
      }
    })),
  
  // Create task from calendar event
  createTaskFromEvent: protectedProcedure
    .input(z.object({
      eventId: z.string()
    }).strict())
    .mutation(({ ctx, input }) => safeProcedure(async () => {
      // Get user ID from context
      const userId = ctx.user?.id;
      if (!userId) {
        throw createNotFoundError('User');
      }
      
      try {
        // Create task from event
        const task = await GoogleCalendarService.createTaskFromEvent(input.eventId, userId);
        
        return task;
      } catch (error) {
        throw createGoogleApiError('Failed to create task from event', { error });
      }
    })),
  
  // Create calendar event from task
  createEventFromTask: protectedProcedure
    .input(z.object({
      taskId: z.string()
    }).strict())
    .mutation(({ ctx, input }) => safeProcedure(async () => {
      // Get user ID from context
      const userId = ctx.user?.id;
      if (!userId) {
        throw createNotFoundError('User');
      }
      
      try {
        // Create event from task
        const event = await GoogleCalendarService.createEventFromTask(input.taskId, userId);
        
        return {
          id: event.googleEventId,
          title: event.title,
          description: event.description,
          start: event.startTime.toISOString(),
          end: event.endTime.toISOString(),
          location: event.location,
          link: event.eventLink || ''
        };
      } catch (error) {
        throw createGoogleApiError('Failed to create event from task', { error });
      }
    })),
  
  // *** Tasks Integration *** //
  
  // Sync Google Tasks
  syncTasks: protectedProcedure
    .mutation(({ ctx }) => safeProcedure(async () => {
      // Get user ID from context
      const userId = ctx.user?.id;
      if (!userId) {
        throw createNotFoundError('User');
      }
      
      try {
        // Sync tasks
        const syncResult = await GoogleTasksService.syncTasksFromGoogle(userId);
        
        return syncResult;
      } catch (error) {
        throw createGoogleApiError('Failed to sync with Google Tasks', { error });
      }
    })),
  
  // Get task lists
  getTaskLists: protectedProcedure
    .query(({ ctx }) => safeProcedure(async () => {
      // Get user ID from context
      const userId = ctx.user?.id;
      if (!userId) {
        throw createNotFoundError('User');
      }
      
      try {
        // Get task lists from database, syncing if needed
        const taskLists = await GoogleTasksService.syncTaskLists(userId);
        
        return taskLists.map(list => ({
          id: list.googleTaskListId,
          title: list.title
        }));
      } catch (error) {
        throw createGoogleApiError('Failed to get task lists', { error });
      }
    })),
  
  // Import Google Tasks
  importGoogleTasks: protectedProcedure
    .query(({ ctx }) => safeProcedure(async () => {
      // Get user ID from context
      const userId = ctx.user?.id;
      if (!userId) {
        throw createNotFoundError('User');
      }
      
      try {
        // Import tasks
        const tasks = await GoogleTasksService.importTasksAsTrackItTasks(userId);
        
        return tasks;
      } catch (error) {
        throw createGoogleApiError('Failed to import Google Tasks', { error });
      }
    })),
  
  // Create Google Task from task
  createGoogleTaskFromTask: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      taskListId: z.string().optional()
    }).strict())
    .mutation(({ ctx, input }) => safeProcedure(async () => {
      // Get user ID from context
      const userId = ctx.user?.id;
      if (!userId) {
        throw createNotFoundError('User');
      }
      
      try {
        // Create Google Task
        const googleTask = await GoogleTasksService.createGoogleTaskFromTask(
          input.taskId,
          userId,
          input.taskListId
        );
        
        return {
          id: googleTask.googleTaskId,
          title: googleTask.title,
          notes: googleTask.notes,
          due: googleTask.due?.toISOString(),
          status: googleTask.status
        };
      } catch (error) {
        throw createGoogleApiError('Failed to create Google Task from task', { error });
      }
    })),
  
  // Get Google Tasks
  getGoogleTasks: protectedProcedure
    .input(z.object({
      includeCompleted: z.boolean().default(false).optional(),
      includeTask: z.boolean().default(false).optional(),
      limit: z.number().int().positive().default(50).optional()
    }).strict().optional())
    .query(({ ctx, input }) => safeProcedure(async () => {
      // Get user ID from context
      const userId = ctx.user?.id;
      if (!userId) {
        throw createNotFoundError('User');
      }
      
      try {
        // Get tasks from database
        const tasks = await GoogleTasksService.getTasksForUser(userId, {
          includeCompleted: input?.includeCompleted,
          includeTask: input?.includeTask,
          includeTaskList: true,
          limit: input?.limit
        });
        
        // Map to expected response format
        return tasks.map(task => ({
          id: task.googleTaskId,
          title: task.title,
          notes: task.notes,
          due: task.due?.toISOString(),
          status: task.status,
          completed: task.completed?.toISOString(),
          taskListId: task.googleTaskListId,
          taskListTitle: task.taskList?.title,
          taskId: task.taskId,
          task: task.task
        }));
      } catch (error) {
        throw createGoogleApiError('Failed to get Google Tasks', { error });
      }
    })),
  
  // *** Drive Integration *** //
  
  // Sync Google Drive files
  syncDriveFiles: protectedProcedure
    .input(z.object({
      query: z.string().optional(),
      maxResults: z.number().int().positive().default(100).optional()
    }).strict().optional())
    .mutation(({ ctx, input }) => safeProcedure(async () => {
      // Get user ID from context
      const userId = ctx.user?.id;
      if (!userId) {
        throw createNotFoundError('User');
      }
      
      try {
        // Sync files
        const files = await GoogleDriveService.syncFilesFromGoogleDrive(userId, {
          query: input?.query,
          maxResults: input?.maxResults
        });
        
        return files.map(file => ({
          id: file.id,
          googleFileId: file.googleFileId,
          name: file.name,
          mimeType: file.mimeType,
          webViewLink: file.webViewLink,
          iconLink: file.iconLink,
          thumbnailLink: file.thumbnailLink,
          size: file.size,
          createdTime: file.createdTime?.toISOString(),
          modifiedTime: file.modifiedTime?.toISOString()
        }));
      } catch (error) {
        throw createGoogleApiError('Failed to sync Google Drive files', { error });
      }
    })),
  
  // Get Google Drive files
  getGoogleDriveFiles: protectedProcedure
    .input(z.object({
      limit: z.number().int().positive().default(50).optional(),
      includeAttachments: z.boolean().default(false).optional()
    }).strict().optional())
    .query(({ ctx, input }) => safeProcedure(async () => {
      // Get user ID from context
      const userId = ctx.user?.id;
      if (!userId) {
        throw createNotFoundError('User');
      }
      
      try {
        // Get files from database
        const files = await GoogleDriveService.getFilesForUser(userId, {
          limit: input?.limit,
          includeAttachments: input?.includeAttachments
        });
        
        // Map to expected response format
        return files.map(file => ({
          id: file.id,
          googleFileId: file.googleFileId,
          name: file.name,
          mimeType: file.mimeType,
          webViewLink: file.webViewLink,
          iconLink: file.iconLink,
          thumbnailLink: file.thumbnailLink,
          size: file.size,
          createdTime: file.createdTime?.toISOString(),
          modifiedTime: file.modifiedTime?.toISOString(),
          attachments: file.attachments?.map(attachment => ({
            id: attachment.id,
            taskId: attachment.taskId,
            name: attachment.name
          }))
        }));
      } catch (error) {
        throw createGoogleApiError('Failed to get Google Drive files', { error });
      }
    })),
  
  // Search Google Drive files
  searchDriveFiles: protectedProcedure
    .input(z.object({
      query: z.string(),
      limit: z.number().int().positive().default(20).optional()
    }).strict())
    .query(({ ctx, input }) => safeProcedure(async () => {
      // Get user ID from context
      const userId = ctx.user?.id;
      if (!userId) {
        throw createNotFoundError('User');
      }
      
      try {
        // Search files
        const files = await GoogleDriveService.searchFiles(userId, input.query, {
          limit: input.limit
        });
        
        // Map to expected response format
        return files.map(file => ({
          id: file.id,
          googleFileId: file.googleFileId,
          name: file.name,
          mimeType: file.mimeType,
          webViewLink: file.webViewLink,
          iconLink: file.iconLink,
          thumbnailLink: file.thumbnailLink
        }));
      } catch (error) {
        throw createGoogleApiError('Failed to search Google Drive files', { error });
      }
    })),
  
  // Attach Google Drive file to task
  attachDriveFileToTask: protectedProcedure
    .input(z.object({
      fileId: z.string(),
      taskId: z.string()
    }).strict())
    .mutation(({ ctx, input }) => safeProcedure(async () => {
      // Get user ID from context
      const userId = ctx.user?.id;
      if (!userId) {
        throw createNotFoundError('User');
      }
      
      try {
        // Attach file to task
        const attachment = await GoogleDriveService.attachFileToTask(
          input.fileId,
          input.taskId,
          userId
        );
        
        return attachment;
      } catch (error) {
        throw createGoogleApiError('Failed to attach Google Drive file to task', { error });
      }
    })),
  
  // Remove Google Drive file from task
  removeDriveFileFromTask: protectedProcedure
    .input(z.object({
      attachmentId: z.string()
    }).strict())
    .mutation(({ ctx, input }) => safeProcedure(async () => {
      try {
        // Remove file from task
        await GoogleDriveService.removeFileFromTask(input.attachmentId);
        
        return { success: true };
      } catch (error) {
        throw createGoogleApiError('Failed to remove Google Drive file from task', { error });
      }
    })),
  
  // Get recent files
  getRecentFiles: protectedProcedure
    .input(z.object({
      limit: z.number().int().positive().default(10).optional(),
      days: z.number().int().positive().default(7).optional()
    }).strict().optional())
    .query(({ ctx, input }) => safeProcedure(async () => {
      // Get user ID from context
      const userId = ctx.user?.id;
      if (!userId) {
        throw createNotFoundError('User');
      }
      
      try {
        // Get recent files
        const files = await GoogleDriveService.getRecentFiles(userId, {
          limit: input?.limit,
          days: input?.days
        });
        
        // Map to expected response format
        return files.map(file => ({
          id: file.id,
          googleFileId: file.googleFileId,
          name: file.name,
          mimeType: file.mimeType,
          webViewLink: file.webViewLink,
          iconLink: file.iconLink,
          thumbnailLink: file.thumbnailLink,
          modifiedTime: file.modifiedTime?.toISOString()
        }));
      } catch (error) {
        throw createGoogleApiError('Failed to get recent files', { error });
      }
    }))
});