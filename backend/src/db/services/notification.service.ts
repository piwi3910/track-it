/**
 * Notification service for database operations on Notification model
 */
import { Prisma, NotificationType as PrismaNotificationType } from '@prisma/client';
import prisma from '../client';
import { createDatabaseError } from '../../utils/error-handler';
// NOTIFICATION_TYPE import removed - not used

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(userId: string) {
  try {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc'
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to get notifications for user with ID ${userId}`, { error });
  }
}

/**
 * Get notification by ID
 */
export async function getNotificationById(id: string) {
  try {
    return await prisma.notification.findUnique({
      where: { id }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to get notification with ID ${id}`, { error });
  }
}

/**
 * Create a new notification
 */
export async function createNotification(data: Prisma.NotificationCreateInput) {
  try {
    return await prisma.notification.create({
      data
    });
  } catch (error) {
    throw createDatabaseError('Failed to create notification', { error });
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(id: string) {
  try {
    return await prisma.notification.update({
      where: { id },
      data: {
        read: true
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to mark notification with ID ${id} as read`, { error });
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true
      }
    });
    
    return result.count;
  } catch (error) {
    throw createDatabaseError(`Failed to mark all notifications as read for user with ID ${userId}`, { error });
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string) {
  try {
    return await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to get unread notification count for user with ID ${userId}`, { error });
  }
}

/**
 * Create task assignment notification
 */
export async function createTaskAssignedNotification(taskId: string, taskTitle: string, assigneeId: string) {
  try {
    return await prisma.notification.create({
      data: {
        type: PrismaNotificationType.TASK_ASSIGNED,
        title: 'New Task Assigned',
        message: `You have been assigned to "${taskTitle}"`,
        resourceType: 'task',
        resourceId: taskId,
        read: false,
        user: {
          connect: { id: assigneeId }
        }
      }
    });
  } catch (error) {
    throw createDatabaseError('Failed to create task assigned notification', { error });
  }
}

/**
 * Create comment mention notification
 */
export async function createCommentMentionNotification(commentId: string, taskId: string, taskTitle: string, mentionedUserId: string, authorId: string, authorName: string) {
  try {
    return await prisma.notification.create({
      data: {
        type: PrismaNotificationType.MENTION,
        title: 'Mentioned in Comment',
        message: `${authorName} mentioned you in a comment on "${taskTitle}"`,
        resourceType: 'comment',
        resourceId: commentId,
        read: false,
        user: {
          connect: { id: mentionedUserId }
        }
      }
    });
  } catch (error) {
    throw createDatabaseError('Failed to create comment mention notification', { error });
  }
}

/**
 * Create task updated notification
 */
export async function createTaskUpdatedNotification(taskId: string, taskTitle: string, userId: string, updaterName: string) {
  try {
    return await prisma.notification.create({
      data: {
        type: PrismaNotificationType.TASK_UPDATED,
        title: 'Task Updated',
        message: `${updaterName} updated "${taskTitle}"`,
        resourceType: 'task',
        resourceId: taskId,
        read: false,
        user: {
          connect: { id: userId }
        }
      }
    });
  } catch (error) {
    throw createDatabaseError('Failed to create task updated notification', { error });
  }
}

/**
 * Create due date reminder notification
 */
export async function createDueDateReminderNotification(taskId: string, taskTitle: string, userId: string, daysRemaining: number) {
  try {
    return await prisma.notification.create({
      data: {
        type: PrismaNotificationType.DUE_DATE_REMINDER,
        title: 'Task Due Soon',
        message: `Task "${taskTitle}" is due in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
        resourceType: 'task',
        resourceId: taskId,
        read: false,
        user: {
          connect: { id: userId }
        }
      }
    });
  } catch (error) {
    throw createDatabaseError('Failed to create due date reminder notification', { error });
  }
}