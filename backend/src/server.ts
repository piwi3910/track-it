import fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { TRPCError } from '@trpc/server';
import { config } from './config';
import { logger } from './utils/logger';
import { createContext } from './trpc/context';
import { appRouter } from './trpc/router';
import { RedisClient } from './cache/redis';

// Export type definition of API
export type AppRouter = typeof appRouter;

// Create Fastify server
const server = fastify({
  logger: logger
});

// Register plugins and routes
async function setupServer(): Promise<void> {
  try {
    // Register CORS with improved configuration
    await server.register(cors, {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000', config.corsOrigin],
      credentials: true,
      methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'HEAD'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-From-Frontend', 'Accept'],
      exposedHeaders: ['Authorization', 'Content-Type'],
      maxAge: 86400, // Cache preflight requests for 24 hours
      preflight: true,
      strictPreflight: false // More lenient preflight checking
    });

    // Register JWT
    await server.register(jwt, {
      secret: config.jwtSecret
    });

    // Health check route with improved CORS handling
    server.get('/health', async (request, reply): Promise<{ status: string; timestamp: string; api: string; version: string }> => {
      // Get the origin from request headers or use default origins
      const requestOrigin = request.headers.origin;
      const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', config.corsOrigin];
      
      // Set CORS headers based on origin
      if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        reply.header('Access-Control-Allow-Origin', requestOrigin);
        reply.header('Access-Control-Allow-Credentials', 'true');
      } else {
        // Fallback to * for health checks from non-browser clients
        reply.header('Access-Control-Allow-Origin', '*');
      }
      
      reply.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-From-Frontend, Accept');
      
      // Handle preflight OPTIONS request
      if (request.method === 'OPTIONS') {
        reply.code(204).send();
        return {} as any;
      }
      
      return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        api: 'track-it-backend',
        version: '1.0.0'
      };
    });
    
    // Root health check (for API availability checks) with improved CORS handling
    server.get('/', async (request, reply): Promise<{ status: string }> => {
      // Get the origin from request headers or use default origins
      const requestOrigin = request.headers.origin;
      const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', config.corsOrigin];
      
      // Set CORS headers based on origin
      if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        reply.header('Access-Control-Allow-Origin', requestOrigin);
        reply.header('Access-Control-Allow-Credentials', 'true');
      } else {
        // Fallback to * for health checks from non-browser clients
        reply.header('Access-Control-Allow-Origin', '*');
      }
      
      reply.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-From-Frontend, Accept');
      
      // Handle preflight OPTIONS request
      if (request.method === 'OPTIONS') {
        reply.code(204).send();
        return {} as any;
      }
      
      return { status: 'Server is running' };
    });

    // Register tRPC plugin
    await server.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
      trpcOptions: { 
        router: appRouter, 
        createContext,
        onError({ error }: { error: TRPCError }): void {
          if (error.code === 'INTERNAL_SERVER_ERROR') {
            // Log internal server errors
            logger.error('Something went wrong', error);
          }
        },
      }
    });

    // Start the server
    await server.listen({ 
      port: config.port, 
      host: config.host 
    });

    logger.info(`Server is running on http://${config.host}:${config.port}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

setupServer();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  try {
    // Close fastify server
    await server.close();
    logger.info('Server closed');

    // Disconnect from Redis
    await RedisClient.disconnect();
    logger.info('Redis disconnected');

    // Add any other cleanup here

    process.exit(0);
  } catch (err) {
    logger.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
});