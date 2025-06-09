import { useNotificationStore } from '@/stores/useNotificationStore';

/**
 * Hook to access notification state and actions
 * Now uses Zustand store directly instead of React Context
 */
export function useNotifications() {
  const store = useNotificationStore();
  
  // Return the same interface as the old NotificationContext
  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    loading: store.isLoading,
    error: store.error,
    
    // Actions
    fetchNotifications: store.fetchNotifications,
    fetchUnreadCount: store.fetchUnreadCount,
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
    deleteNotification: store.deleteNotification,
    addNotification: store.addNotification,
    clearError: store.clearError,
  };
}