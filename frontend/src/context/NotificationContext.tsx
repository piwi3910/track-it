import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

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
      
      // Check if it's a direct function or a tRPC procedure
      if (typeof api.notifications.getAll === 'function') {
        // Mock API style
        const result = await api.notifications.getAll();
        // Safely handle response - check if it's an array before using .map
        if (result && Array.isArray(result)) {
          notifs = result.map(n => ({
            id: n.id,
            userId: 'user1', // Mock the current user
            type: n.type || 'comment', // Use type if available or default
            message: n.message,
            createdAt: n.createdAt,
            read: n.read,
            relatedTaskId: n.relatedTaskId
          }));
        } else {
          console.warn('Notification response is not an array:', result);
          setError({
            message: 'Invalid notification data format',
            timestamp: new Date()
          });
        }
      } else if (api.notifications.getAll) {
        // Real tRPC API style using apiHandler pattern
        const { data, error } = await api.notifications.getAll();
        if (error) {
          console.error('Notification API error:', error);
          setError({
            message: typeof error === 'string' ? error : error.message || 'Failed to fetch notifications',
            code: typeof error === 'object' && error.code ? error.code : undefined,
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
      } else {
        console.error('Notifications API not available');
        setError({
          message: 'Notification service unavailable',
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
      // Handle both real tRPC API and mock API
      if (typeof api.notifications.markAsRead === 'function') {
        // Mock API style
        await api.notifications.markAsRead(id);
      } else if (api.notifications.markAsRead) {
        // Real tRPC API style using apiHandler pattern
        const { error } = await api.notifications.markAsRead(id);
        if (error) {
          console.error('Error marking notification as read:', error);
          setError({
            message: typeof error === 'string' ? error : error.message || 'Failed to mark notification as read',
            code: typeof error === 'object' && error.code ? error.code : undefined,
            timestamp: new Date()
          });
          return; // Exit early on error
        }
      } else {
        console.error('markAsRead API not available');
        setError({
          message: 'Mark as read service unavailable',
          timestamp: new Date()
        });
        return; // Exit early if API not available
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
      // Get current unread notifications to avoid closure issue
      const unreadNotifications = notifications.filter(n => !n.read);
      
      // Handle both real tRPC API and mock API
      if (typeof api.notifications.markAsRead === 'function') {
        // Mock API style
        const promises = unreadNotifications
          .map(n => api.notifications.markAsRead(n.id));
        
        await Promise.all(promises);
      } else if (api.notifications.markAllAsRead) {
        // Real tRPC API style - try to use bulk operation if available
        const { error } = await api.notifications.markAllAsRead();
        if (error) {
          console.error('Error marking all notifications as read:', error);
          setError({
            message: typeof error === 'string' ? error : error.message || 'Failed to mark all notifications as read',
            code: typeof error === 'object' && error.code ? error.code : undefined,
            timestamp: new Date()
          });
          return;
        }
      } else if (api.notifications.markAsRead) {
        // Real tRPC API style - fallback to individual operations
        const promises = unreadNotifications
          .map(n => api.notifications.markAsRead(n.id));
        
        await Promise.all(promises);
      } else {
        console.error('markAllAsRead API not available');
        setError({
          message: 'Mark all as read service unavailable',
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
  }, [notifications]);  // Include notifications as dependency
  
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

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}