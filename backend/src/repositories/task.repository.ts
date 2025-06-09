import { Prisma, Task, PrismaClient, TaskStatus } from '@prisma/client';
import { BaseRepository } from './base.repository';

/**
 * Task repository interface extending base repository with task-specific methods
 */
export interface ITaskRepository extends BaseRepository<Task, Prisma.TaskCreateInput, Prisma.TaskUpdateInput> {
  findByStatus(status: string, userId: string): Promise<Task[]>;
  search(query: string): Promise<Task[]>;
  updateStatus(id: string, status: string): Promise<Task>;
  updateAssignee(id: string, assigneeId: string | null): Promise<Task>;
  startTimeTracking(id: string): Promise<Task>;
  stopTimeTracking(id: string): Promise<Task>;
  findWithRelations(id: string): Promise<Task | null>;
  findAllWithRelations(): Promise<Task[]>;
}

/**
 * Task repository implementation
 */
export class TaskRepository extends BaseRepository<Task, Prisma.TaskCreateInput, Prisma.TaskUpdateInput> 
  implements ITaskRepository {
  
  constructor(prisma: PrismaClient) {
    super(prisma, 'Task');
  }

  /**
   * Default include clause for task queries
   */
  private get defaultInclude() {
    return {
      creator: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      },
      assignee: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      },
      _count: {
        select: {
          subtasks: true,
          comments: true,
          attachments: true
        }
      }
    };
  }

  /**
   * Extended include clause for detailed task queries
   */
  private get detailedInclude() {
    return {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true
        }
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true
        }
      },
      subtasks: {
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      },
      _count: {
        select: {
          comments: true,
          attachments: true
        }
      }
    };
  }

  async findAll(): Promise<Task[]> {
    try {
      return await this.prisma.task.findMany({
        orderBy: {
          updatedAt: 'desc'
        }
      });
    } catch (error) {
      this.handleError('find all', error);
    }
  }

  async findAllWithRelations(): Promise<Task[]> {
    try {
      return await this.prisma.task.findMany({
        include: this.defaultInclude,
        orderBy: {
          updatedAt: 'desc'
        }
      });
    } catch (error) {
      this.handleError('find all with relations', error);
    }
  }

  async findById(id: string): Promise<Task | null> {
    try {
      return await this.prisma.task.findUnique({
        where: { id }
      });
    } catch (error) {
      this.handleError(`find by id ${id}`, error);
    }
  }

  async findWithRelations(id: string): Promise<Task | null> {
    try {
      return await this.prisma.task.findUnique({
        where: { id },
        include: this.detailedInclude
      });
    } catch (error) {
      this.handleError(`find with relations by id ${id}`, error);
    }
  }

  async findByStatus(status: string, userId: string): Promise<Task[]> {
    try {
      // For backlog status, show all tasks regardless of user relationship
      // For other statuses, show only tasks where user is creator or assignee
      const whereClause = status.toLowerCase() === 'backlog' 
        ? {
            status: status.toLowerCase() as TaskStatus
          }
        : {
            status: status.toLowerCase() as TaskStatus,
            OR: [
              { creatorId: userId },
              { assigneeId: userId }
            ]
          };

      return await this.prisma.task.findMany({
        where: whereClause,
        include: this.defaultInclude
      });
    } catch (error) {
      this.handleError(`find by status ${status}`, error);
    }
  }

  async search(query: string): Promise<Task[]> {
    try {
      return await this.prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } },
            // Search by task number if query is numeric
            ...(isNaN(parseInt(query)) ? [] : [{ taskNumber: parseInt(query) }])
          ]
        },
        include: {
          _count: {
            select: {
              subtasks: true,
              comments: true,
              attachments: true
            }
          }
        }
      });
    } catch (error) {
      this.handleError(`search with query ${query}`, error);
    }
  }

  async create(data: Prisma.TaskCreateInput): Promise<Task> {
    try {
      return await this.prisma.task.create({
        data,
        include: this.defaultInclude
      });
    } catch (error) {
      this.handleError('create', error);
    }
  }

  async update(id: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    try {
      return await this.prisma.task.update({
        where: { id },
        data,
        include: this.defaultInclude
      });
    } catch (error) {
      this.handleError(`update with id ${id}`, error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.task.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      this.handleError(`delete with id ${id}`, error);
    }
  }

  async updateStatus(id: string, status: string): Promise<Task> {
    try {
      return await this.prisma.task.update({
        where: { id },
        data: {
          status: status.toLowerCase() as TaskStatus,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      this.handleError(`update status for id ${id}`, error);
    }
  }

  async updateAssignee(id: string, assigneeId: string | null): Promise<Task> {
    try {
      return await this.prisma.task.update({
        where: { id },
        data: {
          assigneeId,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      this.handleError(`update assignee for id ${id}`, error);
    }
  }

  async startTimeTracking(id: string): Promise<Task> {
    try {
      return await this.prisma.task.update({
        where: { id },
        data: {
          timeTrackingActive: true,
          trackingStartTime: new Date()
        }
      });
    } catch (error) {
      this.handleError(`start time tracking for id ${id}`, error);
    }
  }

  async stopTimeTracking(id: string): Promise<Task> {
    try {
      // First get the task to calculate time spent
      const task = await this.prisma.task.findUnique({
        where: { id },
        select: {
          trackingTimeSeconds: true,
          trackingStartTime: true
        }
      });
      
      if (!task || !task.trackingStartTime) {
        throw new Error('Task not found or tracking not started');
      }
      
      // Calculate time spent
      const now = new Date();
      const timeSpentSeconds = Math.floor((now.getTime() - task.trackingStartTime.getTime()) / 1000);
      const totalTimeSeconds = task.trackingTimeSeconds + timeSpentSeconds;
      
      // Update the task
      return await this.prisma.task.update({
        where: { id },
        data: {
          timeTrackingActive: false,
          trackingStartTime: null,
          trackingTimeSeconds: totalTimeSeconds
        }
      });
    } catch (error) {
      this.handleError(`stop time tracking for id ${id}`, error);
    }
  }
}