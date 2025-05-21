import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../server';

// Define Redis client connection options
const redisOptions = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 5
};

// Create a singleton Redis client instance
export class RedisClient {
  private static instance: Redis | null = null;
  
  private constructor() {}
  
  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(redisOptions);
      
      // Setup event listeners
      RedisClient.instance.on('connect', () => {
        logger.info('Redis client connected');
      });
      
      RedisClient.instance.on('error', (err) => {
        logger.error({ err }, 'Redis client error');
      });
      
      RedisClient.instance.on('reconnecting', () => {
        logger.warn('Redis client reconnecting');
      });
    }
    
    return RedisClient.instance;
  }
  
  public static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit();
      RedisClient.instance = null;
      logger.info('Redis client disconnected');
    }
  }
}

// Export a convenience method to get the Redis client
export const getRedisClient = (): Redis => RedisClient.getInstance();