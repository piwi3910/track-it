import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import type { AppRouter } from '@/api/trpc-server-types';
import { QueryClient } from '@tanstack/react-query';

// Create a tRPC client
export const trpc = createTRPCReact<AppRouter>();

// Initialize tRPC react-query client
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_API_URL || 'http://localhost:3001/trpc',
      // Optional: configure request headers
      headers() {
        return {
          Authorization: localStorage.getItem('token')
            ? `Bearer ${localStorage.getItem('token')}`
            : '',
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