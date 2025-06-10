import { create } from 'zustand';
import { api } from '@/api';
import type { RouterOutputs } from '@track-it/shared';
import { logger } from '@/services/logger.service';

type Notification = RouterOutputs['notifications']['getAll'][0];

interface NotificationState {
  // Notifications data
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: () => Promise<Notification[]>;
  fetchUnreadCount: () => Promise<number>;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
  addNotification: (notification: Notification) => void;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  
  // Fetch all notifications
  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.notifications.getAll();
      
      const notifications = response as Array<{
        id: string;
        userId: string;
        type: string;
        title: string;
        message: string;
        read: boolean;
        data?: { taskId?: string; commentId?: string; userId?: string; url?: string; };
        createdAt: string;
      }>;
      const unreadCount = notifications.filter((n) => !n.read).length;
      
      set({ 
        notifications, 
        unreadCount,
        isLoading: false 
      });
      
      return notifications;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      set({ isLoading: false, error: errorMessage });
      return [];
    }
  },
  
  // Fetch unread count
  fetchUnreadCount: async () => {
    try {
      const response = await api.notifications.getUnreadCount();
      
      const count = response as number;
      set({ unreadCount: count });
      
      return count;
    } catch (err) {
      logger.error('Failed to fetch unread count:', err);
      return get().unreadCount;
    }
  },
  
  // Mark notification as read
  markAsRead: async (id) => {
    try {
      await api.notifications.markAsRead(id);
      
      // Update notification in the store
      set(state => {
        const updatedNotifications = state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        );
        
        const newUnreadCount = updatedNotifications.filter(n => !n.read).length;
        
        return {
          notifications: updatedNotifications,
          unreadCount: newUnreadCount
        };
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read';
      set({ error: errorMessage });
      return false;
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      await api.notifications.markAllAsRead();
      
      // Update all notifications in the store
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
      set({ error: errorMessage });
      return false;
    }
  },
  
  // Delete a notification
  deleteNotification: async (id) => {
    try {
      await api.notifications.delete();
      
      // Remove notification from the store
      set(state => {
        const wasUnread = state.notifications.find(n => n.id === id && !n.read);
        const filteredNotifications = state.notifications.filter(n => n.id !== id);
        
        return {
          notifications: filteredNotifications,
          unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount
        };
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete notification';
      set({ error: errorMessage });
      return false;
    }
  },
  
  // Add a new notification (used for local notifications and real-time updates)
  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1
    }));
  },
  
  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));

// Don't automatically initialize - let components decide when to fetch
// This prevents unauthorized API calls on app startup