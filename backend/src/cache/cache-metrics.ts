import { getRedisClient } from './redis';
import { logger } from '../utils/logger';

// Interface for cache metrics
export interface CacheMetrics {
  totalKeys: number;
  keysByPrefix: Record<string, number>;
  memoryUsage: {
    used: string;
    peak: string;
    total: string;
  };
  hitRate?: number;
  missRate?: number;
  keyspace?: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

// Counter values for hits and misses (for development/testing)
let cacheHits = 0;
let cacheMisses = 0;

// Track cache hits
export function trackHit(): void {
  cacheHits++;
}

// Track cache misses
export function trackMiss(): void {
  cacheMisses++;
}

// Reset metrics
export function resetMetrics(): void {
  cacheHits = 0;
  cacheMisses = 0;
}

// Get current hit rate
export function getHitRate(): number {
  const total = cacheHits + cacheMisses;
  return total === 0 ? 0 : cacheHits / total;
}

// Get cache metrics
export async function getCacheMetrics(): Promise<CacheMetrics> {
  const redis = getRedisClient();
  
  try {
    // Get all keys
    const keys = await redis.keys('*');
    
    // Count keys by prefix
    const keysByPrefix: Record<string, number> = {};
    keys.forEach(key => {
      const prefix = key.split(':')[0] || 'other';
      keysByPrefix[prefix] = (keysByPrefix[prefix] || 0) + 1;
    });
    
    // Get memory info
    const infoMemory = await redis.info('memory');
    const usedMemory = infoMemory.match(/used_memory_human:(.+)/)?.[1]?.trim() || '0';
    const peakMemory = infoMemory.match(/used_memory_peak_human:(.+)/)?.[1]?.trim() || '0';
    const totalMemory = infoMemory.match(/total_system_memory_human:(.+)/)?.[1]?.trim() || '0';
    
    // Get stats info if available
    const infoStats = await redis.info('stats');
    let keyspaceHits = 0;
    let keyspaceMisses = 0;
    
    const hitsMatch = infoStats.match(/keyspace_hits:(\d+)/);
    const missesMatch = infoStats.match(/keyspace_misses:(\d+)/);
    
    if (hitsMatch && missesMatch) {
      keyspaceHits = parseInt(hitsMatch[1], 10);
      keyspaceMisses = parseInt(missesMatch[1], 10);
    }
    
    const keyspaceTotal = keyspaceHits + keyspaceMisses;
    const keyspaceHitRate = keyspaceTotal === 0 
      ? 0 
      : keyspaceHits / keyspaceTotal;
    
    return {
      totalKeys: keys.length,
      keysByPrefix,
      memoryUsage: {
        used: usedMemory,
        peak: peakMemory,
        total: totalMemory,
      },
      hitRate: getHitRate(),
      missRate: cacheMisses / (cacheHits + cacheMisses || 1),
      keyspace: {
        hits: keyspaceHits,
        misses: keyspaceMisses,
        hitRate: keyspaceHitRate,
      },
    };
  } catch (error) {
    logger.error('Error getting cache metrics:', error);
    return {
      totalKeys: 0,
      keysByPrefix: {},
      memoryUsage: {
        used: '0',
        peak: '0',
        total: '0',
      }
    };
  }
}

// Flush cache completely
export async function flushCache(): Promise<boolean> {
  try {
    const redis = getRedisClient();
    await redis.flushdb();
    resetMetrics();
    return true;
  } catch (error) {
    logger.error('Error flushing cache:', error);
    return false;
  }
}

// Clear cache for a specific pattern
export async function clearCacheByPattern(pattern: string): Promise<number> {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    
    return keys.length;
  } catch (error) {
    logger.error(`Error clearing cache for pattern ${pattern}:`, error);
    return 0;
  }
}