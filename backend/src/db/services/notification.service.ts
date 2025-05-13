import { prisma } from '../client';
import { Notification, Prisma, NotificationType } from '../../generated/prisma';
import { TRPCError } from '@trpc/server';

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  resourceType?: string;
  resourceId?: string;
}

export class NotificationService {
  /**
   * Find a notification by ID
   */
  static async findById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({
      where: { id }
    });
  }

  /**
   * Get notifications for a user
   */
  static async findByUserId(userId: string, includeRead: boolean = false): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(includeRead ? {} : { read: false })
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCountByUserId(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        read: false
      }
    });
  }

  /**
   * Create a new notification
   */
  static async create(data: CreateNotificationInput): Promise<Notification> {
    try {
      return await prisma.notification.create({
        data: {
          type: data.type,
          title: data.title,
          message: data.message,
          user: {
            connect: { id: data.userId }
          },
          resourceType: data.resourceType,
          resourceId: data.resourceId
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle foreign key constraint violations
        if (error.code === 'P2003') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid user ID'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(id: string): Promise<Notification> {
    try {
      return await prisma.notification.update({
        where: { id },
        data: { read: true }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Notification not found'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: { read: true }
    });

    return result.count;
  }

  /**
   * Delete a notification
   */
  static async delete(id: string): Promise<Notification> {
    try {
      return await prisma.notification.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Notification not found'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAllForUser(userId: string): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: { userId }
    });

    return result.count;
  }

  /**
   * Create a task assignment notification
   */
  static async createTaskAssignmentNotification(
    assigneeId: string,
    assignerId: string,
    assignerName: string,
    taskId: string,
    taskTitle: string
  ): Promise<Notification> {
    return this.create({
      type: NotificationType.TASK_ASSIGNED,
      title: 'Task Assigned',
      message: `${assignerName} assigned you to task: ${taskTitle}`,
      userId: assigneeId,
      resourceType: 'task',
      resourceId: taskId
    });
  }

  /**
   * Create a task update notification
   */
  static async createTaskUpdateNotification(
    recipientId: string,
    updaterId: string,
    updaterName: string,
    taskId: string,
    taskTitle: string,
    updateType: string
  ): Promise<Notification> {
    return this.create({
      type: NotificationType.TASK_UPDATED,
      title: 'Task Updated',
      message: `${updaterName} ${updateType} task: ${taskTitle}`,
      userId: recipientId,
      resourceType: 'task',
      resourceId: taskId
    });
  }

  /**
   * Create a comment notification
   */
  static async createCommentNotification(
    recipientId: string,
    commenterId: string,
    commenterName: string,
    taskId: string,
    taskTitle: string,
    commentId: string
  ): Promise<Notification> {
    return this.create({
      type: NotificationType.COMMENT_ADDED,
      title: 'New Comment',
      message: `${commenterName} commented on task: ${taskTitle}`,
      userId: recipientId,
      resourceType: 'comment',
      resourceId: commentId
    });
  }

  /**
   * Create a due date reminder notification
   */
  static async createDueDateReminderNotification(
    userId: string,
    taskId: string,
    taskTitle: string,
    dueDate: Date
  ): Promise<Notification> {
    // Format due date
    const formattedDate = dueDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return this.create({
      type: NotificationType.DUE_DATE_REMINDER,
      title: 'Due Date Reminder',
      message: `Task "${taskTitle}" is due on ${formattedDate}`,
      userId,
      resourceType: 'task',
      resourceId: taskId
    });
  }

  /**
   * Create a mention notification
   */
  static async createMentionNotification(
    mentionedUserId: string,
    mentionerId: string,
    mentionerName: string,
    taskId: string,
    taskTitle: string,
    commentId: string
  ): Promise<Notification> {
    return this.create({
      type: NotificationType.MENTION,
      title: 'You were mentioned',
      message: `${mentionerName} mentioned you in a comment on task: ${taskTitle}`,
      userId: mentionedUserId,
      resourceType: 'comment',
      resourceId: commentId
    });
  }
}