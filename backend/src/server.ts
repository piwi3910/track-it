import fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { TRPCError } from '@trpc/server';
import { config } from './config';
import { logger } from './utils/logger';
import { createContext } from './trpc/context';
import { appRouter } from './trpc/router';

// Export type definition of API
export type AppRouter = typeof appRouter;

// Create Fastify server
const server = fastify({
  logger: logger
});

// Register plugins and routes
async function setupServer(): Promise<void> {
  try {
    // Register CORS
    await server.register(cors, {
      origin: config.corsOrigin,
      credentials: true,
      methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-From-Frontend']
    });

    // Register JWT
    await server.register(jwt, {
      secret: config.jwtSecret
    });

    // Health check route
    server.get('/health', async (): Promise<{ status: string; timestamp: string }> => {
      return { status: 'ok', timestamp: new Date().toISOString() };
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