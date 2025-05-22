import { z } from 'zod';
import { router, protectedProcedure, safeProcedure } from '../trpc/trpc';
import { createNotFoundError, createForbiddenError, handleError } from '../utils/error-handler';
import * as notificationService from '../db/services/notification.service';
import { NOTIFICATION_TYPE, formatEnumForApi } from '../utils/constants';

// Helper function to normalize notification data for API response
const normalizeNotificationData = (notification: any) => {
  return {
    ...notification,
    // Map database field names to API spec names
    type: formatEnumForApi(notification.type),
    relatedEntityId: notification.resourceId,
    relatedEntityType: notification.resourceType,
    // Format dates as ISO strings if they exist as Date objects
    createdAt: notification.createdAt instanceof Date ? 
      notification.createdAt.toISOString() : notification.createdAt
  };
};

// Input validation schemas
const markAsReadSchema = z.object({
  id: z.string()
});

export const notificationsRouter = router({
  getAll: protectedProcedure
    .query(({ ctx }) => safeProcedure(async () => {
      try {
        // Get all notifications for the user
        const notifications = await notificationService.getUserNotifications(ctx.user.id);
        
        // Return normalized notifications
        return notifications.map(normalizeNotificationData);
      } catch (error) {
        return handleError(error);
      }
    })),
  
  markAsRead: protectedProcedure
    .input(markAsReadSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        // Get notification by ID
        const notification = await notificationService.getNotificationById(input.id);
        
        if (!notification) {
          throw createNotFoundError('Notification', input.id);
        }
        
        // Check if notification belongs to the user
        if (notification.userId !== ctx.user.id) {
          throw createForbiddenError('You do not have permission to update this notification');
        }
        
        // Mark as read
        const updatedNotification = await notificationService.markAsRead(input.id);
        
        return { 
          id: updatedNotification.id, 
          read: updatedNotification.read 
        };
      } catch (error) {
        return handleError(error);
      }
    })),
  
  markAllAsRead: protectedProcedure
    .mutation(({ ctx }) => safeProcedure(async () => {
      try {
        // Mark all notifications as read for the user
        const markedCount = await notificationService.markAllAsRead(ctx.user.id);
        
        return { 
          markedCount,
          success: true
        };
      } catch (error) {
        return handleError(error);
      }
    })),
  
  getUnreadCount: protectedProcedure
    .query(({ ctx }) => safeProcedure(async () => {
      try {
        // Get unread notification count for the user
        const count = await notificationService.getUnreadCount(ctx.user.id);
        
        return { count };
      } catch (error) {
        return handleError(error);
      }
    }))
});