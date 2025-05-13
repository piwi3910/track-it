import { TRPCError } from '@trpc/server';
import { MiddlewareFunction } from '@trpc/server/dist/declarations/src/internals/middlewares';
import { Context } from '../trpc/context';
import { CacheService } from './index';
import { logger } from '../utils/logger';
import crypto from 'crypto';

// Interface for cache options
export interface CacheOptions {
  // TTL in seconds (0 means use default)
  ttl?: number;
  // Custom key generation function
  keyGenerator?: (path: string, input: unknown) => string;
  // Cache strategy
  strategy?: 'cache-first' | 'network-first';
}

// Generate a cache key from a path and input
export function generateCacheKey(path: string, input: unknown): string {
  // Convert input to string based on type
  let inputString = '';
  
  if (input !== undefined && input !== null) {
    if (typeof input === 'string') {
      inputString = input;
    } else if (typeof input === 'number' || typeof input === 'boolean') {
      inputString = input.toString();
    } else {
      // Sort object keys for consistent hashing
      inputString = JSON.stringify(input, Object.keys(input as object).sort());
    }
  }
  
  // For simple inputs, just use them directly
  if (typeof input === 'string' && input.length < 50) {
    return `trpc:${path}:${input}`;
  }
  
  // For complex inputs, use a hash
  const hash = crypto
    .createHash('md5')
    .update(inputString)
    .digest('hex');
  
  return `trpc:${path}:${hash}`;
}

// Default cache options
const defaultCacheOptions: Required<CacheOptions> = {
  ttl: 0, // Use default TTL from config
  keyGenerator: generateCacheKey,
  strategy: 'cache-first',
};

// Create a caching middleware for tRPC procedures
export function createCacheMiddleware(options: CacheOptions = {}): MiddlewareFunction<Context> {
  // Merge provided options with defaults
  const { ttl, keyGenerator, strategy } = {
    ...defaultCacheOptions,
    ...options,
  };
  
  return async ({ path, type, next, ctx, input }) => {
    // Only apply caching to queries (not mutations)
    if (type !== 'query') {
      return next();
    }
    
    // Generate cache key
    const cacheKey = keyGenerator(path, input);
    
    // Cache-first strategy (default)
    if (strategy === 'cache-first') {
      try {
        // Try to get from cache first
        const cachedData = await CacheService.get(cacheKey);
        
        if (cachedData) {
          // Record cache hit
          CacheService.recordCacheHit(cacheKey);
          return { ok: true, data: cachedData };
        }
        
        // Record cache miss
        CacheService.recordCacheMiss(cacheKey);
        
        // Get fresh data from the handler
        const result = await next();
        
        // Cache the result if successful
        if (result.ok) {
          await CacheService.set(cacheKey, result.data, ttl);
        }
        
        return result;
      } catch (error) {
        logger.error(`Cache middleware error: ${error}`);
        return next();
      }
    }
    
    // Network-first strategy
    if (strategy === 'network-first') {
      try {
        // Try to get fresh data first
        const result = await next();
        
        // Cache the result if successful
        if (result.ok) {
          await CacheService.set(cacheKey, result.data, ttl);
          return result;
        }
        
        // If network request fails, try to get from cache
        const cachedData = await CacheService.get(cacheKey);
        
        if (cachedData) {
          CacheService.recordCacheHit(cacheKey);
          return { ok: true, data: cachedData };
        }
        
        // No cache data, return the original error
        return result;
      } catch (error) {
        // On error, try to get from cache
        const cachedData = await CacheService.get(cacheKey);
        
        if (cachedData) {
          CacheService.recordCacheHit(cacheKey);
          return { ok: true, data: cachedData };
        }
        
        // If no cache data, convert to TRPC error
        if (error instanceof Error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
            cause: error,
          });
        }
        throw error;
      }
    }
    
    // Fallback to no caching
    return next();
  };
}

// Middleware to invalidate cache entries for a resource
export function createCacheInvalidationMiddleware(resourceType: string): MiddlewareFunction<Context> {
  return async ({ path, type, next }) => {
    // Process the request first
    const result = await next();
    
    // Invalidate cache for mutations (create, update, delete)
    if (type === 'mutation' && result.ok) {
      await CacheService.invalidateResourceCache(resourceType);
      logger.debug(`Invalidated cache for ${resourceType} after ${path}`);
    }
    
    return result;
  };
}

// Export a convenience function to create a caching procedure
export function withCache(resourceType: string, options: CacheOptions = {}) {
  return {
    query: {
      middleware: createCacheMiddleware(options),
    },
    mutation: {
      middleware: createCacheInvalidationMiddleware(resourceType),
    },
  };
}