import { z } from 'zod';
import { router, adminProcedure } from '../trpc/trpc';
import { 
  getCacheMetrics, 
  flushCache, 
  clearCacheByPattern 
} from '../cache/cache-metrics';

// Admin router for cache management
export const cacheAdminRouter = router({
  // Get cache metrics
  getMetrics: adminProcedure.query(async () => {
    const metrics = await getCacheMetrics();
    return metrics;
  }),
  
  // Flush all cache
  flushAll: adminProcedure.mutation(async () => {
    const success = await flushCache();
    return {
      success,
      message: success 
        ? 'Cache flushed successfully' 
        : 'Error flushing cache'
    };
  }),
  
  // Clear cache by pattern
  clearByPattern: adminProcedure
    .input(z.object({
      pattern: z.string().min(1)
    }))
    .mutation(async ({ input }) => {
      const keysRemoved = await clearCacheByPattern(input.pattern);
      return {
        success: true,
        keysRemoved,
        message: `Removed ${keysRemoved} keys matching pattern: ${input.pattern}`
      };
    }),
  
  // Clear cache for specific resource type
  clearResourceCache: adminProcedure
    .input(z.object({
      resourceType: z.string().min(1)
    }))
    .mutation(async ({ input }) => {
      // Add * wildcard to match all keys for this resource
      const pattern = `${input.resourceType}:*`;
      const keysRemoved = await clearCacheByPattern(pattern);
      return {
        success: true,
        keysRemoved,
        message: `Removed ${keysRemoved} keys for resource: ${input.resourceType}`
      };
    })
});