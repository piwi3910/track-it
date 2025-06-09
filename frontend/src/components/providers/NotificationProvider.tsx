import { ReactNode, useEffect } from 'react';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useAuthStore } from '@/stores/useAuthStore';

interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * NotificationProvider - Handles notification initialization
 * 
 * This provider initializes notifications when a user is authenticated.
 * The actual state is managed by the Zustand store.
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  
  useEffect(() => {
    // Fetch notifications when user is authenticated
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);
  
  // Just render children - no context provider needed
  return <>{children}</>;
}