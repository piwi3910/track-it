import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { expressjwt } from 'express-jwt';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { config } from './config';
import { appRouter } from './trpc/router';
import { createContext } from './trpc/context';
import { RedisClient } from './cache/redis';

// Export type definition of API for client usage
export type AppRouter = typeof appRouter;

// Create Express application
const app = express();

// Create logger instance
export const logger = pino({
  level: config.logLevel || 'info',
  transport: process.env.NODE_ENV !== 'production' 
    ? { target: 'pino-pretty' } 
    : undefined
});

// Configure middleware
app.use(helmet()); // Security headers
app.use(pinoHttp({ logger })); // Request logging

// Configure CORS
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000', 
    config.corsOrigin
  ],
  credentials: true,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-From-Frontend', 
    'Accept',
    'content-type',
    'accept',
    'x-from-frontend'
  ],
  exposedHeaders: ['Authorization', 'Content-Type'],
  maxAge: 86400, // Cache preflight requests for 24 hours
}));

// JSON parsing middleware
app.use(express.json());

// Health check route
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    api: 'track-it-backend',
    version: '1.0.0'
  });
});

// Root health check (for API availability checks)
app.get('/', (_req, res) => {
  res.json({ status: 'Server is running' });
});

// JWT authentication middleware for protected routes
app.use('/trpc', 
  // Skip JWT check for certain procedures
  expressjwt({ 
    secret: config.jwtSecret,
    algorithms: ['HS256'],
    // Skip auth for login and public endpoints
    credentialsRequired: false, 
  }).unless({ 
    path: [
      '/trpc/users.login',
      '/trpc/users.register',
      '/trpc/users.loginWithGoogle',
      '/trpc/users.verifyGoogleToken',
      '/trpc/health'
    ]
  })
);

// Mount tRPC middleware
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        // Log internal server errors
        logger.error({ path, error }, 'tRPC Error');
      }
    },
  })
);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err, 'Express error handler');
  
  // Handle auth errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      message: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
  }

  // Handle other errors
  return res.status(err.statusCode || 500).json({
    message: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_SERVER_ERROR'
  });
});

// Start the server
const startServer = async () => {
  try {
    // Start listening for requests
    app.listen(config.port, config.host, () => {
      logger.info(`Server is running on http://${config.host}:${config.port}`);
    });
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  try {
    // Disconnect from Redis
    await RedisClient.disconnect();
    logger.info('Redis disconnected');

    // Add any other cleanup here
    
    process.exit(0);
  } catch (err) {
    logger.error(err, 'Error during graceful shutdown');
    process.exit(1);
  }
});