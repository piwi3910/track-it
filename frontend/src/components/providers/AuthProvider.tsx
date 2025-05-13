import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Auth provider component that loads the current user
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { loadUser, isAuthenticated } = useAuthStore();
  
  // Load user on mount if token exists
  useEffect(() => {
    if (isAuthenticated) {
      loadUser();
    }
  }, [loadUser, isAuthenticated]);
  
  // Also listen for storage events (token changes in other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        loadUser();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadUser]);
  
  return <>{children}</>;
}