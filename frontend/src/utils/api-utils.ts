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
    // Extract the base URL (removing /trpc if present)
    const baseUrl = import.meta.env.VITE_API_URL?.includes('/trpc') 
      ? import.meta.env.VITE_API_URL.split('/trpc')[0]
      : import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    // Add trailing slash if missing
    const normalizedUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    
    // Only use the root health endpoint, not the tRPC one
    const healthUrl = `${normalizedUrl}health`;
    
    console.log(`Checking API availability at ${healthUrl}`);
    
    // Try the health endpoint with proper headers but NO credentials
    // This avoids CORS issues with wildcard origin and credentials
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-From-Frontend': 'track-it-frontend'
      },
      // Use 'same-origin' mode for credentials to avoid CORS issues with '*'
      credentials: 'same-origin',
      mode: 'cors',
    });
    
    if (response.ok) {
      console.log('API health check succeeded');
      return true;
    }
    
    // Log the failure and return false
    console.log(`Health check failed, API seems to be down`);
    return false;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}