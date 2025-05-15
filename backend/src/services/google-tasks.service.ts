/**
 * Google Tasks Service
 * 
 * This service manages Google Tasks integration, including syncing tasks
 * between Google Tasks and Track-It tasks.
 */
import { prisma } from '../db/client';
import { Task, Prisma, GoogleTask, GoogleTaskList } from '../generated/prisma';
import { GoogleApiService } from './google-api.service';
import { createGoogleApiError, createNotFoundError, createDatabaseError } from '../utils/error-handler';

// Input types
export interface CreateGoogleTaskInput {
  googleTaskId: string;
  googleTaskListId: string;
  title: string;
  notes?: string;
  due?: Date | null;
  completed?: Date | null;
  status: 'needsAction' | 'completed';
  userId: string;
  taskId?: string;
}

export interface UpdateGoogleTaskInput extends Partial<Omit<CreateGoogleTaskInput, 'googleTaskId' | 'googleTaskListId' | 'userId'>> {}

// Interface for sync statistics
export interface TaskSyncStats {
  created: number;
  updated: number;
  deleted: number;
  errors: number;
}

// Tasks with related data
export interface GoogleTaskWithRelations extends GoogleTask {
  taskList: GoogleTaskList | null;
  task: Task | null;
}

export class GoogleTasksService {
  /**
   * Find a Google Task by ID
   */
  static async findById(id: string): Promise<GoogleTask | null> {
    try {
      return await prisma.googleTask.findUnique({
        where: { id }
      });
    } catch (error) {
      throw createDatabaseError('Failed to find Google Task', { id, error });
    }
  }

  /**
   * Find a Google Task by Google Task ID
   */
  static async findByGoogleId(googleTaskId: string): Promise<GoogleTask | null> {
    try {
      return await prisma.googleTask.findUnique({
        where: { googleTaskId }
      });
    } catch (error) {
      throw createDatabaseError('Failed to find Google Task by Google ID', { googleTaskId, error });
    }
  }

  /**
   * Get Google Tasks for a user
   */
  static async getTasksForUser(
    userId: string,
    options: {
      includeCompleted?: boolean;
      includeTask?: boolean;
      includeTaskList?: boolean;
      limit?: number;
    } = {}
  ): Promise<GoogleTaskWithRelations[]> {
    const { includeCompleted = false, includeTask = false, includeTaskList = false, limit = 50 } = options;
    
    try {
      return await prisma.googleTask.findMany({
        where: {
          userId,
          status: includeCompleted ? undefined : 'needsAction'
        },
        orderBy: [
          { due: 'asc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        include: {
          taskList: includeTaskList,
          task: includeTask
        }
      });
    } catch (error) {
      throw createDatabaseError('Failed to get Google Tasks for user', { userId, options, error });
    }
  }
  
  /**
   * Get Google Tasks by task list ID
   */
  static async getTasksByTaskListId(
    taskListId: string,
    options: {
      includeCompleted?: boolean;
      includeTask?: boolean;
    } = {}
  ): Promise<GoogleTaskWithRelations[]> {
    const { includeCompleted = false, includeTask = false } = options;
    
    try {
      return await prisma.googleTask.findMany({
        where: {
          googleTaskListId: taskListId,
          status: includeCompleted ? undefined : 'needsAction'
        },
        orderBy: [
          { due: 'asc' },
          { createdAt: 'desc' }
        ],
        include: {
          taskList: true,
          task: includeTask
        }
      });
    } catch (error) {
      throw createDatabaseError('Failed to get Google Tasks by task list ID', { taskListId, options, error });
    }
  }
  
  /**
   * Get Google Tasks linked to a Track-It task
   */
  static async getTasksByTaskId(taskId: string): Promise<GoogleTask[]> {
    try {
      return await prisma.googleTask.findMany({
        where: { taskId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      throw createDatabaseError('Failed to get Google Tasks by task ID', { taskId, error });
    }
  }
  
  /**
   * Create a new Google Task
   */
  static async create(data: CreateGoogleTaskInput): Promise<GoogleTask> {
    try {
      // Ensure task list exists
      let taskList = await prisma.googleTaskList.findUnique({
        where: { googleTaskListId: data.googleTaskListId }
      });
      
      if (!taskList) {
        // Create the task list
        taskList = await prisma.googleTaskList.create({
          data: {
            googleTaskListId: data.googleTaskListId,
            title: 'Default Task List', // Will be updated during sync
            userId: data.userId
          }
        });
      }
      
      return await prisma.googleTask.create({
        data: {
          googleTaskId: data.googleTaskId,
          googleTaskListId: data.googleTaskListId,
          title: data.title,
          notes: data.notes,
          due: data.due,
          completed: data.completed,
          status: data.status,
          userId: data.userId,
          taskId: data.taskId,
          lastSynced: new Date()
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle unique constraint violations
        if (error.code === 'P2002') {
          // Try to update the task if it already exists
          const existingTask = await prisma.googleTask.findUnique({
            where: { googleTaskId: data.googleTaskId }
          });

          if (existingTask) {
            return await this.update(existingTask.id, data);
          }

          throw createDatabaseError('Google Task with this ID already exists', { 
            googleTaskId: data.googleTaskId,
            error
          });
        }
      }
      throw createDatabaseError('Failed to create Google Task', { data, error });
    }
  }
  
  /**
   * Update a Google Task
   */
  static async update(id: string, data: UpdateGoogleTaskInput): Promise<GoogleTask> {
    try {
      return await prisma.googleTask.update({
        where: { id },
        data: {
          ...data,
          lastSynced: new Date()
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw createNotFoundError('Google Task', id);
        }
      }
      throw createDatabaseError('Failed to update Google Task', { id, data, error });
    }
  }
  
  /**
   * Delete a Google Task
   */
  static async delete(id: string): Promise<GoogleTask> {
    try {
      return await prisma.googleTask.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw createNotFoundError('Google Task', id);
        }
      }
      throw createDatabaseError('Failed to delete Google Task', { id, error });
    }
  }
  
  /**
   * Delete a Google Task by Google Task ID
   */
  static async deleteByGoogleId(googleTaskId: string): Promise<GoogleTask> {
    try {
      const task = await prisma.googleTask.findUnique({
        where: { googleTaskId }
      });

      if (!task) {
        throw createNotFoundError('Google Task', googleTaskId);
      }

      return await this.delete(task.id);
    } catch (error) {
      throw createDatabaseError('Failed to delete Google Task by Google ID', { googleTaskId, error });
    }
  }
  
  /**
   * Link a Google Task to a Track-It task
   */
  static async linkToTask(id: string, taskId: string): Promise<GoogleTask> {
    try {
      return await prisma.googleTask.update({
        where: { id },
        data: { taskId }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw createNotFoundError('Google Task', id);
        }
        // Handle foreign key constraint violations
        if (error.code === 'P2003') {
          throw createDatabaseError('Invalid task ID', { id, taskId, error });
        }
      }
      throw createDatabaseError('Failed to link Google Task to task', { id, taskId, error });
    }
  }
  
  /**
   * Get Google Task Lists for a user
   */
  static async getTaskListsForUser(userId: string): Promise<GoogleTaskList[]> {
    try {
      return await prisma.googleTaskList.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      throw createDatabaseError('Failed to get Google Task Lists for user', { userId, error });
    }
  }
  
  /**
   * Sync Task Lists with Google Tasks for a user
   */
  static async syncTaskLists(userId: string): Promise<GoogleTaskList[]> {
    // Get user's Google Account
    const googleAccount = await prisma.googleAccount.findFirst({
      where: { userId }
    });

    if (!googleAccount || !googleAccount.accessToken) {
      throw createNotFoundError('Google account', userId);
    }

    try {
      // Fetch task lists from Google Tasks
      const taskLists = await GoogleApiService.getTaskLists(googleAccount.accessToken);
      
      // Upsert task lists in database
      const updatedTaskLists: GoogleTaskList[] = [];
      
      for (const taskList of taskLists) {
        const existingTaskList = await prisma.googleTaskList.findUnique({
          where: { googleTaskListId: taskList.id }
        });
        
        if (existingTaskList) {
          // Update existing task list
          const updated = await prisma.googleTaskList.update({
            where: { id: existingTaskList.id },
            data: {
              title: taskList.title,
              lastSynced: new Date()
            }
          });
          updatedTaskLists.push(updated);
        } else {
          // Create new task list
          const created = await prisma.googleTaskList.create({
            data: {
              googleTaskListId: taskList.id,
              title: taskList.title,
              userId,
              lastSynced: new Date()
            }
          });
          updatedTaskLists.push(created);
        }
      }
      
      return updatedTaskLists;
    } catch (error) {
      throw createGoogleApiError('Failed to sync task lists with Google Tasks', { userId, error });
    }
  }
  
  /**
   * Bulk upsert Google Tasks
   * This is used for syncing multiple tasks from Google Tasks
   */
  static async bulkUpsert(
    tasks: CreateGoogleTaskInput[]
  ): Promise<{ created: number; updated: number; deleted: number }> {
    let created = 0;
    let updated = 0;
    let deleted = 0;

    // Process in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (task) => {
          try {
            const existingTask = await prisma.googleTask.findUnique({
              where: { googleTaskId: task.googleTaskId }
            });

            if (existingTask) {
              await this.update(existingTask.id, task);
              updated++;
            } else {
              await this.create(task);
              created++;
            }
          } catch (error) {
            console.error(`Failed to upsert task ${task.googleTaskId}:`, error);
          }
        })
      );
    }

    return { created, updated, deleted };
  }
  
  /**
   * Sync tasks from Google Tasks for a user
   */
  static async syncTasksFromGoogle(userId: string): Promise<TaskSyncStats> {
    // Get user's Google Account
    const googleAccount = await prisma.googleAccount.findFirst({
      where: { userId }
    });

    if (!googleAccount || !googleAccount.accessToken) {
      throw createNotFoundError('Google account', userId);
    }

    try {
      // First sync task lists
      const taskLists = await this.syncTaskLists(userId);
      
      let totalCreated = 0;
      let totalUpdated = 0;
      let totalDeleted = 0;
      let totalErrors = 0;
      
      // For each task list, sync tasks
      for (const taskList of taskLists) {
        try {
          // Fetch tasks from Google Tasks
          const googleTasks = await GoogleApiService.getTasks(
            googleAccount.accessToken,
            taskList.googleTaskListId,
            {
              showCompleted: true,
              maxResults: 100
            }
          );
          
          // Convert Google tasks to our database format
          const tasks = googleTasks.map(task => ({
            googleTaskId: task.id,
            googleTaskListId: taskList.googleTaskListId,
            title: task.title,
            notes: task.notes,
            due: task.due ? new Date(task.due) : null,
            completed: task.completed ? new Date(task.completed) : null,
            status: task.status,
            userId
          }));
          
          // Sync tasks with database
          const stats = await this.bulkUpsert(tasks);
          
          totalCreated += stats.created;
          totalUpdated += stats.updated;
          totalDeleted += stats.deleted;
        } catch (error) {
          console.error(`Failed to sync tasks for task list ${taskList.title}:`, error);
          totalErrors++;
        }
      }
      
      // Update Google account's last sync time
      await prisma.googleAccount.update({
        where: { id: googleAccount.id },
        data: {
          lastTasksSync: new Date(),
          tasksSynced: true
        }
      });
      
      return {
        created: totalCreated,
        updated: totalUpdated,
        deleted: totalDeleted,
        errors: totalErrors
      };
    } catch (error) {
      throw createGoogleApiError('Failed to sync with Google Tasks', { userId, error });
    }
  }
  
  /**
   * Import Google Tasks as Track-It tasks
   */
  static async importTasksAsTrackItTasks(userId: string): Promise<Task[]> {
    try {
      // First sync with Google Tasks
      await this.syncTasksFromGoogle(userId);
      
      // Get all Google Tasks for the user that are not completed and not already linked
      const googleTasks = await prisma.googleTask.findMany({
        where: {
          userId,
          status: 'needsAction',
          taskId: null // Not already linked to a task
        }
      });
      
      const importedTasks: Task[] = [];
      
      for (const googleTask of googleTasks) {
        try {
          // Create a new Track-It task from the Google Task
          const task = await prisma.task.create({
            data: {
              title: googleTask.title,
              description: googleTask.notes || '',
              status: 'todo',
              priority: 'medium',
              dueDate: googleTask.due,
              reporterId: userId,
              source: 'google',
              tags: ['google-tasks', 'imported']
            }
          });
          
          // Link the Google Task to the Track-It task
          await this.linkToTask(googleTask.id, task.id);
          
          importedTasks.push(task);
        } catch (error) {
          console.error(`Failed to import Google Task ${googleTask.title}:`, error);
        }
      }
      
      return importedTasks;
    } catch (error) {
      throw createGoogleApiError('Failed to import Google Tasks as Track-It tasks', { userId, error });
    }
  }
  
  /**
   * Create a Google Task from a Track-It task
   */
  static async createGoogleTaskFromTask(taskId: string, userId: string, taskListId?: string): Promise<GoogleTask> {
    // Get user's Google Account
    const googleAccount = await prisma.googleAccount.findFirst({
      where: { userId }
    });

    if (!googleAccount || !googleAccount.accessToken) {
      throw createNotFoundError('Google account', userId);
    }
    
    // Get task details
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });
    
    if (!task) {
      throw createNotFoundError('Task', taskId);
    }
    
    try {
      // If no task list ID is provided, use the first task list
      if (!taskListId) {
        const taskLists = await this.syncTaskLists(userId);
        if (taskLists.length === 0) {
          throw createNotFoundError('Google Task List');
        }
        taskListId = taskLists[0].googleTaskListId;
      }
      
      // Create the task in Google Tasks
      const googleTask = await GoogleApiService.createTask(
        googleAccount.accessToken,
        taskListId,
        {
          title: task.title,
          notes: `${task.description || ''}\n\nCreated from Track-It task: ${taskId}`,
          due: task.dueDate ? new Date(task.dueDate).toISOString() : undefined
        }
      );
      
      // Save the task in our database and link it to the Track-It task
      return await this.create({
        googleTaskId: googleTask.id,
        googleTaskListId: taskListId,
        title: googleTask.title,
        notes: googleTask.notes,
        due: googleTask.due ? new Date(googleTask.due) : null,
        completed: googleTask.completed ? new Date(googleTask.completed) : null,
        status: googleTask.status,
        userId,
        taskId
      });
    } catch (error) {
      throw createGoogleApiError('Failed to create Google Task from Track-It task', { taskId, userId, error });
    }
  }
  
  /**
   * Update a Google Task to match a Track-It task
   */
  static async updateGoogleTaskFromTask(googleTaskId: string, taskId: string, userId: string): Promise<GoogleTask> {
    // Get user's Google Account
    const googleAccount = await prisma.googleAccount.findFirst({
      where: { userId }
    });

    if (!googleAccount || !googleAccount.accessToken) {
      throw createNotFoundError('Google account', userId);
    }
    
    // Get Google Task details
    const googleTask = await this.findByGoogleId(googleTaskId);
    if (!googleTask) {
      throw createNotFoundError('Google Task', googleTaskId);
    }
    
    // Get task details
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });
    
    if (!task) {
      throw createNotFoundError('Task', taskId);
    }
    
    try {
      // Update the task in Google Tasks
      const updatedGoogleTask = await GoogleApiService.updateTask(
        googleAccount.accessToken,
        googleTask.googleTaskListId,
        googleTask.googleTaskId,
        {
          title: task.title,
          notes: `${task.description || ''}\n\nUpdated from Track-It task: ${taskId}`,
          due: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
          status: task.status === 'done' ? 'completed' : 'needsAction',
          completed: task.status === 'done' ? new Date().toISOString() : undefined
        }
      );
      
      // Update the task in our database
      return await this.update(googleTask.id, {
        title: updatedGoogleTask.title,
        notes: updatedGoogleTask.notes,
        due: updatedGoogleTask.due ? new Date(updatedGoogleTask.due) : null,
        completed: updatedGoogleTask.completed ? new Date(updatedGoogleTask.completed) : null,
        status: updatedGoogleTask.status,
        taskId
      });
    } catch (error) {
      throw createGoogleApiError('Failed to update Google Task from Track-It task', { googleTaskId, taskId, userId, error });
    }
  }
  
  /**
   * Delete a Google Task
   */
  static async deleteGoogleTask(googleTaskId: string, userId: string): Promise<boolean> {
    // Get user's Google Account
    const googleAccount = await prisma.googleAccount.findFirst({
      where: { userId }
    });

    if (!googleAccount || !googleAccount.accessToken) {
      throw createNotFoundError('Google account', userId);
    }
    
    // Get Google Task details
    const googleTask = await this.findByGoogleId(googleTaskId);
    if (!googleTask) {
      throw createNotFoundError('Google Task', googleTaskId);
    }
    
    try {
      // Delete the task from Google Tasks
      await GoogleApiService.deleteTask(
        googleAccount.accessToken,
        googleTask.googleTaskListId,
        googleTask.googleTaskId
      );
      
      // Delete from our database
      await this.delete(googleTask.id);
      
      return true;
    } catch (error) {
      throw createGoogleApiError('Failed to delete Google Task', { googleTaskId, userId, error });
    }
  }
  
  /**
   * Update a Track-It task from a Google Task
   */
  static async updateTaskFromGoogleTask(taskId: string, googleTaskId: string): Promise<Task> {
    // Get Google Task details
    const googleTask = await this.findByGoogleId(googleTaskId);
    if (!googleTask) {
      throw createNotFoundError('Google Task', googleTaskId);
    }
    
    // Get task details
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });
    
    if (!task) {
      throw createNotFoundError('Task', taskId);
    }
    
    try {
      // Update the Track-It task with Google Task data
      return await prisma.task.update({
        where: { id: taskId },
        data: {
          title: googleTask.title,
          description: googleTask.notes || task.description,
          dueDate: googleTask.due,
          status: googleTask.status === 'completed' ? 'done' : task.status
        }
      });
    } catch (error) {
      throw createDatabaseError('Failed to update Track-It task from Google Task', { taskId, googleTaskId, error });
    }
  }
}