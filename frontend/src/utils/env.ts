/**
 * Environment variable utilities
 * Provides typed access to environment variables
 */

// Define environment variables structure
interface Env {
  // API URL - defaults to localhost:3001/trpc if not defined
  VITE_API_URL: string;
  // Environment - development, test, production
  MODE: string;
  // Base URL
  BASE_URL: string;
  // Debug mode flag
  DEBUG: boolean;
}

// Load environment variables
export const env: Env = {
  VITE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/trpc',
  MODE: import.meta.env.MODE,
  BASE_URL: import.meta.env.BASE_URL,
  DEBUG: import.meta.env.MODE === 'development',
};

// Check if in development mode
export const isDev = env.MODE === 'development';

// Check if in production mode
export const isProd = env.MODE === 'production';

// Check if in test mode
export const isTest = env.MODE === 'test';