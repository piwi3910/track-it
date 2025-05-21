import { z } from 'zod';
import { router, protectedProcedure, safeProcedure } from '../trpc/trpc';
import { createNotFoundError, createForbiddenError } from '../utils/error-handler';

// Mock notifications database
const mockNotifications = [
  {
    id: 'notification1',
    userId: 'user1',
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: 'You have been assigned to "Complete API Implementation"',
    relatedEntityId: 'task1',
    relatedEntityType: 'task',
    read: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'notification2',
    userId: 'user1',
    type: 'comment_mention',
    title: 'Mentioned in Comment',
    message: 'Jane Smith mentioned you in a comment on "Complete API Implementation"',
    relatedEntityId: 'comment2',
    relatedEntityType: 'comment',
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'notification3',
    userId: 'user2',
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: 'You have been assigned to "Add Dark Mode"',
    relatedEntityId: 'task2',
    relatedEntityType: 'task',
    read: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'notification4',
    userId: 'user3',
    type: 'task_completed',
    title: 'Task Completed',
    message: 'You completed "Fix Login Issues"',
    relatedEntityId: 'task3',
    relatedEntityType: 'task',
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'notification5',
    userId: 'user3',
    type: 'task_due_soon',
    title: 'Task Due Soon',
    message: 'Task "Fix Login Issues" is due in 1 day',
    relatedEntityId: 'task3',
    relatedEntityType: 'task',
    read: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Input validation schemas
const markAsReadSchema = z.object({
  id: z.string()
});

export const notificationsRouter = router({
  getAll: protectedProcedure
    .query(({ ctx }) => safeProcedure(async () => {
      // Find all notifications for the user
      const userNotifications = mockNotifications.filter(notification => 
        notification.userId === ctx.user?.id
      );
      
      // Sort by creation time (newest first)
      return userNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    })),
  
  markAsRead: protectedProcedure
    .input(markAsReadSchema)
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      const notificationIndex = mockNotifications.findIndex(notification => 
        notification.id === input.id
      );
      
      if (notificationIndex === -1) {
        throw createNotFoundError('Notification', input.id);
      }
      
      // Check if notification belongs to the user
      const notification = mockNotifications[notificationIndex];
      if (notification.userId !== ctx.user?.id) {
        throw createForbiddenError('You do not have permission to update this notification');
      }
      
      // Mark as read
      mockNotifications[notificationIndex].read = true;
      
      return { 
        id: notification.id, 
        read: true 
      };
    })),
  
  markAllAsRead: protectedProcedure
    .mutation(({ ctx }) => safeProcedure(async () => {
      // Find all unread notifications for the user
      let markedCount = 0;
      
      mockNotifications.forEach((notification, index) => {
        if (notification.userId === ctx.user?.id && !notification.read) {
          mockNotifications[index].read = true;
          markedCount++;
        }
      });
      
      return { 
        markedCount,
        success: true
      };
    })),
  
  getUnreadCount: protectedProcedure
    .query(({ ctx }) => safeProcedure(async () => {
      // Count unread notifications for the user
      const unreadCount = mockNotifications.filter(notification => 
        notification.userId === ctx.user?.id && !notification.read
      ).length;
      
      return { count: unreadCount };
    }))
});