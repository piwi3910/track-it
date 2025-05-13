import { prisma } from '../client';
import { GoogleCalendarEvent, Prisma } from '../../generated/prisma';
import { TRPCError } from '@trpc/server';

export interface CreateGoogleCalendarEventInput {
  googleEventId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  meetingLink?: string;
  userId: string;
  taskId?: string;
}

export interface UpdateGoogleCalendarEventInput extends Partial<Omit<CreateGoogleCalendarEventInput, 'googleEventId' | 'userId'>> {}

export class GoogleCalendarService {
  /**
   * Find a Google Calendar event by ID
   */
  static async findById(id: string): Promise<GoogleCalendarEvent | null> {
    return prisma.googleCalendarEvent.findUnique({
      where: { id }
    });
  }

  /**
   * Find a Google Calendar event by Google event ID
   */
  static async findByGoogleId(googleEventId: string): Promise<GoogleCalendarEvent | null> {
    return prisma.googleCalendarEvent.findUnique({
      where: { googleEventId }
    });
  }

  /**
   * Get upcoming events for a user
   */
  static async getUpcomingEventsForUser(userId: string, limit: number = 10): Promise<GoogleCalendarEvent[]> {
    return prisma.googleCalendarEvent.findMany({
      where: {
        userId,
        startTime: {
          gte: new Date()
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      take: limit
    });
  }

  /**
   * Get events for a date range
   */
  static async getEventsInDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<GoogleCalendarEvent[]> {
    return prisma.googleCalendarEvent.findMany({
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
      }
    });
  }

  /**
   * Get events linked to a task
   */
  static async getEventsByTaskId(taskId: string): Promise<GoogleCalendarEvent[]> {
    return prisma.googleCalendarEvent.findMany({
      where: { taskId },
      orderBy: {
        startTime: 'asc'
      }
    });
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

          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Event with this Google ID already exists'
          });
        }
      }
      throw error;
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
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Google Calendar event not found'
          });
        }
      }
      throw error;
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
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Google Calendar event not found'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Delete a Google Calendar event by Google event ID
   */
  static async deleteByGoogleId(googleEventId: string): Promise<GoogleCalendarEvent> {
    const event = await prisma.googleCalendarEvent.findUnique({
      where: { googleEventId }
    });

    if (!event) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Google Calendar event not found'
      });
    }

    return this.delete(event.id);
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
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Google Calendar event not found'
          });
        }
        // Handle foreign key constraint violations
        if (error.code === 'P2003') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid task ID'
          });
        }
      }
      throw error;
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
        })
      );
    }

    return { created, updated, deleted };
  }
}