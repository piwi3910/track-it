/**
 * Utilities for working with the API
 */
import { RouterOutputs } from '@track-it/shared';

/**
 * Helper type for API response
 */
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Type-safe helper to combine multiple API responses
 * @param responses API responses to handle
 * @returns Object with all data or combined errors
 */
export function combineResponses<T extends Record<string, any>>(
  responses: { [K in keyof T]: ApiResponse<T[K]> }
): ApiResponse<T> {
  // Check if any responses have errors
  const errors = Object.entries(responses)
    .filter(([_, response]) => response.error !== null)
    .map(([key, response]) => `${key}: ${response.error}`)
    .join(', ');
  
  if (errors) {
    return { data: null, error: errors };
  }
  
  // Combine all successful data
  const data = Object.fromEntries(
    Object.entries(responses).map(([key, response]) => [key, response.data])
  ) as T;
  
  return { data, error: null };
}

/**
 * Checks if the API is available
 * @returns Promise resolving to boolean indicating if API is reachable
 */
export async function isApiAvailable(): Promise<boolean> {
  try {
    // Try to call a simple API endpoint that doesn't require authentication
    const response = await fetch(
      import.meta.env.VITE_API_URL?.replace('/trpc', '') || 'http://localhost:3001/health'
    );
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}