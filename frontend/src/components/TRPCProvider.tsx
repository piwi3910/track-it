/**
 * tRPC Provider Component
 * Wraps the app with tRPC and React Query providers
 */

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { trpc, queryClient, createTRPCClientConfig } from '@/lib/trpc';

interface TRPCProviderProps {
  children: React.ReactNode;
}

export function TRPCProvider({ children }: TRPCProviderProps) {
  // Create tRPC client
  const trpcClient = React.useMemo(() => 
    trpc.createClient(createTRPCClientConfig()), 
    []
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}