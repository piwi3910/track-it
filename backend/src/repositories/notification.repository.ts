import { Prisma, Notification, PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';

/**
 * Notification repository interface extending base repository with notification-specific methods
 */
export interface INotificationRepository extends BaseRepository<Notification, Prisma.NotificationCreateInput, Prisma.NotificationUpdateInput> {
  findByUserId(userId: string, includeRead?: boolean): Promise<Notification[]>;
  findUnreadByUserId(userId: string): Promise<Notification[]>;
  markAsRead(id: string): Promise<Notification>;
  markAllAsReadForUser(userId: string): Promise<number>;
  countUnreadByUserId(userId: string): Promise<number>;
}

/**
 * Notification repository implementation
 */
export class NotificationRepository extends BaseRepository<Notification, Prisma.NotificationCreateInput, Prisma.NotificationUpdateInput> 
  implements INotificationRepository {
  
  constructor(prisma: PrismaClient) {
    super(prisma, 'Notification');
  }

  async findAll(): Promise<Notification[]> {
    try {
      return await this.prisma.notification.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      this.handleError('find all', error);
    }
  }

  async findById(id: string): Promise<Notification | null> {
    try {
      return await this.prisma.notification.findUnique({
        where: { id }
      });
    } catch (error) {
      this.handleError(`find by id ${id}`, error);
    }
  }

  async findByUserId(userId: string, includeRead = false): Promise<Notification[]> {
    try {
      const whereClause: Prisma.NotificationWhereInput = includeRead 
        ? { userId }
        : { userId, read: false };

      return await this.prisma.notification.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc'
        },
        take: 50 // Limit to recent 50 notifications
      });
    } catch (error) {
      this.handleError(`find by user id ${userId}`, error);
    }
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    try {
      return await this.prisma.notification.findMany({
        where: { 
          userId,
          read: false 
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      this.handleError(`find unread by user id ${userId}`, error);
    }
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    try {
      return await this.prisma.notification.count({
        where: { 
          userId,
          read: false 
        }
      });
    } catch (error) {
      this.handleError(`count unread by user id ${userId}`, error);
    }
  }

  async create(data: Prisma.NotificationCreateInput): Promise<Notification> {
    try {
      return await this.prisma.notification.create({
        data
      });
    } catch (error) {
      this.handleError('create', error);
    }
  }

  async update(id: string, data: Prisma.NotificationUpdateInput): Promise<Notification> {
    try {
      return await this.prisma.notification.update({
        where: { id },
        data
      });
    } catch (error) {
      this.handleError(`update with id ${id}`, error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.notification.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      this.handleError(`delete with id ${id}`, error);
    }
  }

  async markAsRead(id: string): Promise<Notification> {
    try {
      return await this.prisma.notification.update({
        where: { id },
        data: {
          read: true
        }
      });
    } catch (error) {
      this.handleError(`mark as read with id ${id}`, error);
    }
  }

  async markAllAsReadForUser(userId: string): Promise<number> {
    try {
      const result = await this.prisma.notification.updateMany({
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
      this.handleError(`mark all as read for user id ${userId}`, error);
    }
  }
}