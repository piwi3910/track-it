import { createTRPCReact } from '@trpc/react-query';
import { httpLink } from '@trpc/client';
import type { AppRouter } from '@track-it/shared';
import { QueryClient } from '@tanstack/react-query';

// Function to get the auth token from storage
export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

// Function to set the auth token in storage
export function setAuthToken(token: string): void {
  localStorage.setItem('token', token);
}

// Function to clear the auth token from storage
export function clearAuthToken(): void {
  localStorage.removeItem('token');
}

// Create a tRPC client for v11
// @ts-ignore - The AppRouter type doesn't satisfy the constraint, but it works at runtime
export const trpc = createTRPCReact<AppRouter>();

// Initialize tRPC react-query client
export const trpcClient = trpc.createClient({
  // Explicitly disable batching at the client level
  transformer: undefined,
  // Forced non-batch query behavior
  queryClientConfig: {
    defaultOptions: {
      queries: {
        networkMode: 'always', // Always make network requests
        retry: 2, // Retry failed requests twice
      },
    },
  },
  links: [
    httpLink({
      url: import.meta.env.VITE_API_URL || 'http://localhost:3001/trpc',
      // Use httpLink instead of httpBatchLink to avoid batching which seems to be causing issues
      // Disable batching completely
      batch: false,
      headers() {
        const token = localStorage.getItem('token');

        return {
          // Always include the token if available
          Authorization: token ? `Bearer ${token}` : '',
          // Add custom header to help with CORS issues
          'X-From-Frontend': 'track-it-client',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };
      },
      fetch(url, options) {
        // Add debugging for API requests
        console.log(`Making API request to: ${url}`);
        
        // Log request body for debugging
        if (options.body) {
          console.log('Request body:', options.body);
        }
        
        // Check if URL contains batch parameter and remove it as we're using non-batch mode
        const cleanUrl = url.replace(/[?&]batch=1/g, '');
        if (cleanUrl !== url) {
          console.log(`Cleaned batch parameter from URL: ${cleanUrl}`);
        }
        
        // Create AbortController to add timeout for requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        // Create Headers object for proper header handling and case-insensitivity
        const headers = new Headers();
        
        // First add all existing headers
        if (options.headers) {
          if (options.headers instanceof Headers) {
            // If it's already a Headers object, copy each header
            options.headers.forEach((value, key) => {
              headers.set(key, value);
            });
          } else {
            // If it's a plain object, add each property
            Object.entries(options.headers).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                headers.set(key, value.toString());
              }
            });
          }
        }
        
        // Ensure proper Content-Type for JSON requests
        // Remove any existing content-type headers to avoid duplication
        headers.delete('content-type');
        headers.delete('Content-Type');
        headers.set('Content-Type', 'application/json');
        
        // Set other essential headers
        headers.set('Accept', 'application/json');
        
        // Debug the final headers being sent
        console.log('Request headers:', [...headers.entries()]);
        
        return fetch(cleanUrl, {
          ...options,
          headers, // Use the Headers object
          credentials: 'include', // Include cookies for authentication
          mode: 'cors', // Ensure CORS mode
          signal: controller.signal, // Add signal for timeout
        }).then(response => {
          // Clear timeout since request completed
          clearTimeout(timeoutId);
          
          // Log response details for debugging
          console.log(`API response status: ${response.status}`);
          console.log(`API response URL: ${response.url}`);
          
          if (!response.ok) {
            console.error(`API request failed with status: ${response.status}`);
            
            // Check if it's a 401 Unauthorized - trigger auth error
            if (response.status === 401) {
              const authEvent = new CustomEvent('auth_error');
              window.dispatchEvent(authEvent);
            }
            
            // Check if it's a server error - trigger API availability check
            if (response.status >= 500) {
              const apiCheckEvent = new CustomEvent('check_api_availability');
              window.dispatchEvent(apiCheckEvent);
            }
            
            // Special handling for 400 Bad Request - might be a batch format issue
            if (response.status === 400) {
              console.error('400 Bad Request - This could be a tRPC request format issue');
              // Clone response to inspect body for debugging without consuming it
              response.clone().text().then(text => {
                try {
                  console.error('Response body:', JSON.parse(text));
                } catch (e) {
                  console.error('Response body (not JSON):', text);
                }
              }).catch(e => {
                console.error('Failed to read response body:', e);
              });
            }
          }
          return response;
        }).catch(error => {
          // Clear timeout since request errored
          clearTimeout(timeoutId);
          
          // Special handling for timeout/abort
          if (error instanceof DOMException && error.name === 'AbortError') {
            console.error('API request timed out after 10 seconds');
            // Trigger API availability check
            const apiCheckEvent = new CustomEvent('check_api_availability');
            window.dispatchEvent(apiCheckEvent);
          } else {
            console.error('API request error:', error);
            
            // Structured error event with full details
            const apiErrorEvent = new CustomEvent('api_error', {
              detail: {
                error,
                timestamp: new Date().toISOString(),
                url,
                requestType: options.method || 'GET'
              }
            });
            window.dispatchEvent(apiErrorEvent);
          }
          
          throw error;
        });
      }
    }),
  ],
});

// Create a query client for React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});