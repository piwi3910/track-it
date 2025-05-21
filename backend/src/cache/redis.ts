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
  private static connected: boolean = false;
  
  private constructor() {}
  
  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(redisOptions);
      
      // Setup event listeners
      RedisClient.instance.on('connect', () => {
        RedisClient.connected = true;
        logger.info('Redis client connected');
      });
      
      RedisClient.instance.on('error', (err) => {
        RedisClient.connected = false;
        logger.error({ err }, 'Redis client error');
      });
      
      RedisClient.instance.on('reconnecting', () => {
        RedisClient.connected = false;
        logger.warn('Redis client reconnecting');
      });
    }
    
    return RedisClient.instance;
  }
  
  // Add connect method to match the API expected in server.ts
  public static async connect(): Promise<void> {
    // Get instance will initialize the connection if needed
    this.getInstance();
    // We don't need to do anything special here since ioredis connects automatically
    return Promise.resolve();
  }
  
  public static isConnected(): boolean {
    return RedisClient.connected && RedisClient.instance !== null;
  }
  
  public static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit();
      RedisClient.instance = null;
      RedisClient.connected = false;
      logger.info('Redis client disconnected');
    }
  }
}

// Export a convenience method to get the Redis client
export const getRedisClient = (): Redis => RedisClient.getInstance();