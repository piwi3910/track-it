import { ReactNode } from 'react';
import { NotificationProvider as BaseNotificationProvider } from '@/context/NotificationContext';

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  return <BaseNotificationProvider>{children}</BaseNotificationProvider>;
}