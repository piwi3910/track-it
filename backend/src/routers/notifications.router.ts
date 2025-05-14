import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { TRPCError } from '@trpc/server';
import { Notification } from '@track-it/shared';

// Mock notifications database - Add some sample notifications
const mockNotifications: Notification[] = [
  {
    id: 'notification-1',
    userId: 'user1',
    type: 'assignment',
    message: 'You have been assigned to a new task',
    relatedTaskId: 'task-1',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    read: false
  },
  {
    id: 'notification-2',
    userId: 'user1',
    type: 'comment',
    message: 'Someone commented on your task',
    relatedTaskId: 'task-2',
    relatedCommentId: 'comment-1',
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    read: true
  },
  {
    id: 'notification-3',
    userId: 'user1',
    type: 'due_soon',
    message: 'A task is due soon',
    relatedTaskId: 'task-3',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    read: false
  }
];

// Notifications router with endpoints
export const notificationsRouter = router({
  // Get all notifications for the current user
  getAll: protectedProcedure
    .query(({ ctx }) => {
      // In a real implementation, this would filter by the current user
      // For now, return all mock notifications since they're all assigned to user1
      return mockNotifications;
    }),
    
  // Get unread notification count
  getUnreadCount: protectedProcedure
    .query(({ ctx }) => {
      // Count unread notifications for the current user
      const unreadCount = mockNotifications.filter(
        notification => notification.userId === ctx.user?.id && !notification.read
      ).length;
      
      return unreadCount;
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
    
  // Mark all notifications as read
  markAllAsRead: protectedProcedure
    .mutation(({ ctx }) => {
      // Mark all notifications for the current user as read
      mockNotifications.forEach((notification, index) => {
        if (notification.userId === ctx.user?.id) {
          mockNotifications[index] = {
            ...notification,
            read: true
          };
        }
      });
      
      return { success: true };
    }),
    
  // Delete a notification
  delete: protectedProcedure
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
          message: 'You do not have permission to delete this notification'
        });
      }
      
      // Remove the notification
      mockNotifications.splice(notificationIndex, 1);
      
      return { success: true };
    }),
    
  // Update notification preferences
  updatePreferences: protectedProcedure
    .input(z.object({
      email: z.boolean().optional(),
      inApp: z.boolean().optional(),
      types: z.array(z.enum(['assignment', 'mention', 'comment', 'due_soon', 'status_change'])).optional(),
    }).strict())
    .mutation(({ input, ctx }) => {
      // In a real implementation, this would update user preferences in the database
      return { success: true, preferences: input };
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