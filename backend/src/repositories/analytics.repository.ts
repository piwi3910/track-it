/**
 * Analytics repository for querying aggregated data from the database
 */
import { PrismaClient } from '@prisma/client';
import { createDatabaseError } from '../utils/unified-error-handler';

export interface IAnalyticsRepository {
  getTaskCompletionStats(timeframe: 'week' | 'month' | 'year'): Promise<Array<{ date: string; completed: number }>>;
  getUserWorkload(): Promise<Array<{ userId: string; name: string; taskCount: number }>>;
  getTasksByPriority(): Promise<Array<{ priority: string; count: number }>>;
  getCompletionTimeByPriority(): Promise<{
    avgCompletionTimes: { high: number; medium: number; low: number };
    sampleSizes: { high: number; medium: number; low: number };
  }>;
}

export class AnalyticsRepository implements IAnalyticsRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get task completion statistics by timeframe
   * @param timeframe The time period to analyze ('week', 'month', 'year')
   * @returns Array of daily completion counts
   */
  async getTaskCompletionStats(timeframe: 'week' | 'month' | 'year') {
    try {
      const now = new Date();
      let startDate: Date;
      
      // Calculate start date based on timeframe
      switch (timeframe) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      
      // Get all tasks completed in the timeframe
      const tasks = await this.prisma.task.findMany({
        where: {
          status: 'done',
          updatedAt: {
            gte: startDate
          }
        },
        select: {
          updatedAt: true
        },
        orderBy: {
          updatedAt: 'asc'
        }
      });
      
      // Group tasks by day
      const dailyCompletions: Record<string, number> = {};
      
      tasks.forEach(task => {
        const dateKey = task.updatedAt.toISOString().split('T')[0];
        
        if (!dailyCompletions[dateKey]) {
          dailyCompletions[dateKey] = 0;
        }
        
        dailyCompletions[dateKey]++;
      });
      
      // Convert to array format for API response
      const result = Object.entries(dailyCompletions).map(([date, completed]) => ({
        date,
        completed
      }));
      
      // Sort by date
      result.sort((a, b) => a.date.localeCompare(b.date));
      
      return result;
    } catch (error) {
      throw createDatabaseError(`Failed to get task completion stats for timeframe ${timeframe}`, { error });
    }
  }

  /**
   * Get user workload statistics
   * @returns Array of user IDs with their active task counts
   */
  async getUserWorkload() {
    try {
      // Count active tasks per user
      const workloadData = await this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              assignedTasks: {
                where: {
                  status: {
                    notIn: ['done', 'archived']
                  }
                }
              }
            }
          }
        }
      });
      
      // Format for API response
      const result = workloadData.map(user => ({
        userId: user.id,
        name: user.name,
        taskCount: user._count.assignedTasks
      }));
      
      // Sort by task count (descending)
      result.sort((a, b) => b.taskCount - a.taskCount);
      
      return result;
    } catch (error) {
      throw createDatabaseError('Failed to get user workload statistics', { error });
    }
  }

  /**
   * Get task counts by priority
   * @returns Array of priorities with their counts
   */
  async getTasksByPriority() {
    try {
      // Count tasks by priority
      const taskCounts = await this.prisma.task.groupBy({
        by: ['priority'],
        _count: {
          id: true
        },
        where: {
          status: {
            notIn: ['done', 'archived']
          }
        }
      });
      
      // Format for API response
      const result = taskCounts.map(item => ({
        priority: item.priority,
        count: item._count.id
      }));
      
      // Sort by priority (high to low)
      const priorityOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
      result.sort((a, b) => 
        priorityOrder[a.priority as keyof typeof priorityOrder] - 
        priorityOrder[b.priority as keyof typeof priorityOrder]
      );
      
      return result;
    } catch (error) {
      throw createDatabaseError('Failed to get tasks by priority', { error });
    }
  }

  /**
   * Calculate average completion time by priority
   * @returns Object with average completion times and sample sizes by priority
   */
  async getCompletionTimeByPriority() {
    try {
      // Get completed tasks with created and updated timestamps
      const tasks = await this.prisma.task.findMany({
        where: {
          status: 'done'
        },
        select: {
          priority: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      // Group by priority and calculate times
      const completionTimes = {
        high: [] as number[],
        medium: [] as number[],
        low: [] as number[]
      };
      
      tasks.forEach(task => {
        const priority = task.priority;
        
        if (priority !== 'high' && priority !== 'medium' && priority !== 'low') {
          return;
        }
        
        // Calculate completion time in days
        const createdTimestamp = task.createdAt.getTime();
        const completedTimestamp = task.updatedAt.getTime();
        const completionTime = (completedTimestamp - createdTimestamp) / (24 * 60 * 60 * 1000);
        
        completionTimes[priority as keyof typeof completionTimes].push(completionTime);
      });
      
      // Calculate averages
      const avgCompletionTimes = {
        high: completionTimes.high.length > 0 ?
          completionTimes.high.reduce((sum, time) => sum + time, 0) / completionTimes.high.length : 0,
        medium: completionTimes.medium.length > 0 ?
          completionTimes.medium.reduce((sum, time) => sum + time, 0) / completionTimes.medium.length : 0,
        low: completionTimes.low.length > 0 ?
          completionTimes.low.reduce((sum, time) => sum + time, 0) / completionTimes.low.length : 0
      };
      
      return {
        avgCompletionTimes,
        sampleSizes: {
          high: completionTimes.high.length,
          medium: completionTimes.medium.length,
          low: completionTimes.low.length
        }
      };
    } catch (error) {
      throw createDatabaseError('Failed to get completion time statistics', { error });
    }
  }
}