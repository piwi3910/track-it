import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../server';
import { getRedisClient } from '../cache/redis';
import { config } from '../config';

// Context for all requests
export async function createContext({
  req,
  res
}: CreateExpressContextOptions): Promise<{
  req: Request;
  res: Response;
  user?: {
    id: string;
    role: string;
  } | null;
  logger: typeof logger;
  redis: ReturnType<typeof getRedisClient>;
}> {
  let user: { id: string; role: string } | null = null;

  // If request has a valid token, extract user info
  try {
    // With express-jwt middleware, the user will be in req.auth if token is valid
    if (req.auth) {
      user = req.auth as { id: string; role: string };
    } 
    // Fallback manual token verification for endpoints excluded from express-jwt
    else if (req.headers.authorization?.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
      
      // Verify token and extract user info
      if (token && token !== 'undefined') {
        const decoded = jwt.verify(token, config.jwtSecret) as { id: string; role: string };
        user = decoded;
      }
    }
  } catch (err) {
    // Token is invalid, user will be null
    logger.warn({ err }, 'Failed to authenticate user');
  }

  // Get Redis client instance
  const redis = getRedisClient();

  return {
    req,
    res,
    user: user || undefined,
    logger,
    redis
  };
}

// Type for the context
export type Context = inferAsyncReturnType<typeof createContext>;

// Add type augmentation for express Request
declare module 'express-serve-static-core' {
  interface Request {
    auth?: {
      id: string;
      role: string;
      [key: string]: unknown;
    };
  }
}