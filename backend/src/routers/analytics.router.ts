import { z } from 'zod';
import { router, protectedProcedure, safeProcedure } from '../trpc/trpc';
import { handleError } from '../utils/error-handler';
import * as analyticsService from '../db/services/analytics.service';


// Input validation schemas
const tasksCompletionStatsSchema = z.object({
  timeframe: z.enum(['week', 'month', 'year']).default('week')
});

export const analyticsRouter = router({
  getTasksCompletionStats: protectedProcedure
    .input(tasksCompletionStatsSchema)
    .query(({ input }) => safeProcedure(async () => {
      try {
        return await analyticsService.getTaskCompletionStats(input.timeframe);
      } catch (error) {
        return handleError(error);
      }
    })),
  
  getUserWorkload: protectedProcedure
    .query(() => safeProcedure(async () => {
      try {
        return await analyticsService.getUserWorkload();
      } catch (error) {
        return handleError(error);
      }
    })),
  
  getTasksByPriority: protectedProcedure
    .query(() => safeProcedure(async () => {
      try {
        return await analyticsService.getTasksByPriority();
      } catch (error) {
        return handleError(error);
      }
    })),
  
  getCompletionTimeByPriority: protectedProcedure
    .query(() => safeProcedure(async () => {
      try {
        return await analyticsService.getCompletionTimeByPriority();
      } catch (error) {
        return handleError(error);
      }
    }))
});