import { getRedisClient } from './redis';
import { config } from '../config';
import { logger } from '../utils/logger';

// Default cache TTL (from config)
const DEFAULT_TTL = config.redis.ttl;

// Cache utilities for the application
export class CacheService {
  // Get item from cache
  public static async get<T>(key: string): Promise<T | null> {
    try {
      const redis = getRedisClient();
      const data = await redis.get(key);
      
      if (!data) {
        return null;
      }
      
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Error getting data from cache:', error);
      return null;
    }
  }
  
  // Set item in cache with TTL
  public static async set(key: string, data: unknown, ttl = DEFAULT_TTL): Promise<void> {
    try {
      const redis = getRedisClient();
      const serializedData = JSON.stringify(data);
      
      await redis.set(key, serializedData, 'EX', ttl);
    } catch (error) {
      logger.error('Error setting data in cache:', error);
    }
  }
  
  // Delete item from cache
  public static async delete(key: string): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.del(key);
    } catch (error) {
      logger.error('Error deleting data from cache:', error);
    }
  }
  
  // Delete multiple items using a pattern
  public static async deleteByPattern(pattern: string): Promise<void> {
    try {
      const redis = getRedisClient();
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      logger.error('Error deleting data by pattern from cache:', error);
    }
  }
  
  // Clear all cache entries for a specific resource type
  public static async invalidateResourceCache(resourceType: string): Promise<void> {
    await CacheService.deleteByPattern(`${resourceType}:*`);
  }
  
  // Check if a key exists
  public static async exists(key: string): Promise<boolean> {
    try {
      const redis = getRedisClient();
      const exists = await redis.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Error checking if key exists in cache:', error);
      return false;
    }
  }
  
  // Record a cache hit for metrics (useful for monitoring)
  public static recordCacheHit(key: string): void {
    if (config.isDev) {
      logger.debug(`Cache HIT: ${key}`);
    }
  }
  
  // Record a cache miss for metrics (useful for monitoring)
  public static recordCacheMiss(key: string): void {
    if (config.isDev) {
      logger.debug(`Cache MISS: ${key}`);
    }
  }
}

// Export direct access to methods
export const { get, set, delete: del, deleteByPattern, invalidateResourceCache, exists } = CacheService;