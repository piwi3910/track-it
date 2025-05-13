import { prisma } from '../client';
import { 
  Task, 
  Prisma, 
  TaskStatus, 
  TaskPriority 
} from '../../generated/prisma';
import { TRPCError } from '@trpc/server';

export interface CreateTaskInput extends Omit<Prisma.TaskUncheckedCreateInput, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateTaskInput extends Partial<Omit<Prisma.TaskUncheckedUpdateInput, 'id' | 'createdAt' | 'updatedAt'>> {}

export class TaskService {
  /**
   * Find a task by ID
   */
  static async findById(id: string): Promise<Task | null> {
    return prisma.task.findUnique({
      where: { id },
      include: {
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
        subtasks: true,
        // Include comments count but not the comments themselves
        _count: {
          select: {
            comments: true,
            attachments: true
          }
        }
      }
    });
  }

  /**
   * Get all tasks
   */
  static async findAll(): Promise<Task[]> {
    return prisma.task.findMany({
      include: {
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
        // Include counts for subtasks, comments, and attachments
        _count: {
          select: {
            subtasks: true,
            comments: true,
            attachments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Get tasks by status
   */
  static async findByStatus(status: TaskStatus): Promise<Task[]> {
    return prisma.task.findMany({
      where: { status },
      include: {
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
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }

  /**
   * Get tasks assigned to a user
   */
  static async findByAssignee(assigneeId: string): Promise<Task[]> {
    return prisma.task.findMany({
      where: { assigneeId },
      include: {
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
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }

  /**
   * Get tasks created by a user
   */
  static async findByCreator(creatorId: string): Promise<Task[]> {
    return prisma.task.findMany({
      where: { creatorId },
      include: {
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
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }

  /**
   * Search tasks
   */
  static async search(query: string): Promise<Task[]> {
    return prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
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
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }

  /**
   * Get task with full details
   */
  static async getFullTaskDetails(id: string): Promise<Task | null> {
    return prisma.task.findUnique({
      where: { id },
      include: {
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
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        attachments: true
      }
    });
  }

  /**
   * Create a new task
   */
  static async create(data: CreateTaskInput): Promise<Task> {
    try {
      return await prisma.task.create({
        data,
        include: {
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
          }
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle foreign key constraint violations
        if (error.code === 'P2003') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid creator or assignee ID'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Update a task
   */
  static async update(id: string, data: UpdateTaskInput): Promise<Task> {
    try {
      return await prisma.task.update({
        where: { id },
        data,
        include: {
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
          }
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task not found'
          });
        }
        // Handle foreign key constraint violations
        if (error.code === 'P2003') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid assignee ID'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Delete a task
   */
  static async delete(id: string): Promise<Task> {
    try {
      return await prisma.task.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task not found'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Update task status
   */
  static async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    try {
      return await prisma.task.update({
        where: { id },
        data: { status }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task not found'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Update task assignee
   */
  static async updateAssignee(id: string, assigneeId: string | null): Promise<Task> {
    try {
      return await prisma.task.update({
        where: { id },
        data: { assigneeId }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task not found'
          });
        }
        // Handle foreign key constraint violations
        if (error.code === 'P2003') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid assignee ID'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Start time tracking for a task
   */
  static async startTimeTracking(id: string): Promise<Task> {
    try {
      return await prisma.task.update({
        where: { id },
        data: {
          timeTrackingActive: true,
          trackingStartTime: new Date()
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Task not found'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Stop time tracking for a task and update tracking time
   */
  static async stopTimeTracking(id: string): Promise<Task> {
    try {
      // First get the task to calculate time tracked
      const task = await prisma.task.findUnique({
        where: { id },
        select: {
          timeTrackingActive: true,
          trackingStartTime: true,
          trackingTimeSeconds: true
        }
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found'
        });
      }

      if (!task.timeTrackingActive || !task.trackingStartTime) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Time tracking is not active for this task'
        });
      }

      // Calculate time tracked
      const now = new Date();
      const startTime = new Date(task.trackingStartTime);
      const secondsTracked = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const totalTimeTracked = task.trackingTimeSeconds + secondsTracked;

      // Update the task
      return await prisma.task.update({
        where: { id },
        data: {
          timeTrackingActive: false,
          trackingStartTime: null,
          trackingTimeSeconds: totalTimeTracked
        }
      });
    } catch (error) {
      if (!(error instanceof TRPCError)) {
        throw error;
      }
      throw error;
    }
  }
}