import { z } from 'zod';
import { router, protectedProcedure, safeProcedure } from '../trpc/trpc';

// Mock task data for analytics
const mockTasks = [
  // Week 1 - completed tasks
  {
    id: 'task-w1-1',
    title: 'Setup project repo',
    status: 'done',
    priority: 'high',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 'user1',
    assigneeId: 'user1',
    estimatedHours: 2,
    actualHours: 1.5
  },
  {
    id: 'task-w1-2',
    title: 'Design database schema',
    status: 'done',
    priority: 'high',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 'user1',
    assigneeId: 'user2',
    estimatedHours: 4,
    actualHours: 6
  },
  
  // Week 2 - completed tasks
  {
    id: 'task-w2-1',
    title: 'Implement auth endpoints',
    status: 'done',
    priority: 'high',
    createdAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 'user1',
    assigneeId: 'user1',
    estimatedHours: 8,
    actualHours: 10
  },
  {
    id: 'task-w2-2',
    title: 'Create task model',
    status: 'done',
    priority: 'medium',
    createdAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 'user1',
    assigneeId: 'user2',
    estimatedHours: 6,
    actualHours: 5
  },
  
  // Week 3 - completed tasks
  {
    id: 'task-w3-1',
    title: 'Implement task endpoints',
    status: 'done',
    priority: 'high',
    createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 'user1',
    assigneeId: 'user1',
    estimatedHours: 10,
    actualHours: 12
  },
  {
    id: 'task-w3-2',
    title: 'Add error handling',
    status: 'done',
    priority: 'medium',
    createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 'user1',
    assigneeId: 'user3',
    estimatedHours: 4,
    actualHours: 3
  },
  
  // Week 4 - completed tasks
  {
    id: 'task-w4-1',
    title: 'Setup CI/CD',
    status: 'done',
    priority: 'medium',
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 'user1',
    assigneeId: 'user1',
    estimatedHours: 6,
    actualHours: 8
  },
  {
    id: 'task-w4-2',
    title: 'Fix login issues',
    status: 'done',
    priority: 'high',
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    createdById: 'user2',
    assigneeId: 'user3',
    estimatedHours: 2,
    actualHours: 3
  },
  
  // Week 5 (current) - open tasks
  {
    id: 'task-w5-1',
    title: 'Complete API Implementation',
    status: 'in_progress',
    priority: 'high',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: null,
    createdById: 'user1',
    assigneeId: 'user1',
    estimatedHours: 8,
    actualHours: 4
  },
  {
    id: 'task-w5-2',
    title: 'Add Dark Mode',
    status: 'todo',
    priority: 'medium',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: null,
    createdById: 'user1',
    assigneeId: 'user2',
    estimatedHours: 4,
    actualHours: 0
  },
  {
    id: 'task-w5-3',
    title: 'Implement Google Calendar Sync',
    status: 'todo',
    priority: 'low',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: null,
    createdById: 'user2',
    assigneeId: 'user3',
    estimatedHours: 6,
    actualHours: 0
  }
];

// Mock user data for analytics
const mockUsers = [
  { id: 'user1', name: 'John Doe', role: 'admin' },
  { id: 'user2', name: 'Jane Smith', role: 'member' },
  { id: 'user3', name: 'Demo User', role: 'member' }
];

// Input validation schemas
const tasksCompletionStatsSchema = z.object({
  timeframe: z.enum(['week', 'month', 'year']).default('week')
});

export const analyticsRouter = router({
  getTasksCompletionStats: protectedProcedure
    .input(tasksCompletionStatsSchema)
    .query(({ input }) => safeProcedure(async () => {
      const now = Date.now();
      let startDate: number;
      
      // Calculate start date based on timeframe
      switch (input.timeframe) {
        case 'week':
          startDate = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case 'month':
          startDate = now - 30 * 24 * 60 * 60 * 1000;
          break;
        case 'year':
          startDate = now - 365 * 24 * 60 * 60 * 1000;
          break;
        default:
          startDate = now - 7 * 24 * 60 * 60 * 1000;
      }
      
      // Format for the API specification
      const result: { date: string; completed: number }[] = [];
      
      // Group tasks by day
      const dailyCompletions: Record<string, number> = {};
      
      mockTasks.forEach(task => {
        if (task.status !== 'done' || !task.completedAt) {
          return;
        }
        
        const completedDate = new Date(task.completedAt);
        // Skip tasks completed before the start date
        if (completedDate.getTime() < startDate) {
          return;
        }
        
        const dateKey = completedDate.toISOString().split('T')[0];
        
        if (!dailyCompletions[dateKey]) {
          dailyCompletions[dateKey] = 0;
        }
        
        dailyCompletions[dateKey]++;
      });
      
      // Convert to array format required by API spec
      Object.entries(dailyCompletions).forEach(([date, count]) => {
        result.push({
          date,
          completed: count
        });
      });
      
      // Sort by date
      result.sort((a, b) => a.date.localeCompare(b.date));
      
      return result;
    })),
  
  getUserWorkload: protectedProcedure
    .query(() => safeProcedure(async () => {
      // Calculate user workload stats according to API spec
      const result: { userId: string; taskCount: number }[] = [];
      
      // Count tasks per user (only active tasks)
      const userTaskCounts: Record<string, number> = {};
      
      mockTasks.forEach(task => {
        // Only count active tasks (not done)
        if (task.status === 'done' || !task.assigneeId) {
          return;
        }
        
        if (!userTaskCounts[task.assigneeId]) {
          userTaskCounts[task.assigneeId] = 0;
        }
        
        userTaskCounts[task.assigneeId]++;
      });
      
      // Convert to array format required by API spec
      Object.entries(userTaskCounts).forEach(([userId, taskCount]) => {
        result.push({
          userId,
          taskCount
        });
      });
      
      // Sort by task count (descending)
      result.sort((a, b) => b.taskCount - a.taskCount);
      
      return result;
    })),
  
  getTasksByPriority: protectedProcedure
    .query(() => safeProcedure(async () => {
      // Calculate task counts by priority according to API spec
      const result: { priority: string; count: number }[] = [];
      
      // Count tasks by priority
      const priorityCounts: Record<string, number> = {
        'low': 0,
        'medium': 0,
        'high': 0,
        'urgent': 0
      };
      
      mockTasks.forEach(task => {
        if (!task.priority) {
          return;
        }
        
        const priority = task.priority.toLowerCase();
        if (priority === 'high' || priority === 'medium' || priority === 'low' || priority === 'urgent') {
          priorityCounts[priority]++;
        }
      });
      
      // Convert to array format required by API spec
      Object.entries(priorityCounts).forEach(([priority, count]) => {
        if (count > 0) {
          result.push({
            priority,
            count
          });
        }
      });
      
      // Sort by priority (high to low)
      const priorityOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
      result.sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);
      
      return result;
    })),
  
  getCompletionTimeByPriority: protectedProcedure
    .query(() => safeProcedure(async () => {
      // Calculate average completion time by priority
      const completionTimes = {
        high: [] as number[],
        medium: [] as number[],
        low: [] as number[]
      };
      
      mockTasks.forEach(task => {
        if (!task.priority || task.status !== 'done' || !task.completedAt) {
          return;
        }
        
        const priority = task.priority.toLowerCase();
        if (priority !== 'high' && priority !== 'medium' && priority !== 'low') {
          return;
        }
        
        // Calculate completion time in days
        const createdDate = new Date(task.createdAt).getTime();
        const completedDate = new Date(task.completedAt).getTime();
        const completionTime = (completedDate - createdDate) / (24 * 60 * 60 * 1000);
        
        completionTimes[priority].push(completionTime);
      });
      
      // Calculate averages
      const avgCompletionTimes = {
        high: 0,
        medium: 0,
        low: 0
      };
      
      if (completionTimes.high.length > 0) {
        avgCompletionTimes.high = completionTimes.high.reduce((sum, time) => sum + time, 0) / completionTimes.high.length;
      }
      
      if (completionTimes.medium.length > 0) {
        avgCompletionTimes.medium = completionTimes.medium.reduce((sum, time) => sum + time, 0) / completionTimes.medium.length;
      }
      
      if (completionTimes.low.length > 0) {
        avgCompletionTimes.low = completionTimes.low.reduce((sum, time) => sum + time, 0) / completionTimes.low.length;
      }
      
      return {
        avgCompletionTimes,
        sampleSizes: {
          high: completionTimes.high.length,
          medium: completionTimes.medium.length,
          low: completionTimes.low.length
        }
      };
    }))
});