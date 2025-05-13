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
        };
      },
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