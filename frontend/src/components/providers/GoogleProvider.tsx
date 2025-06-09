import { ReactNode, useEffect } from 'react';
import { useGoogleStore } from '@/stores/useGoogleStore';
import { useAuthStore } from '@/stores/useAuthStore';

interface GoogleProviderProps {
  children: ReactNode;
}

/**
 * GoogleProvider - Handles Google integration initialization
 * 
 * This provider manages Google OAuth state and syncing.
 * The actual state is managed by the Zustand store.
 */
export function GoogleProvider({ children }: GoogleProviderProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { connected, checkConnection } = useGoogleStore();
  
  useEffect(() => {
    // Check Google connection status when user is authenticated
    if (isAuthenticated && !connected) {
      checkConnection();
    }
  }, [isAuthenticated, connected, checkConnection]);
  
  // Just render children - no context provider needed
  return <>{children}</>;
}