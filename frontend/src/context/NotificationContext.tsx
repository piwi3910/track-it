import { useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/api';
import { Notification } from '@/types/task';
import { NotificationContext } from './NotificationContextDefinition';
import { authService } from '@/services/auth.service';

export { NotificationContext, type NotificationContextType } from './NotificationContextDefinition';

// Define error state type
interface NotificationError {
  message: string;
  code?: string;
  timestamp: Date;
}
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<NotificationError | null>(null);
  
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Handle both real tRPC API and mock API
      let notifs: Notification[] = [];
      
      // Modern tRPC API call
      const data = await api.notifications.getAll();
      if (data && Array.isArray(data)) {
        notifs = data as unknown as Notification[];
      } else {
        console.warn('Notification data is not an array:', data);
        setError({
          message: 'Invalid notification data format',
          timestamp: new Date()
        });
      }
      
      setNotifications(notifs);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setError({
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date()
      });
    } finally {
      setLoading(false);
    }
  }, []);  // No dependencies as this function doesn't rely on state
  
  // Fetch notifications on mount only if authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      fetchNotifications();
    }
  }, [fetchNotifications]);
  
  // Mark a notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      setError(null);
      // Modern tRPC API call
      await api.notifications.markAsRead(id);
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      setError({
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date()
      });
    }
  }, []);  // No dependencies needed
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      setError(null);
      
      // Modern tRPC API call
      await api.notifications.markAllAsRead();
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      setError({
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date()
      });
    }
  }, []);  // Don't include notifications as it's updated by setNotifications
  
  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearError
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}