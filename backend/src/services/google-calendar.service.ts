/**
 * Google Calendar Service
 * 
 * This service manages Google Calendar integration, including syncing events
 * between Google Calendar and Track-It tasks.
 */
import { prisma } from '../db/client';
import { 
  GoogleCalendarEvent, 
  Task, 
  Prisma, 
  GoogleAccount 
} from '../generated/prisma';
import { GoogleApiService } from './google-api.service';
import { createGoogleApiError, createNotFoundError, createDatabaseError } from '../utils/error-handler';

// Input types
export interface CreateGoogleCalendarEventInput {
  googleEventId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  meetingLink?: string;
  eventLink?: string;
  userId: string;
  taskId?: string;
}

export interface UpdateGoogleCalendarEventInput extends Partial<Omit<CreateGoogleCalendarEventInput, 'googleEventId' | 'userId'>> {}

// Interface for sync statistics
export interface CalendarSyncStats {
  created: number;
  updated: number;
  deleted: number;
  errors: number;
}

// Calendar event with Google data
export interface CalendarEventWithTask extends GoogleCalendarEvent {
  task?: Task | null;
}

export class GoogleCalendarService {
  /**
   * Find a Google Calendar event by ID
   */
  static async findById(id: string): Promise<GoogleCalendarEvent | null> {
    try {
      return await prisma.googleCalendarEvent.findUnique({
        where: { id }
      });
    } catch (error) {
      throw createDatabaseError('Failed to find Google Calendar event', { id, error });
    }
  }

  /**
   * Find a Google Calendar event by Google event ID
   */
  static async findByGoogleId(googleEventId: string): Promise<GoogleCalendarEvent | null> {
    try {
      return await prisma.googleCalendarEvent.findUnique({
        where: { googleEventId }
      });
    } catch (error) {
      throw createDatabaseError('Failed to find Google Calendar event by Google ID', { googleEventId, error });
    }
  }

  /**
   * Get upcoming events for a user
   */
  static async getUpcomingEventsForUser(
    userId: string, 
    options: { 
      limit?: number; 
      includeTask?: boolean;
      days?: number;
    } = {}
  ): Promise<CalendarEventWithTask[]> {
    const { limit = 10, includeTask = false, days = 30 } = options;
    
    try {
      // Calculate date range - today to N days in future
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      
      return await prisma.googleCalendarEvent.findMany({
        where: {
          userId,
          startTime: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          startTime: 'asc'
        },
        take: limit,
        include: includeTask ? {
          task: true
        } : undefined
      });
    } catch (error) {
      throw createDatabaseError('Failed to get upcoming events for user', { userId, options, error });
    }
  }

  /**
   * Get events for a date range
   */
  static async getEventsInDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    options: { includeTask?: boolean } = {}
  ): Promise<CalendarEventWithTask[]> {
    const { includeTask = false } = options;
    
    try {
      return await prisma.googleCalendarEvent.findMany({
        where: {
          userId,
          OR: [
            {
              // Events that start within the range
              startTime: {
                gte: startDate,
                lte: endDate
              }
            },
            {
              // Events that end within the range
              endTime: {
                gte: startDate,
                lte: endDate
              }
            },
            {
              // Events that span the entire range
              startTime: {
                lte: startDate
              },
              endTime: {
                gte: endDate
              }
            }
          ]
        },
        orderBy: {
          startTime: 'asc'
        },
        include: includeTask ? {
          task: true
        } : undefined
      });
    } catch (error) {
      throw createDatabaseError('Failed to get events in date range', { userId, startDate, endDate, options, error });
    }
  }

  /**
   * Get events linked to a task
   */
  static async getEventsByTaskId(taskId: string): Promise<GoogleCalendarEvent[]> {
    try {
      return await prisma.googleCalendarEvent.findMany({
        where: { taskId },
        orderBy: {
          startTime: 'asc'
        }
      });
    } catch (error) {
      throw createDatabaseError('Failed to get events by task ID', { taskId, error });
    }
  }

  /**
   * Create a new Google Calendar event
   */
  static async create(data: CreateGoogleCalendarEventInput): Promise<GoogleCalendarEvent> {
    try {
      return await prisma.googleCalendarEvent.create({
        data: {
          googleEventId: data.googleEventId,
          title: data.title,
          description: data.description,
          startTime: data.startTime,
          endTime: data.endTime,
          location: data.location,
          meetingLink: data.meetingLink,
          eventLink: data.eventLink,
          userId: data.userId,
          taskId: data.taskId,
          lastSynced: new Date()
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle unique constraint violations
        if (error.code === 'P2002') {
          // Try to update the event if it already exists
          const existingEvent = await prisma.googleCalendarEvent.findUnique({
            where: { googleEventId: data.googleEventId }
          });

          if (existingEvent) {
            return await this.update(existingEvent.id, data);
          }

          throw createDatabaseError('Event with this Google ID already exists', { 
            googleEventId: data.googleEventId,
            error
          });
        }
      }
      throw createDatabaseError('Failed to create Google Calendar event', { data, error });
    }
  }

  /**
   * Update a Google Calendar event
   */
  static async update(id: string, data: UpdateGoogleCalendarEventInput): Promise<GoogleCalendarEvent> {
    try {
      return await prisma.googleCalendarEvent.update({
        where: { id },
        data: {
          ...data,
          lastSynced: new Date()
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw createNotFoundError('Google Calendar event', id);
        }
      }
      throw createDatabaseError('Failed to update Google Calendar event', { id, data, error });
    }
  }

  /**
   * Delete a Google Calendar event
   */
  static async delete(id: string): Promise<GoogleCalendarEvent> {
    try {
      return await prisma.googleCalendarEvent.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw createNotFoundError('Google Calendar event', id);
        }
      }
      throw createDatabaseError('Failed to delete Google Calendar event', { id, error });
    }
  }

  /**
   * Delete a Google Calendar event by Google event ID
   */
  static async deleteByGoogleId(googleEventId: string): Promise<GoogleCalendarEvent> {
    try {
      const event = await prisma.googleCalendarEvent.findUnique({
        where: { googleEventId }
      });

      if (!event) {
        throw createNotFoundError('Google Calendar event', googleEventId);
      }

      return await this.delete(event.id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw createNotFoundError('Google Calendar event', googleEventId);
        }
      }
      throw createDatabaseError('Failed to delete Google Calendar event by Google ID', { googleEventId, error });
    }
  }

  /**
   * Link a Google Calendar event to a task
   */
  static async linkToTask(id: string, taskId: string): Promise<GoogleCalendarEvent> {
    try {
      return await prisma.googleCalendarEvent.update({
        where: { id },
        data: { taskId }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw createNotFoundError('Google Calendar event', id);
        }
        // Handle foreign key constraint violations
        if (error.code === 'P2003') {
          throw createDatabaseError('Invalid task ID', { id, taskId, error });
        }
      }
      throw createDatabaseError('Failed to link Google Calendar event to task', { id, taskId, error });
    }
  }

  /**
   * Bulk upsert Google Calendar events
   * This is used for syncing multiple events from Google Calendar
   */
  static async bulkUpsert(
    events: CreateGoogleCalendarEventInput[]
  ): Promise<{ created: number; updated: number; deleted: number }> {
    let created = 0;
    let updated = 0;
    let deleted = 0;

    // Process in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (event) => {
          try {
            const existingEvent = await prisma.googleCalendarEvent.findUnique({
              where: { googleEventId: event.googleEventId }
            });

            if (existingEvent) {
              await this.update(existingEvent.id, event);
              updated++;
            } else {
              await this.create(event);
              created++;
            }
          } catch (error) {
            console.error(`Failed to upsert event ${event.googleEventId}:`, error);
          }
        })
      );
    }

    return { created, updated, deleted };
  }

  /**
   * Sync events with Google Calendar for a user
   */
  static async syncWithGoogleCalendar(userId: string): Promise<CalendarSyncStats> {
    // Get user's Google Account
    const googleAccount = await prisma.googleAccount.findFirst({
      where: { userId }
    });

    if (!googleAccount || !googleAccount.accessToken) {
      throw createNotFoundError('Google account', userId);
    }

    try {
      // Fetch events from Google Calendar
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30); // Sync next 30 days

      const events = await GoogleApiService.getCalendarEvents(googleAccount.accessToken, {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        maxResults: 100,
        singleEvents: true
      });

      // Convert Google events to our database format
      const calendarEvents = events.map(event => ({
        googleEventId: event.id,
        title: event.summary,
        description: event.description,
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime),
        location: event.location,
        meetingLink: event.conferenceData?.conferenceUrl,
        eventLink: event.htmlLink,
        userId
      }));

      // Sync events with database
      const stats = await this.bulkUpsert(calendarEvents);

      // Update Google account's last sync time
      await prisma.googleAccount.update({
        where: { id: googleAccount.id },
        data: { 
          lastCalendarSync: new Date(),
          calendarSynced: true
        }
      });

      return {
        created: stats.created,
        updated: stats.updated,
        deleted: stats.deleted,
        errors: 0
      };
    } catch (error) {
      throw createGoogleApiError('Failed to sync with Google Calendar', { userId, error });
    }
  }

  /**
   * Create a Google Calendar event from a task
   */
  static async createEventFromTask(taskId: string, userId: string): Promise<GoogleCalendarEvent> {
    // Get user's Google Account
    const googleAccount = await prisma.googleAccount.findFirst({
      where: { userId }
    });

    if (!googleAccount || !googleAccount.accessToken) {
      throw createNotFoundError('Google account', userId);
    }

    // Get task details
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      throw createNotFoundError('Task', taskId);
    }

    try {
      // Calculate event dates based on task
      const startTime = task.dueDate ? new Date(task.dueDate) : new Date();
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1); // Default duration: 1 hour

      // Create the event in Google Calendar
      const event = await GoogleApiService.createCalendarEvent(
        googleAccount.accessToken,
        'primary', // Use primary calendar
        {
          summary: task.title,
          description: `${task.description || ''}\n\nCreated from Track-It task: ${taskId}`,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: 'UTC'
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: 'UTC'
          }
        }
      );

      // Save the event in our database and link it to the task
      return await this.create({
        googleEventId: event.id,
        title: event.summary,
        description: event.description,
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime),
        location: event.location,
        meetingLink: event.conferenceData?.conferenceUrl,
        eventLink: event.htmlLink,
        userId,
        taskId
      });
    } catch (error) {
      throw createGoogleApiError('Failed to create Google Calendar event from task', { taskId, userId, error });
    }
  }

  /**
   * Update a Google Calendar event to match a task
   */
  static async updateEventFromTask(eventId: string, taskId: string, userId: string): Promise<GoogleCalendarEvent> {
    // Get user's Google Account
    const googleAccount = await prisma.googleAccount.findFirst({
      where: { userId }
    });

    if (!googleAccount || !googleAccount.accessToken) {
      throw createNotFoundError('Google account', userId);
    }

    // Get event details
    const event = await this.findById(eventId);
    if (!event) {
      throw createNotFoundError('Google Calendar event', eventId);
    }

    // Get task details
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      throw createNotFoundError('Task', taskId);
    }

    try {
      // Calculate event dates based on task
      const startTime = task.dueDate ? new Date(task.dueDate) : new Date();
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1); // Default duration: 1 hour

      // Update the event in Google Calendar
      const updatedEvent = await GoogleApiService.updateCalendarEvent(
        googleAccount.accessToken,
        'primary', // Use primary calendar
        event.googleEventId,
        {
          summary: task.title,
          description: `${task.description || ''}\n\nUpdated from Track-It task: ${taskId}`,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: 'UTC'
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: 'UTC'
          }
        }
      );

      // Update the event in our database
      return await this.update(eventId, {
        title: updatedEvent.summary,
        description: updatedEvent.description,
        startTime: new Date(updatedEvent.start.dateTime),
        endTime: new Date(updatedEvent.end.dateTime),
        location: updatedEvent.location,
        meetingLink: updatedEvent.conferenceData?.conferenceUrl,
        eventLink: updatedEvent.htmlLink,
        taskId
      });
    } catch (error) {
      throw createGoogleApiError('Failed to update Google Calendar event from task', { eventId, taskId, userId, error });
    }
  }
  
  /**
   * Delete a Google Calendar event 
   */
  static async deleteGoogleEvent(eventId: string, userId: string): Promise<boolean> {
    // Get user's Google Account
    const googleAccount = await prisma.googleAccount.findFirst({
      where: { userId }
    });

    if (!googleAccount || !googleAccount.accessToken) {
      throw createNotFoundError('Google account', userId);
    }

    // Get event details
    const event = await this.findById(eventId);
    if (!event) {
      throw createNotFoundError('Google Calendar event', eventId);
    }

    try {
      // Delete the event from Google Calendar
      await GoogleApiService.deleteCalendarEvent(
        googleAccount.accessToken,
        'primary', // Use primary calendar
        event.googleEventId
      );

      // Delete from our database
      await this.delete(eventId);
      
      return true;
    } catch (error) {
      throw createGoogleApiError('Failed to delete Google Calendar event', { eventId, userId, error });
    }
  }
  
  /**
   * Create a task from a Google Calendar event
   */
  static async createTaskFromEvent(eventId: string, userId: string): Promise<Task> {
    // Get event details
    const event = await this.findById(eventId);
    if (!event) {
      throw createNotFoundError('Google Calendar event', eventId);
    }
    
    try {
      // Create a task from the event
      const task = await prisma.task.create({
        data: {
          title: event.title,
          description: `${event.description || ''}\n\nFrom Google Calendar: ${event.eventLink || 'No link available'}`,
          status: 'todo',
          priority: 'medium',
          dueDate: event.startTime,
          reporterId: userId,
          source: 'google',
          tags: ['calendar', 'imported']
        }
      });
      
      // Link the event to the task
      await this.linkToTask(eventId, task.id);
      
      return task;
    } catch (error) {
      throw createDatabaseError('Failed to create task from Google Calendar event', { eventId, userId, error });
    }
  }
  
  /**
   * Sync task with linked Google Calendar event
   */
  static async syncTaskWithEvent(taskId: string): Promise<Task> {
    // Get task details
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        googleCalendarEvents: true
      }
    });
    
    if (!task) {
      throw createNotFoundError('Task', taskId);
    }
    
    // Check if task has linked events
    if (!task.googleCalendarEvents || task.googleCalendarEvents.length === 0) {
      // No linked events, nothing to sync
      return task;
    }
    
    try {
      // Get the first linked event (assuming one task can have multiple events)
      const event = task.googleCalendarEvents[0];
      
      // Update task with event data
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          title: event.title,
          description: event.description || task.description,
          dueDate: event.startTime
        }
      });
      
      return updatedTask;
    } catch (error) {
      throw createDatabaseError('Failed to sync task with Google Calendar event', { taskId, error });
    }
  }
}