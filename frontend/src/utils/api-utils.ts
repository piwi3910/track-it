/**
 * Utilities for working with the API
 */

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
export function combineResponses<T extends Record<string, unknown>>(
  responses: { [K in keyof T]: ApiResponse<T[K]> }
): ApiResponse<T> {
  // Check if any responses have errors
  const errors = Object.entries(responses)
    .filter(([, response]) => response.error !== null)
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
    
    // Set timeout to avoid long waits when server is down
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      // Use a more CORS-friendly approach
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-From-Frontend': 'track-it-frontend'
        },
        // Don't include credentials for health check to avoid CORS preflight issues
        credentials: 'omit',
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('API health check succeeded');
        return true;
      }
      
      // Log the failure response
      console.log(`Health check failed with status: ${response.status}`);
      return false;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // If it's an abort error, log as timeout
      if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
        console.log('API health check timed out after 5 seconds');
      } else {
        console.log('API health check network error:', fetchError);
      }
      
      return false;
    }
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}