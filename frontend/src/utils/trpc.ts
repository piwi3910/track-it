import { createTRPCReact } from '@trpc/react-query';
import { httpLink } from '@trpc/client';
import type { AppRouter } from '@track-it/shared';
import { QueryClient } from '@tanstack/react-query';

// Create a tRPC client for v11
// @ts-ignore - The AppRouter type doesn't satisfy the constraint, but it works at runtime
export const trpc = createTRPCReact<AppRouter>();

// Initialize tRPC react-query client
export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: import.meta.env.VITE_API_URL || 'http://localhost:3001/trpc',
      // Use httpLink instead of httpBatchLink to avoid batching which seems to be causing issues
      headers() {
        const token = localStorage.getItem('token');

        return {
          // Always include the token if available
          Authorization: token ? `Bearer ${token}` : '',
          // Add custom header to help with CORS issues
          'X-From-Frontend': 'track-it-frontend',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };
      },
      fetch(url, options) {
        // Add debugging for API requests
        console.log(`Making API request to: ${url}`);
        
        // Create AbortController to add timeout for requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        // Ensure content type is set properly
        const headers = options.headers || {};
        
        // Create a new headers object with the correct Content-Type
        const newHeaders = {
          ...headers,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };
        
        return fetch(url, {
          ...options,
          headers: newHeaders,
          credentials: 'include', // Include cookies for authentication
          mode: 'cors', // Ensure CORS mode
          signal: controller.signal, // Add signal for timeout
        }).then(response => {
          // Clear timeout since request completed
          clearTimeout(timeoutId);
          
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