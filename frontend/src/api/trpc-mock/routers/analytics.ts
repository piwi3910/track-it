/**
 * Analytics router for the mock tRPC API
 */

import { router, query } from '../trpc';
import { db, delay } from '../db';
import { TaskCompletionStatsInput } from '../types';

// Create the analytics router with all endpoints
export const analyticsRouter = router({
  // Get task completion statistics
  getTasksCompletionStats: query()
    .query(async ({ timeframe }: TaskCompletionStatsInput) => {
      await delay(500);
      return db.analytics.getTaskCompletionStats(timeframe);
    }),

  // Get user workload statistics
  getUserWorkload: query()
    .query(async () => {
      await delay(400);
      return db.analytics.getUserWorkload();
    }),

  // Get tasks grouped by priority
  getTasksByPriority: query()
    .query(async () => {
      await delay(300);
      return db.analytics.getTasksByPriority();
    })
});