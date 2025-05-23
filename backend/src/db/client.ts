/**
 * Prisma client singleton for database access
 * This ensures a single connection to the database throughout the application
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../server';

// Create Prisma client with logging
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { level: 'query', emit: 'event' } as Prisma.LogDefinition,
      { level: 'error', emit: 'stdout' } as Prisma.LogDefinition,
      { level: 'warn', emit: 'stdout' } as Prisma.LogDefinition,
    ],
  });

// Set up logging - Prisma v5+ removed $on('query') 
// Use $extends instead for query logging if needed

// Add error handling
prisma.$use(async (params, next) => {
  const startTime = Date.now();
  try {
    return await next(params);
  } catch (error) {
    logger.error({
      error,
      params,
      duration: Date.now() - startTime,
    }, 'Prisma Error');
    throw error;
  }
});

// Save prisma client on global in development to prevent hot-reloading issues
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Export the Prisma client as the default export
export default prisma;