/**
 * Google integration service for interacting with Google APIs
 */
import prisma from '../client';
import { createDatabaseError, createExternalServiceError } from '../../utils/error-handler';

/**
 * Get Google connection status for a user
 * @param userId User ID to check
 * @returns Connection status information
 */
export async function getConnectionStatus(userId: string) {
  try {
    const user = await prisma.user.findUnique({
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
 * @param userId User ID
 * @returns Array of calendar events
 */
export async function getCalendarEvents(userId: string) {
  try {
    // First check if user has Google connection
    const connectionStatus = await getConnectionStatus(userId);
    
    if (!connectionStatus.connected) {
      throw createExternalServiceError('Google', 'Google account not connected');
    }
    
    // In a real implementation, this would fetch events from Google Calendar API
    // For now, return mock events from the database
    const events = await prisma.googleCalendarEvent.findMany({
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
 * @param userId User ID
 * @param eventData Event data to create
 * @returns The created event
 */
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

export async function createCalendarEvent(userId: string, eventData: CalendarEventData) {
  try {
    // First check if user has Google connection
    const connectionStatus = await getConnectionStatus(userId);
    
    if (!connectionStatus.connected) {
      throw createExternalServiceError('Google', 'Google account not connected');
    }
    
    // In a real implementation, this would create an event in Google Calendar API
    // For now, just create a record in our database
    const newEvent = await prisma.googleCalendarEvent.create({
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
 * @param userId User ID
 * @param eventId Event ID to update
 * @param eventData Updated event data
 * @returns The updated event
 */
export async function updateCalendarEvent(userId: string, eventId: string, eventData: Partial<CalendarEventData>) {
  try {
    // First check if user has Google connection
    const connectionStatus = await getConnectionStatus(userId);
    
    if (!connectionStatus.connected) {
      throw createExternalServiceError('Google', 'Google account not connected');
    }
    
    // Check if event exists and belongs to the user
    const event = await prisma.googleCalendarEvent.findFirst({
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
    const updatedEvent = await prisma.googleCalendarEvent.update({
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
 * @param userId User ID
 * @param eventId Event ID to delete
 * @returns Operation success status
 */
export async function deleteCalendarEvent(userId: string, eventId: string) {
  try {
    // First check if user has Google connection
    const connectionStatus = await getConnectionStatus(userId);
    
    if (!connectionStatus.connected) {
      throw createExternalServiceError('Google', 'Google account not connected');
    }
    
    // Check if event exists and belongs to the user
    const event = await prisma.googleCalendarEvent.findFirst({
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
    await prisma.googleCalendarEvent.delete({
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
 * @param userId User ID
 * @returns Sync results
 */
export async function syncCalendar(userId: string) {
  try {
    // First check if user has Google connection
    const connectionStatus = await getConnectionStatus(userId);
    
    if (!connectionStatus.connected) {
      throw createExternalServiceError('Google', 'Google account not connected');
    }
    
    // In a real implementation, this would sync events between Google Calendar and our database
    // For now, just return a mock result
    
    // Count existing events
    const existingEventCount = await prisma.googleCalendarEvent.count({
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
 * @param userId User ID
 * @param googleTaskId Google Task ID to import
 * @param taskData Additional task data
 * @returns The created task
 */
interface GoogleTaskData {
  title?: string;
  notes?: string;
  due?: string;
  completed?: string;
  status?: string;
}

export async function importGoogleTaskAsTask(userId: string, googleTaskId: string, taskData: GoogleTaskData = {}) {
  try {
    // First check if user has Google connection
    const connectionStatus = await getConnectionStatus(userId);
    
    if (!connectionStatus.connected) {
      throw createExternalServiceError('Google', 'Google account not connected');
    }
    
    // In a real implementation, this would retrieve the Google Task and create a task
    // For now, just create a mock task based on parameters
    
    // Create the task
    const newTask = await prisma.task.create({
      data: {
        title: taskData.title || 'Imported Google Task',
        description: taskData.notes || '',
        status: 'TODO',
        priority: 'MEDIUM',
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