import { PrismaClient } from '@prisma/client';
import prisma from '../db/client';
import {
  TaskRepository,
  UserRepository,
  CommentRepository,
  TaskTemplateRepository,
  NotificationRepository,
  ITaskRepository,
  IUserRepository,
  ICommentRepository,
  ITaskTemplateRepository,
  INotificationRepository
} from './index';
import { AnalyticsRepository, IAnalyticsRepository } from './analytics.repository';
import { AttachmentRepository, IAttachmentRepository } from './attachment.repository';
import { GoogleRepository, IGoogleRepository } from './google.repository';

/**
 * Repository container interface
 */
export interface IRepositoryContainer {
  tasks: ITaskRepository;
  users: IUserRepository;
  comments: ICommentRepository;
  templates: ITaskTemplateRepository;
  notifications: INotificationRepository;
  analytics: IAnalyticsRepository;
  attachments: IAttachmentRepository;
  google: IGoogleRepository;
}

/**
 * Repository container implementation
 * Provides centralized access to all repositories
 */
class RepositoryContainer implements IRepositoryContainer {
  private _tasks: ITaskRepository;
  private _users: IUserRepository;
  private _comments: ICommentRepository;
  private _templates: ITaskTemplateRepository;
  private _notifications: INotificationRepository;
  private _analytics: IAnalyticsRepository;
  private _attachments: IAttachmentRepository;
  private _google: IGoogleRepository;

  constructor(prismaClient: PrismaClient) {
    this._tasks = new TaskRepository(prismaClient);
    this._users = new UserRepository(prismaClient);
    this._comments = new CommentRepository(prismaClient);
    this._templates = new TaskTemplateRepository(prismaClient);
    this._notifications = new NotificationRepository(prismaClient);
    this._analytics = new AnalyticsRepository(prismaClient);
    this._attachments = new AttachmentRepository(prismaClient);
    this._google = new GoogleRepository(prismaClient);
  }

  get tasks(): ITaskRepository {
    return this._tasks;
  }

  get users(): IUserRepository {
    return this._users;
  }

  get comments(): ICommentRepository {
    return this._comments;
  }

  get templates(): ITaskTemplateRepository {
    return this._templates;
  }

  get notifications(): INotificationRepository {
    return this._notifications;
  }

  get analytics(): IAnalyticsRepository {
    return this._analytics;
  }

  get attachments(): IAttachmentRepository {
    return this._attachments;
  }

  get google(): IGoogleRepository {
    return this._google;
  }
}

// Create singleton instance
const repositories = new RepositoryContainer(prisma);

// Export singleton instance
export default repositories;