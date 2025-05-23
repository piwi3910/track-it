/**
 * Task service for database operations on Task model
 */
import { Prisma, $Enums } from '../../generated/prisma';
import prisma from '../client';
import { createDatabaseError } from '../../utils/error-handler';

/**
 * Get all tasks
 */
export async function getAllTasks() {
  try {
    return await prisma.task.findMany({
      where: {
        // Show all tasks for better team collaboration
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
  } catch (error) {
    throw createDatabaseError('Failed to get tasks', { error });
  }
}

/**
 * Get task by ID
 */
export async function getTaskById(id: string) {
  try {
    return await prisma.task.findUnique({
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
        _count: {
          select: {
            comments: true,
            attachments: true
          }
        }
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to get task with ID ${id}`, { error });
  }
}

/**
 * Get tasks by status
 */
export async function getTasksByStatus(status: string, userId: string) {
  try {
    // For backlog status, show all tasks regardless of user relationship
    // For other statuses, show only tasks where user is creator or assignee
    const whereClause = status.toLowerCase() === 'backlog' 
      ? {
          status: status.toUpperCase() as $Enums.TaskStatus
        }
      : {
          status: status.toUpperCase() as $Enums.TaskStatus,
          OR: [
            { creatorId: userId },
            { assigneeId: userId }
          ]
        };

    return await prisma.task.findMany({
      where: whereClause,
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
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to get tasks with status ${status}`, { error });
  }
}

/**
 * Search tasks
 */
export async function searchTasks(query: string) {
  try {
    return await prisma.task.findMany({
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
    throw createDatabaseError(`Failed to search tasks with query ${query}`, { error });
  }
}

/**
 * Create a new task
 */
export async function createTask(data: Prisma.TaskCreateInput) {
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
    throw createDatabaseError('Failed to create task', { error });
  }
}

/**
 * Update a task
 */
export async function updateTask(id: string, data: Prisma.TaskUpdateInput) {
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
    throw createDatabaseError(`Failed to update task with ID ${id}`, { error });
  }
}

/**
 * Delete a task
 */
export async function deleteTask(id: string) {
  try {
    await prisma.task.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    throw createDatabaseError(`Failed to delete task with ID ${id}`, { error });
  }
}

/**
 * Update task status
 */
export async function updateTaskStatus(id: string, status: string) {
  try {
    return await prisma.task.update({
      where: { id },
      data: {
        status: status.toUpperCase() as $Enums.TaskStatus,
        updatedAt: new Date()
      },
      select: {
        id: true,
        status: true,
        updatedAt: true
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to update status for task with ID ${id}`, { error });
  }
}

/**
 * Update task assignee
 */
export async function updateTaskAssignee(id: string, assigneeId: string | null) {
  try {
    return await prisma.task.update({
      where: { id },
      data: {
        assigneeId,
        updatedAt: new Date()
      },
      select: {
        id: true,
        assigneeId: true,
        updatedAt: true
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to update assignee for task with ID ${id}`, { error });
  }
}

/**
 * Start time tracking
 */
export async function startTimeTracking(id: string) {
  try {
    return await prisma.task.update({
      where: { id },
      data: {
        timeTrackingActive: true,
        trackingStartTime: new Date()
      },
      select: {
        id: true,
        timeTrackingActive: true,
        trackingStartTime: true
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to start time tracking for task with ID ${id}`, { error });
  }
}

/**
 * Stop time tracking
 */
export async function stopTimeTracking(id: string) {
  try {
    // First get the task to calculate time spent
    const task = await prisma.task.findUnique({
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
    return await prisma.task.update({
      where: { id },
      data: {
        timeTrackingActive: false,
        trackingStartTime: null,
        trackingTimeSeconds: totalTimeSeconds
      },
      select: {
        id: true,
        timeTrackingActive: true,
        trackingStartTime: true,
        trackingTimeSeconds: true
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to stop time tracking for task with ID ${id}`, { error });
  }
}