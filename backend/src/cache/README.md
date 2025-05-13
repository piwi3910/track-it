# Redis Caching System for Track-It

This directory contains the implementation of a Redis-based caching system for the Track-It backend API. The caching system is designed to improve performance by storing frequently accessed data in Redis.

## Key Components

### `redis.ts`

Responsible for setting up the Redis client connection:

- Configures the Redis client with appropriate options from config
- Implements a singleton pattern to ensure a single connection
- Handles connection events (connect, error, reconnect)
- Provides graceful disconnect functionality

### `index.ts`

Provides the core cache service with methods for reading/writing cache data:

- `get(key)`: Retrieve cached data
- `set(key, data, ttl)`: Store data in cache with TTL
- `delete(key)`: Remove a specific cache entry
- `deleteByPattern(pattern)`: Remove multiple cache entries by pattern
- `invalidateResourceCache(resourceType)`: Clear all cache for a resource
- `exists(key)`: Check if a key exists in cache
- Helpers for tracking cache hits/misses

### `trpc-cache.ts`

Implements tRPC middleware for caching:

- `createCacheMiddleware()`: Creates middleware for caching query responses
- `createCacheInvalidationMiddleware()`: Creates middleware for invalidating cache on mutations
- Support for different cache strategies (cache-first, network-first)
- Custom key generation based on procedure path and inputs

### `cache-procedures.ts`

Provides helpers for creating cached tRPC procedures:

- `createCachedProcedures()`: Creates cached procedures for a resource type
- Configurable TTLs for different query types (item, list, search)
- Automatic cache invalidation for mutations

### `cache-metrics.ts`

Tools for monitoring and managing the cache:

- `getCacheMetrics()`: Get statistics about cache usage
- `flushCache()`: Clear all cache data
- `clearCacheByPattern()`: Clear cache by pattern
- Tracking for hit/miss rates

## Usage Example

```typescript
// In a router file
import { createCachedProcedures } from '../cache/cache-procedures';

// Configure caching for this resource
const taskCacheConfig = {
  resourceType: 'tasks',
  queryTTL: 300,       // 5 minutes for single task queries
  listTTL: 60,         // 1 minute for task lists
  searchTTL: 30,       // 30 seconds for search results
};

// Create cached procedures
const {
  cachedItemProcedure,
  cachedListProcedure,
  cachedSearchProcedure,
  cachedMutationProcedure,
} = createCachedProcedures(taskCacheConfig);

// Use in router
export const tasksRouter = router({
  // Query with caching
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .use(cachedItemProcedure.middleware)
    .query(({ input }) => {
      return TaskService.findById(input.id);
    }),

  // Mutation with cache invalidation
  update: protectedProcedure
    .input(updateSchema)
    .use(cachedMutationProcedure.middleware)
    .mutation(({ input }) => {
      return TaskService.update(input.id, input.data);
    })
});
```

## Cache TTL Strategy

- **Individual Items**: Longer TTL (5 minutes) as they change less frequently and are accessed often
- **Lists**: Medium TTL (1 minute) as they change more frequently when items are added/modified
- **Search Results**: Short TTL (30 seconds) as they are more likely to change and often less critical to be 100% up-to-date

## Cache Key Format

Cache keys follow this format:
- `resourceType:operation:parameters`

Examples:
- `tasks:id:123` - Individual task
- `tasks:status:in_progress` - List of tasks with a specific status
- `tasks:assignee:user456` - Tasks assigned to a specific user

## Cache Invalidation

Cache invalidation occurs when:
1. Creating a new item in a collection
2. Updating an existing item
3. Deleting an item
4. Performing specialized operations like status changes

Invalidation can be targeted (specific item) or broad (entire resource type).