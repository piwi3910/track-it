import { z } from 'zod';
import { router, protectedProcedure, safeProcedure } from '../trpc/trpc';
import { createNotFoundError, createForbiddenError, handleError } from '../utils/unified-error-handler';
import repositories from '../repositories/container';
import { normalizeDates } from '@track-it/shared';

// Define the Notification type from the service response
type NotificationFromService = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  userId: string;
  resourceType: string | null;
  resourceId: string | null;
};

// Helper function to normalize notification data for API response
const normalizeNotificationData = (notification: NotificationFromService): {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  userId: string;
  relatedEntityId: string | null;
  relatedEntityType: string | null;
} => {
  const normalized = normalizeDates(notification, ['createdAt']);
  return {
    id: normalized.id,
    type: normalized.type,
    title: normalized.title,
    message: normalized.message,
    read: normalized.read,
    createdAt: normalized.createdAt as unknown as string,
    userId: normalized.userId,
    // Map database field names to API spec names
    relatedEntityId: normalized.resourceId,
    relatedEntityType: normalized.resourceType
  };
};

// Input validation schemas
const markAsReadSchema = z.object({
  id: z.string()
});

export const notificationsRouter = router({
  getAll: protectedProcedure
    .query(({ ctx }) => safeProcedure(async (): Promise<Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      read: boolean;
      createdAt: string;
      userId: string;
      relatedEntityId: string | null;
      relatedEntityType: string | null;
    }>> => {
      try {
        // Get all notifications for the user
        const notifications = await repositories.notifications.findByUserId(ctx.user.id, true);
        
        // Return normalized notifications
        return notifications.map(normalizeNotificationData);
      } catch (error) {
        return handleError(error);
      }
    })),
  
  markAsRead: protectedProcedure
    .input(markAsReadSchema)
    .mutation(({ input, ctx }) => safeProcedure(async (): Promise<{
      id: string;
      read: boolean;
    }> => {
      try {
        // Get notification by ID
        const notification = await repositories.notifications.findById(input.id);
        
        if (!notification) {
          throw createNotFoundError('Notification', input.id);
        }
        
        // Check if notification belongs to the user
        if (notification.userId !== ctx.user.id) {
          throw createForbiddenError('You do not have permission to update this notification');
        }
        
        // Mark as read
        const updatedNotification = await repositories.notifications.markAsRead(input.id);
        
        return { 
          id: updatedNotification.id, 
          read: updatedNotification.read 
        };
      } catch (error) {
        return handleError(error);
      }
    })),
  
  markAllAsRead: protectedProcedure
    .mutation(({ ctx }) => safeProcedure(async (): Promise<{
      markedCount: number;
      success: boolean;
    }> => {
      try {
        // Mark all notifications as read for the user
        const markedCount = await repositories.notifications.markAllAsReadForUser(ctx.user.id);
        
        return { 
          markedCount,
          success: true
        };
      } catch (error) {
        return handleError(error);
      }
    })),
  
  getUnreadCount: protectedProcedure
    .query(({ ctx }) => safeProcedure(async (): Promise<{ count: number }> => {
      try {
        // Get unread notification count for the user
        const count = await repositories.notifications.countUnreadByUserId(ctx.user.id);
        
        return { count };
      } catch (error) {
        return handleError(error);
      }
    }))
});