import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/api';
import { Notification } from '@/types/task';

// Define error state type
interface NotificationError {
  message: string;
  code?: string;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: NotificationError | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearError: () => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
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
      
      // Real tRPC API style using apiHandler pattern
      const { data, error } = await api.notifications.getAll();
      if (error) {
        console.error('Notification API error:', error);
        setError({
          message: typeof error === 'string' ? error : (error as Error)?.message || 'Failed to fetch notifications',
          code: typeof error === 'object' && error ? (error as { code?: string }).code : undefined,
          timestamp: new Date()
        });
      } else if (data && Array.isArray(data)) {
        notifs = data;
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
  
  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
  // Mark a notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      setError(null);
      // Real tRPC API style using apiHandler pattern
      const { error } = await api.notifications.markAsRead(id);
      if (error) {
        console.error('Error marking notification as read:', error);
        setError({
          message: typeof error === 'string' ? error : (error as Error)?.message || 'Failed to mark notification as read',
          code: typeof error === 'object' && error ? (error as { code?: string }).code : undefined,
          timestamp: new Date()
        });
        return; // Exit early on error
      }
      
      // Only update local state if API call was successful
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
      
      // Real tRPC API style - use bulk operation
      const { error } = await api.notifications.markAllAsRead();
      if (error) {
        console.error('Error marking all notifications as read:', error);
        setError({
          message: typeof error === 'string' ? error : (error as Error)?.message || 'Failed to mark all notifications as read',
          code: typeof error === 'object' && error ? (error as { code?: string }).code : undefined,
          timestamp: new Date()
        });
        return;
      }
      
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