/**
 * Database module entry point
 * Export all database-related functionality from this file
 */
import prisma from './client';

// Export the Prisma client
export { prisma };

// Export service modules directly
export * as taskService from './services/task.service';
export * as templateService from './services/template.service';
export * as userService from './services/user.service';
export * as commentService from './services/comment.service';
export * as attachmentService from './services/attachment.service';
export * as notificationService from './services/notification.service';
export * as analyticsService from './services/analytics.service';
export * as googleService from './services/google.service';

// Utility function to connect to the database
export async function connectToDatabase() {
  try {
    // Test connection
    await prisma.$connect();
    console.log('Database connected successfully');
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
}

// Utility function to disconnect from the database
export async function disconnectFromDatabase() {
  try {
    await prisma.$disconnect();
    console.log('Database disconnected successfully');
    return true;
  } catch (error) {
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