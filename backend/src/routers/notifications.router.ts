import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { TRPCError } from '@trpc/server';
import { Notification } from '@track-it/shared';

// Mock notifications database
const mockNotifications: Notification[] = [];

// Notifications router with endpoints
export const notificationsRouter = router({
  // Get all notifications for the current user
  getAll: protectedProcedure
    .query(({ ctx }) => {
      // In a real implementation, this would filter by the current user
      return mockNotifications.filter(notification => notification.userId === ctx.user?.id);
    }),
    
  // Mark a notification as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }).strict())
    .mutation(({ input, ctx }) => {
      const notificationIndex = mockNotifications.findIndex(notification => notification.id === input.id);
      
      if (notificationIndex === -1) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found'
        });
      }
      
      // Check if the notification belongs to the current user
      const notification = mockNotifications[notificationIndex];
      if (notification.userId !== ctx.user?.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to mark this notification as read'
        });
      }
      
      // Mark the notification as read
      mockNotifications[notificationIndex] = {
        ...notification,
        read: true
      };
      
      return { success: true };
    }),
    
  // Create a notification (internal use only)
  // This would be called by other parts of the system when events occur
  createNotification: protectedProcedure
    .input(z.object({
      userId: z.string(),
      type: z.enum(['assignment', 'mention', 'comment', 'due_soon', 'status_change']),
      message: z.string(),
      relatedTaskId: z.string().optional(),
      relatedCommentId: z.string().optional()
    }).strict())
    .mutation(({ input }) => {
      const newNotification: Notification = {
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: input.userId,
        type: input.type,
        message: input.message,
        relatedTaskId: input.relatedTaskId,
        relatedCommentId: input.relatedCommentId,
        createdAt: new Date().toISOString(),
        read: false
      };
      
      mockNotifications.push(newNotification);
      return newNotification;
    })
});