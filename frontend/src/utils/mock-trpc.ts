// Mock version of trpc.ts that doesn't use real tRPC
import { QueryClient } from '@tanstack/react-query';

// Create a mock tRPC instance with the minimal implementation needed
export const trpc = {
  // Stub the Provider component to avoid runtime errors
  Provider: ({ children }: { children: React.ReactNode }) => children
};

// Create a client that's just a placeholder
export const trpcClient = {
  // This will never be called in our mock implementation
  request: () => Promise.resolve({ result: { data: null } })
};

// Create a query client for React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});