import { inferAsyncReturnType } from '@trpc/server';
import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';

// Context for all requests
export async function createContext({
  req,
  res
}: CreateFastifyContextOptions): Promise<{
  req: FastifyRequest;
  res: FastifyReply;
  user?: {
    id: string;
    role: string;
  } | null;
  logger: typeof logger;
}> {
  let user: { id: string; role: string } | null = null;

  // If request has a valid token, extract user info
  try {
    if (req.headers.authorization?.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
      
      // Verify token and extract user info
      // In a real app, this would use JWT verification
      if (token && token !== 'undefined') {
        const decoded = await req.server.jwt.verify<{ id: string; role: string }>(token);
        user = decoded;
      }
    }
  } catch (err) {
    // Token is invalid, user will be null
    logger.warn(err, 'Failed to authenticate user');
  }

  return {
    req,
    res,
    user: user || undefined,
    logger
  };
}

// Type for the context
export type Context = inferAsyncReturnType<typeof createContext>;