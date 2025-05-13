import { create } from 'zustand';
import { api } from '@/api';
import { RouterOutputs } from '@track-it/shared';

// @ts-ignore - Ignore type errors for now
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
      
      if (response.error) {
        set({ isLoading: false, error: response.error });
        return [];
      }
      
      const notifications = response.data || [];
      const unreadCount = notifications.filter((n: Notification) => !n.read).length;
      
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
      
      if (response.error) {
        return get().unreadCount;
      }
      
      const count = response.data || 0;
      set({ unreadCount: count });
      
      return count;
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
      return get().unreadCount;
    }
  },
  
  // Mark notification as read
  markAsRead: async (id) => {
    try {
      const response = await api.notifications.markAsRead(id);
      
      if (response.error) {
        set({ error: response.error });
        return false;
      }
      
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
      const response = await api.notifications.markAllAsRead();
      
      if (response.error) {
        set({ error: response.error });
        return false;
      }
      
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
      const response = await api.notifications.delete(id);
      
      if (response.error) {
        set({ error: response.error });
        return false;
      }
      
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

// Initialize notifications when the store is first created
if (typeof window !== 'undefined') {
  // Run after auth is loaded
  setTimeout(() => {
    useNotificationStore.getState().fetchNotifications();
  }, 500);
}