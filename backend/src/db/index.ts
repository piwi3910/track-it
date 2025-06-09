/**
 * Database module entry point
 * Export all database-related functionality from this file
 */
import prisma from './client';

// Export the Prisma client
export { prisma };

// Export repositories instead of services
export { default as repositories } from '../repositories/container';

// Utility function to connect to the database
export async function connectToDatabase() {
  try {
    // Test connection
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('Database connected successfully');
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to connect to database:', error);
    return false;
  }
}

// Utility function to disconnect from the database
export async function disconnectFromDatabase() {
  try {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.log('Database disconnected successfully');
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to disconnect from database:', error);
    return false;
  }
}

/**
 * Check database connection health
 */
export async function healthCheck() {
  try {
    // Simple query to check if database is responsive
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true, message: 'Database connection is healthy' };
  } catch (error) {
    return { 
      connected: false, 
      message: 'Database connection failed', 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}