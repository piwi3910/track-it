// Export all stores
export { useThemeStore } from './useThemeStore';
export { useApiStore } from './useApiStore';
export { useAuthStore } from './useAuthStore';
export { useTaskStore } from './useTaskStore';
export { useTemplateStore } from './useTemplateStore';
export { useNotificationStore } from './useNotificationStore';
export { useGoogleStore } from './useGoogleStore';

// Export the unified app store from hooks
export { useAppStore } from '@/hooks/useAppStore';

// Types
export type { Task, TaskFilter, Template, Notification, User } from './types';

// Re-export from shared for consistency
export { type RouterInputs, type RouterOutputs } from '@track-it/shared';