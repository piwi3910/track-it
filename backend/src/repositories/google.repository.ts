/**
 * Google integration repository for interacting with Google APIs and database
 */
import { PrismaClient, GoogleCalendarEvent, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { createDatabaseError, createExternalServiceError } from '../utils/unified-error-handler';

interface CalendarEventData {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{ email: string }>;
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{ method: string; minutes: number }>;
  };
}

interface GoogleTaskData {
  title?: string;
  notes?: string;
  due?: string;
  completed?: string;
  status?: string;
}

export interface IGoogleRepository extends BaseRepository<GoogleCalendarEvent, Prisma.GoogleCalendarEventCreateInput, Prisma.GoogleCalendarEventUpdateInput> {
  getConnectionStatus(userId: string): Promise<{
    connected: boolean;
    email: string | null;
    services: {
      calendar: boolean;
      tasks: boolean;
      drive: boolean;
    };
  }>;
  getCalendarEvents(userId: string): Promise<Array<{
    id: string;
    googleEventId: string;
    summary: string;
    description: string | null;
    location: string | null;
    start: string;
    end: string;
    meetingLink: string | null;
    taskId?: string;
  }>>;
  createCalendarEvent(userId: string, eventData: CalendarEventData): Promise<{
    id: string;
    googleEventId: string;
    summary: string;
    description: string | null;
    location: string | null;
    start: string;
    end: string;
    meetingLink: string | null;
  }>;
  updateCalendarEvent(userId: string, eventId: string, eventData: Partial<CalendarEventData>): Promise<{
    id: string;
    googleEventId: string;
    summary: string;
    description: string | null;
    location: string | null;
    start: string;
    end: string;
    meetingLink: string | null;
  }>;
  deleteCalendarEvent(userId: string, eventId: string): Promise<{ id: string; deleted: boolean }>;
  syncCalendar(userId: string): Promise<{
    success: boolean;
    synced: number;
    created: number;
    updated: number;
    deleted: number;
  }>;
  importGoogleTaskAsTask(userId: string, googleTaskId: string, taskData?: GoogleTaskData): Promise<{
    task: {
      id: string;
      title: string;
      description: string | null;
      status: string;
      priority: string;
      tags: string[];
      dueDate: string | null;
      createdById: string;
      assigneeId: string;
    };
    googleTask: {
      id: string;
      title: string;
      notes: string;
      due: string | null;
    };
  }>;
}

export class GoogleRepository extends BaseRepository<GoogleCalendarEvent, Prisma.GoogleCalendarEventCreateInput, Prisma.GoogleCalendarEventUpdateInput> implements IGoogleRepository {
  constructor(prisma: PrismaClient) {
    super(prisma, 'GoogleCalendarEvent');
  }

  /**
   * Get Google connection status for a user
   */
  async getConnectionStatus(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          googleId: true,
          googleToken: true,
          googleRefreshToken: true,
          googleProfile: true
        }
      });
      
      if (!user) {
        throw createDatabaseError(`User with ID ${userId} not found`);
      }
      
      const isConnected = !!user.googleId && !!user.googleRefreshToken;
      
      return {
        connected: isConnected,
        email: isConnected ? user.email : null,
        services: {
          calendar: isConnected,
          tasks: isConnected,
          drive: isConnected
        }
      };
    } catch (error) {
      throw createDatabaseError(`Failed to get Google connection status for user with ID ${userId}`, { error });
    }
  }

  /**
   * Get Google Calendar events for a user
   */
  async getCalendarEvents(userId: string) {
    try {
      // First check if user has Google connection
      const connectionStatus = await this.getConnectionStatus(userId);
      
      if (!connectionStatus.connected) {
        throw createExternalServiceError('Google', 'Google account not connected');
      }
      
      // In a real implementation, this would fetch events from Google Calendar API
      // For now, return mock events from the database
      const events = await this.prisma.googleCalendarEvent.findMany({
        where: { userId }
      });
      
      return events.map(event => ({
        id: event.id,
        googleEventId: event.googleEventId,
        summary: event.title,
        description: event.description,
        location: event.location,
        start: event.startTime.toISOString(),
        end: event.endTime.toISOString(),
        meetingLink: event.meetingLink,
        taskId: event.taskId || undefined
      }));
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }
      throw createExternalServiceError('Google Calendar', `Failed to get calendar events for user with ID ${userId}`, { error });
    }
  }

  /**
   * Create a new Google Calendar event
   */
  async createCalendarEvent(userId: string, eventData: CalendarEventData) {
    try {
      // First check if user has Google connection
      const connectionStatus = await this.getConnectionStatus(userId);
      
      if (!connectionStatus.connected) {
        throw createExternalServiceError('Google', 'Google account not connected');
      }
      
      // In a real implementation, this would create an event in Google Calendar API
      // For now, just create a record in our database
      const newEvent = await this.prisma.googleCalendarEvent.create({
        data: {
          googleEventId: `google-event-${Date.now()}`,
          title: eventData.summary,
          description: eventData.description,
          startTime: new Date(eventData.start.dateTime || eventData.start.date || ''),
          endTime: new Date(eventData.end.dateTime || eventData.end.date || ''),
          location: eventData.location,
          meetingLink: null, // meetingLink would be extracted from description or conferenceData
          userId
        }
      });
      
      return {
        id: newEvent.id,
        googleEventId: newEvent.googleEventId,
        summary: newEvent.title,
        description: newEvent.description,
        location: newEvent.location,
        start: newEvent.startTime.toISOString(),
        end: newEvent.endTime.toISOString(),
        meetingLink: newEvent.meetingLink
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }
      throw createExternalServiceError('Google Calendar', `Failed to create calendar event for user with ID ${userId}`, { error });
    }
  }

  /**
   * Update a Google Calendar event
   */
  async updateCalendarEvent(userId: string, eventId: string, eventData: Partial<CalendarEventData>) {
    try {
      // First check if user has Google connection
      const connectionStatus = await this.getConnectionStatus(userId);
      
      if (!connectionStatus.connected) {
        throw createExternalServiceError('Google', 'Google account not connected');
      }
      
      // Check if event exists and belongs to the user
      const event = await this.prisma.googleCalendarEvent.findFirst({
        where: {
          OR: [
            { id: eventId },
            { googleEventId: eventId }
          ],
          userId
        }
      });
      
      if (!event) {
        throw createDatabaseError(`Calendar event with ID ${eventId} not found`);
      }
      
      // Update the event
      const updatedEvent = await this.prisma.googleCalendarEvent.update({
        where: { id: event.id },
        data: {
          title: eventData.summary ?? event.title,
          description: eventData.description ?? event.description,
          startTime: eventData.start ? new Date(eventData.start.dateTime || eventData.start.date || '') : event.startTime,
          endTime: eventData.end ? new Date(eventData.end.dateTime || eventData.end.date || '') : event.endTime,
          location: eventData.location ?? event.location,
          meetingLink: event.meetingLink // meetingLink would be in the event data
        }
      });
      
      return {
        id: updatedEvent.id,
        googleEventId: updatedEvent.googleEventId,
        summary: updatedEvent.title,
        description: updatedEvent.description,
        location: updatedEvent.location,
        start: updatedEvent.startTime.toISOString(),
        end: updatedEvent.endTime.toISOString(),
        meetingLink: updatedEvent.meetingLink
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }
      throw createExternalServiceError('Google Calendar', `Failed to update calendar event with ID ${eventId}`, { error });
    }
  }

  /**
   * Delete a Google Calendar event
   */
  async deleteCalendarEvent(userId: string, eventId: string) {
    try {
      // First check if user has Google connection
      const connectionStatus = await this.getConnectionStatus(userId);
      
      if (!connectionStatus.connected) {
        throw createExternalServiceError('Google', 'Google account not connected');
      }
      
      // Check if event exists and belongs to the user
      const event = await this.prisma.googleCalendarEvent.findFirst({
        where: {
          OR: [
            { id: eventId },
            { googleEventId: eventId }
          ],
          userId
        }
      });
      
      if (!event) {
        throw createDatabaseError(`Calendar event with ID ${eventId} not found`);
      }
      
      // Delete the event
      await this.prisma.googleCalendarEvent.delete({
        where: { id: event.id }
      });
      
      return { id: eventId, deleted: true };
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }
      throw createExternalServiceError('Google Calendar', `Failed to delete calendar event with ID ${eventId}`, { error });
    }
  }

  /**
   * Sync Google Calendar with our database
   */
  async syncCalendar(userId: string) {
    try {
      // First check if user has Google connection
      const connectionStatus = await this.getConnectionStatus(userId);
      
      if (!connectionStatus.connected) {
        throw createExternalServiceError('Google', 'Google account not connected');
      }
      
      // In a real implementation, this would sync events between Google Calendar and our database
      // For now, just return a mock result
      
      // Count existing events
      const existingEventCount = await this.prisma.googleCalendarEvent.count({
        where: { userId }
      });
      
      return {
        success: true,
        synced: existingEventCount,
        created: 0,
        updated: 0,
        deleted: 0
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }
      throw createExternalServiceError('Google Calendar', `Failed to sync calendar for user with ID ${userId}`, { error });
    }
  }

  /**
   * Import Google Task to our task system
   */
  async importGoogleTaskAsTask(userId: string, googleTaskId: string, taskData: GoogleTaskData = {}) {
    try {
      // First check if user has Google connection
      const connectionStatus = await this.getConnectionStatus(userId);
      
      if (!connectionStatus.connected) {
        throw createExternalServiceError('Google', 'Google account not connected');
      }
      
      // In a real implementation, this would retrieve the Google Task and create a task
      // For now, just create a mock task based on parameters
      
      // Create the task
      const newTask = await this.prisma.task.create({
        data: {
          title: taskData.title || 'Imported Google Task',
          description: taskData.notes || '',
          status: 'todo',
          priority: 'medium',
          tags: ['imported', 'google-tasks'],
          dueDate: taskData.due ? new Date(taskData.due) : null,
          creator: { connect: { id: userId } },
          assignee: { connect: { id: userId } }
        }
      });
      
      return {
        task: {
          id: newTask.id,
          title: newTask.title,
          description: newTask.description,
          status: 'todo',
          priority: 'medium',
          tags: ['imported', 'google-tasks'],
          dueDate: newTask.dueDate ? newTask.dueDate.toISOString() : null,
          createdById: userId,
          assigneeId: userId
        },
        googleTask: {
          id: googleTaskId,
          title: taskData.title || 'Google Task',
          notes: taskData.notes || '',
          due: taskData.due || null
        }
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }
      throw createExternalServiceError('Google Tasks', `Failed to import Google Task with ID ${googleTaskId}`, { error });
    }
  }

  // Base repository required methods
  async findAll(): Promise<GoogleCalendarEvent[]> {
    try {
      return await this.prisma.googleCalendarEvent.findMany();
    } catch (error) {
      this.handleError('find all', error);
    }
  }

  async findById(id: string): Promise<GoogleCalendarEvent | null> {
    try {
      return await this.prisma.googleCalendarEvent.findUnique({
        where: { id }
      });
    } catch (error) {
      this.handleError('find by id', error);
    }
  }

  async create(data: Prisma.GoogleCalendarEventCreateInput): Promise<GoogleCalendarEvent> {
    try {
      return await this.prisma.googleCalendarEvent.create({
        data
      });
    } catch (error) {
      this.handleError('create', error);
    }
  }

  async update(id: string, data: Prisma.GoogleCalendarEventUpdateInput): Promise<GoogleCalendarEvent> {
    try {
      return await this.prisma.googleCalendarEvent.update({
        where: { id },
        data
      });
    } catch (error) {
      this.handleError('update', error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.googleCalendarEvent.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      this.handleError('delete', error);
    }
  }
}