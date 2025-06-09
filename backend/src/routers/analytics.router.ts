import { z } from 'zod';
import { router, protectedProcedure, safeProcedure } from '../trpc/trpc';
import { handleError } from '../utils/unified-error-handler';
import repositories from '../repositories/container';


// Input validation schemas
const tasksCompletionStatsSchema = z.object({
  timeframe: z.enum(['week', 'month', 'year']).default('week')
});

export const analyticsRouter = router({
  getTasksCompletionStats: protectedProcedure
    .input(tasksCompletionStatsSchema)
    .query(({ input }) => safeProcedure(async () => {
      try {
        return await repositories.analytics.getTaskCompletionStats(input.timeframe);
      } catch (error) {
        return handleError(error);
      }
    })),
  
  getUserWorkload: protectedProcedure
    .query(() => safeProcedure(async () => {
      try {
        return await repositories.analytics.getUserWorkload();
      } catch (error) {
        return handleError(error);
      }
    })),
  
  getTasksByPriority: protectedProcedure
    .query(() => safeProcedure(async () => {
      try {
        return await repositories.analytics.getTasksByPriority();
      } catch (error) {
        return handleError(error);
      }
    })),
  
  getCompletionTimeByPriority: protectedProcedure
    .query(() => safeProcedure(async () => {
      try {
        return await repositories.analytics.getCompletionTimeByPriority();
      } catch (error) {
        return handleError(error);
      }
    }))
});