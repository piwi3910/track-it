import { z } from 'zod';
import { router, protectedProcedure, safeProcedure } from '../trpc/trpc';
import { createNotFoundError, createValidationError } from '../utils/error-handler';
import { logger } from '../server';

// Mock data for Google Calendar
const mockCalendarEvents = [
  {
    id: 'event1',
    summary: 'Team Meeting',
    description: 'Weekly team sync',
    location: 'Conference Room A',
    start: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    attendees: [
      { email: 'john.doe@example.com', name: 'John Doe', responseStatus: 'accepted' },
      { email: 'jane.smith@example.com', name: 'Jane Smith', responseStatus: 'accepted' },
      { email: 'demo@example.com', name: 'Demo User', responseStatus: 'needsAction' }
    ],
    calendarId: 'primary',
    googleEventId: 'google-event-id-1'
  },
  {
    id: 'event2',
    summary: 'API Review',
    description: 'Review API implementation and error handling',
    location: 'Virtual - Zoom',
    start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    attendees: [
      { email: 'john.doe@example.com', name: 'John Doe', responseStatus: 'accepted' },
      { email: 'demo@example.com', name: 'Demo User', responseStatus: 'accepted' }
    ],
    calendarId: 'primary',
    googleEventId: 'google-event-id-2'
  },
  {
    id: 'event3',
    summary: 'Client Demo',
    description: 'Demonstrate new features to client',
    location: 'Virtual - Teams',
    start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000).toISOString(),
    attendees: [
      { email: 'john.doe@example.com', name: 'John Doe', responseStatus: 'accepted' },
      { email: 'jane.smith@example.com', name: 'Jane Smith', responseStatus: 'tentative' },
      { email: 'demo@example.com', name: 'Demo User', responseStatus: 'accepted' },
      { email: 'client@company.com', name: 'Client Contact', responseStatus: 'accepted' }
    ],
    calendarId: 'primary',
    googleEventId: 'google-event-id-3'
  }
];

// Mock data for Google Tasks
const mockGoogleTasks = [
  {
    id: 'gtask1',
    title: 'Update documentation',
    notes: 'Review and update API docs',
    due: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    completed: false,
    taskListId: 'primary-list',
    googleTaskId: 'google-task-id-1'
  },
  {
    id: 'gtask2',
    title: 'Prepare client demo',
    notes: 'Create demo script and prepare environment',
    due: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    completed: false,
    taskListId: 'primary-list',
    googleTaskId: 'google-task-id-2'
  },
  {
    id: 'gtask3',
    title: 'Send meeting notes',
    notes: 'Summarize action items from team meeting',
    due: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    completed: false,
    taskListId: 'primary-list',
    googleTaskId: 'google-task-id-3'
  }
];

// Mock data for Google Drive
const mockDriveFiles = [
  {
    id: 'file1',
    name: 'Project Requirements.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    webViewLink: 'https://docs.google.com/document/d/123456',
    webContentLink: 'https://drive.google.com/uc?id=123456',
    thumbnailLink: 'https://drive.google.com/thumbnail?id=123456',
    size: 1024 * 1024 * 1.5, // 1.5 MB
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
    size: 1024 * 1024 * 2.8, // 2.8 MB
    createdTime: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    modifiedTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'file3',
    name: 'Project Timeline.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    webViewLink: 'https://docs.google.com/spreadsheets/d/345678',
    webContentLink: 'https://drive.google.com/uc?id=345678',
    thumbnailLink: 'https://drive.google.com/thumbnail?id=345678',
    size: 1024 * 512, // 512 KB
    createdTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    modifiedTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Mock users with Google connections
const mockUserGoogleConnections = {
  'user1': {
    connected: true,
    email: 'john.doe@example.com',
    refreshToken: 'mock-refresh-token-1',
    calendarId: 'primary',
    taskListId: 'primary-list'
  },
  'user2': {
    connected: true,
    email: 'jane.smith@example.com',
    refreshToken: 'mock-refresh-token-2',
    calendarId: 'primary',
    taskListId: 'primary-list'
  },
  'user3': {
    connected: true,
    email: 'demo@example.com',
    refreshToken: 'mock-refresh-token-3',
    calendarId: 'primary',
    taskListId: 'primary-list'
  }
};

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
  // Calendar operations
  getCalendarEvents: protectedProcedure
    .query(({ ctx }) => safeProcedure(async () => {
      // Check if user has connected Google account
      const userConnection = mockUserGoogleConnections[ctx.user?.id];
      
      if (!userConnection?.connected) {
        throw createValidationError('Google account not connected', 'connection');
      }
      
      // Filter events for the user (by email)
      const userEvents = mockCalendarEvents.filter(event => 
        event.attendees.some(attendee => 
          attendee.email === userConnection.email
        )
      );
      
      return userEvents;
    })),
  
  createCalendarEvent: protectedProcedure
    .input(createEventSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      // Check if user has connected Google account
      const userConnection = mockUserGoogleConnections[ctx.user?.id];
      
      if (!userConnection?.connected) {
        throw createValidationError('Google account not connected', 'connection');
      }
      
      // Generate unique ID
      const eventId = `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Add current user as an attendee if not already included
      const attendees = input.attendees || [];
      if (!attendees.some(a => a.email === userConnection.email)) {
        attendees.push({
          email: userConnection.email,
          name: ctx.user?.name || 'User',
          responseStatus: 'accepted'
        });
      }
      
      // Create new event
      const newEvent = {
        id: eventId,
        ...input,
        attendees,
        calendarId: userConnection.calendarId,
        googleEventId: `google-event-id-${eventId}`
      };
      
      mockCalendarEvents.push(newEvent);
      
      return newEvent;
    })),
  
  updateCalendarEvent: protectedProcedure
    .input(updateEventSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      // Check if user has connected Google account
      const userConnection = mockUserGoogleConnections[ctx.user?.id];
      
      if (!userConnection?.connected) {
        throw createValidationError('Google account not connected', 'connection');
      }
      
      // Find event
      const eventIndex = mockCalendarEvents.findIndex(event => 
        event.id === input.eventId || event.googleEventId === input.eventId
      );
      
      if (eventIndex === -1) {
        throw createNotFoundError('Calendar event', input.eventId);
      }
      
      // Check if user is an attendee
      const event = mockCalendarEvents[eventIndex];
      const isAttendee = event.attendees.some(attendee => 
        attendee.email === userConnection.email
      );
      
      if (!isAttendee) {
        throw createValidationError('You are not an attendee of this event', 'permission');
      }
      
      // Update event
      mockCalendarEvents[eventIndex] = {
        ...mockCalendarEvents[eventIndex],
        ...input.data
      };
      
      return mockCalendarEvents[eventIndex];
    })),
  
  deleteCalendarEvent: protectedProcedure
    .input(deleteEventSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      // Check if user has connected Google account
      const userConnection = mockUserGoogleConnections[ctx.user?.id];
      
      if (!userConnection?.connected) {
        throw createValidationError('Google account not connected', 'connection');
      }
      
      // Find event
      const eventIndex = mockCalendarEvents.findIndex(event => 
        event.id === input.eventId || event.googleEventId === input.eventId
      );
      
      if (eventIndex === -1) {
        throw createNotFoundError('Calendar event', input.eventId);
      }
      
      // Check if user is an attendee
      const event = mockCalendarEvents[eventIndex];
      const isAttendee = event.attendees.some(attendee => 
        attendee.email === userConnection.email
      );
      
      if (!isAttendee) {
        throw createValidationError('You are not an attendee of this event', 'permission');
      }
      
      // Remove event
      mockCalendarEvents.splice(eventIndex, 1);
      
      return { id: input.eventId, deleted: true };
    })),
  
  syncCalendar: protectedProcedure
    .mutation(({ ctx }) => safeProcedure(async () => {
      // Check if user has connected Google account
      const userConnection = mockUserGoogleConnections[ctx.user?.id];
      
      if (!userConnection?.connected) {
        throw createValidationError('Google account not connected', 'connection');
      }
      
      // In a real application, this would sync with Google Calendar
      logger.info({ userId: ctx.user.id }, 'Syncing calendar for user');
      
      // Mock sync result
      return { 
        success: true, 
        synced: mockCalendarEvents.length, 
        created: 0, 
        updated: 0, 
        deleted: 0 
      };
    })),
  
  // Google Tasks operations
  importGoogleTasks: protectedProcedure
    .query(({ ctx }) => safeProcedure(async () => {
      // Check if user has connected Google account
      const userConnection = mockUserGoogleConnections[ctx.user?.id];
      
      if (!userConnection?.connected) {
        throw createValidationError('Google account not connected', 'connection');
      }
      
      // Return all Google Tasks
      return mockGoogleTasks;
    })),
  
  importGoogleTaskAsTask: protectedProcedure
    .input(importGoogleTaskSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      // Check if user has connected Google account
      const userConnection = mockUserGoogleConnections[ctx.user?.id];
      
      if (!userConnection?.connected) {
        throw createValidationError('Google account not connected', 'connection');
      }
      
      // Find Google Task
      const googleTask = mockGoogleTasks.find(task => 
        task.id === input.googleTaskId || task.googleTaskId === input.googleTaskId
      );
      
      if (!googleTask) {
        throw createNotFoundError('Google Task', input.googleTaskId);
      }
      
      // Create a new task from Google Task
      const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      const newTask = {
        id: taskId,
        title: googleTask.title,
        description: googleTask.notes || '',
        status: 'todo',
        priority: 'medium',
        tags: ['imported', 'google-tasks'],
        dueDate: googleTask.due,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdById: ctx.user.id,
        assigneeId: ctx.user.id,
        estimatedHours: 2, // default
        actualHours: 0,
        timeTrackingActive: false,
        trackingTimeSeconds: 0,
        subtasks: [],
        googleTaskId: googleTask.googleTaskId
      };
      
      // In a real app, this would be added to the tasks database
      
      return {
        task: newTask,
        googleTask
      };
    })),
  
  // Google Drive operations
  getGoogleDriveFiles: protectedProcedure
    .query(({ ctx }) => safeProcedure(async () => {
      // Check if user has connected Google account
      const userConnection = mockUserGoogleConnections[ctx.user?.id];
      
      if (!userConnection?.connected) {
        throw createValidationError('Google account not connected', 'connection');
      }
      
      // Return all Drive files
      return mockDriveFiles;
    })),
  
  // Connection status
  getConnectionStatus: protectedProcedure
    .query(({ ctx }) => safeProcedure(async () => {
      // Check if user has connected Google account
      const userConnection = mockUserGoogleConnections[ctx.user?.id];
      
      return {
        connected: !!userConnection?.connected,
        email: userConnection?.email || null,
        services: {
          calendar: !!userConnection?.connected,
          tasks: !!userConnection?.connected,
          drive: !!userConnection?.connected
        }
      };
    }))
});