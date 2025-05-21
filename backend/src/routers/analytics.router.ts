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
    status: 'in-progress',
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
      
      // Calculate completion stats
      let completedTasks = 0;
      let totalTasks = 0;
      let avgCompletionTime = 0;
      let totalEstimatedHours = 0;
      let totalActualHours = 0;
      
      // Group tasks by day, week, or month based on timeframe
      const periods: Record<string, {
        label: string;
        completed: number;
        created: number;
        estimatedHours: number;
        actualHours: number;
      }> = {};
      
      mockTasks.forEach(task => {
        const createdDate = new Date(task.createdAt).getTime();
        
        // Skip tasks created before the start date
        if (createdDate < startDate) {
          return;
        }
        
        totalTasks++;
        totalEstimatedHours += task.estimatedHours;
        
        if (task.status === 'done' && task.completedAt) {
          completedTasks++;
          totalActualHours += task.actualHours;
          
          // Calculate completion time in days
          const completionTime = (new Date(task.completedAt).getTime() - createdDate) / (24 * 60 * 60 * 1000);
          avgCompletionTime += completionTime;
        }
        
        // Group by period
        let periodKey: string;
        let periodLabel: string;
        
        if (input.timeframe === 'week') {
          // Group by day
          periodKey = new Date(task.createdAt).toISOString().split('T')[0];
          periodLabel = new Date(task.createdAt).toLocaleDateString();
        } else if (input.timeframe === 'month') {
          // Group by week
          const date = new Date(task.createdAt);
          const weekNum = Math.ceil((date.getDate() + (date.getDay() + 1)) / 7);
          periodKey = `${date.getFullYear()}-${date.getMonth() + 1}-W${weekNum}`;
          periodLabel = `Week ${weekNum}`;
        } else {
          // Group by month
          const date = new Date(task.createdAt);
          periodKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
          periodLabel = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        }
        
        // Create period if it doesn't exist
        if (!periods[periodKey]) {
          periods[periodKey] = {
            label: periodLabel,
            completed: 0,
            created: 0,
            estimatedHours: 0,
            actualHours: 0
          };
        }
        
        // Update period stats
        periods[periodKey].created++;
        periods[periodKey].estimatedHours += task.estimatedHours;
        
        if (task.status === 'done' && task.completedAt) {
          // Check if completion date is in this period
          const completedDate = new Date(task.completedAt);
          let completedPeriodKey: string;
          
          if (input.timeframe === 'week') {
            completedPeriodKey = completedDate.toISOString().split('T')[0];
          } else if (input.timeframe === 'month') {
            const weekNum = Math.ceil((completedDate.getDate() + (completedDate.getDay() + 1)) / 7);
            completedPeriodKey = `${completedDate.getFullYear()}-${completedDate.getMonth() + 1}-W${weekNum}`;
          } else {
            completedPeriodKey = `${completedDate.getFullYear()}-${completedDate.getMonth() + 1}`;
          }
          
          // Create period if it doesn't exist
          if (!periods[completedPeriodKey]) {
            let completedPeriodLabel: string;
            
            if (input.timeframe === 'week') {
              completedPeriodLabel = completedDate.toLocaleDateString();
            } else if (input.timeframe === 'month') {
              const weekNum = Math.ceil((completedDate.getDate() + (completedDate.getDay() + 1)) / 7);
              completedPeriodLabel = `Week ${weekNum}`;
            } else {
              completedPeriodLabel = `${completedDate.toLocaleString('default', { month: 'short' })} ${completedDate.getFullYear()}`;
            }
            
            periods[completedPeriodKey] = {
              label: completedPeriodLabel,
              completed: 0,
              created: 0,
              estimatedHours: 0,
              actualHours: 0
            };
          }
          
          periods[completedPeriodKey].completed++;
          periods[completedPeriodKey].actualHours += task.actualHours;
        }
      });
      
      // Calculate average completion time
      if (completedTasks > 0) {
        avgCompletionTime /= completedTasks;
      }
      
      // Convert periods to array
      const chartData = Object.values(periods).sort((a, b) => {
        // For sorting, we need to convert the label back to a date-like value
        return a.label.localeCompare(b.label);
      });
      
      return {
        summary: {
          totalTasks,
          completedTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
          avgCompletionTime,
          totalEstimatedHours,
          totalActualHours,
          estimationAccuracy: totalEstimatedHours > 0 ? (totalActualHours / totalEstimatedHours) * 100 : 0
        },
        chartData
      };
    })),
  
  getUserWorkload: protectedProcedure
    .query(() => safeProcedure(async () => {
      // Calculate user workload stats
      const userWorkloads: Record<string, {
        userId: string;
        userName: string;
        totalTasks: number;
        completedTasks: number;
        inProgressTasks: number;
        todoTasks: number;
        estimatedRemainingHours: number;
      }> = {};
      
      // Initialize user workloads
      mockUsers.forEach(user => {
        userWorkloads[user.id] = {
          userId: user.id,
          userName: user.name,
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          todoTasks: 0,
          estimatedRemainingHours: 0
        };
      });
      
      // Populate workload data
      mockTasks.forEach(task => {
        if (!task.assigneeId || !userWorkloads[task.assigneeId]) {
          return;
        }
        
        const userWorkload = userWorkloads[task.assigneeId];
        userWorkload.totalTasks++;
        
        if (task.status === 'done') {
          userWorkload.completedTasks++;
        } else if (task.status === 'in-progress') {
          userWorkload.inProgressTasks++;
          // For in-progress tasks, estimate remaining hours based on progress
          userWorkload.estimatedRemainingHours += task.estimatedHours - task.actualHours;
        } else {
          userWorkload.todoTasks++;
          userWorkload.estimatedRemainingHours += task.estimatedHours;
        }
      });
      
      return Object.values(userWorkloads);
    })),
  
  getTasksByPriority: protectedProcedure
    .query(() => safeProcedure(async () => {
      // Calculate task counts by priority
      const totalCounts = {
        high: 0,
        medium: 0,
        low: 0
      };
      
      const openCounts = {
        high: 0,
        medium: 0,
        low: 0
      };
      
      const completedCounts = {
        high: 0,
        medium: 0,
        low: 0
      };
      
      mockTasks.forEach(task => {
        if (!task.priority) {
          return;
        }
        
        const priority = task.priority.toLowerCase();
        if (priority !== 'high' && priority !== 'medium' && priority !== 'low') {
          return;
        }
        
        totalCounts[priority]++;
        
        if (task.status === 'done') {
          completedCounts[priority]++;
        } else {
          openCounts[priority]++;
        }
      });
      
      return {
        total: totalCounts,
        open: openCounts,
        completed: completedCounts
      };
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