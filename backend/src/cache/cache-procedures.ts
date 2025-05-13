import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { Context } from '../trpc/context';
import { createCacheMiddleware, createCacheInvalidationMiddleware, CacheOptions } from './trpc-cache';

// Initialize a separate instance of tRPC for caching helpers
const t = initTRPC.context<Context>().create();

// Type for resource-based cache configuration
export interface ResourceCacheConfig {
  resourceType: string;
  queryTTL?: number;
  listTTL?: number;
  searchTTL?: number;
}

// Create procedures with caching middleware for a specific resource
export function createCachedProcedures(config: ResourceCacheConfig) {
  const { resourceType, queryTTL = 300, listTTL = 60, searchTTL = 30 } = config;
  
  // Invalidation middleware
  const invalidateCache = createCacheInvalidationMiddleware(resourceType);
  
  // Cache options for item queries
  const itemCacheOptions: CacheOptions = {
    ttl: queryTTL,
    strategy: 'cache-first',
  };
  
  // Cache options for list queries
  const listCacheOptions: CacheOptions = {
    ttl: listTTL,
    strategy: 'cache-first',
  };
  
  // Cache options for search queries
  const searchCacheOptions: CacheOptions = {
    ttl: searchTTL,
    strategy: 'network-first', // Prefer fresh data for searches
  };
  
  // Create middlewares for different query types
  const itemCacheMiddleware = createCacheMiddleware(itemCacheOptions);
  const listCacheMiddleware = createCacheMiddleware(listCacheOptions);
  const searchCacheMiddleware = createCacheMiddleware(searchCacheOptions);
  
  // Return procedures with caching middleware
  return {
    // Query procedures
    cachedItemProcedure: t.procedure.use(itemCacheMiddleware),
    cachedListProcedure: t.procedure.use(listCacheMiddleware),
    cachedSearchProcedure: t.procedure.use(searchCacheMiddleware),
    
    // Mutation procedures with cache invalidation
    cachedMutationProcedure: t.procedure.use(invalidateCache),
    
    // Helper method to invalidate the entire resource cache
    invalidateCache: () => {
      return import('./index').then(({ invalidateResourceCache }) => {
        return invalidateResourceCache(resourceType);
      });
    },
  };
}