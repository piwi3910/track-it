import { createContext } from 'react';
import { Notification } from '@/types/task';

// Define error state type
interface NotificationError {
  message: string;
  code?: string;
  timestamp: Date;
}

export interface NotificationContextType {
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