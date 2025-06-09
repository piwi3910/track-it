import { useGoogleStore } from '@/stores/useGoogleStore';
import { api } from '@/api';
import type { GoogleCalendarEvent } from '@/types/task';
import { logger } from '@/services/logger.service';

/**
 * Hook to access Google integration state and actions
 * Now uses Zustand store directly instead of React Context
 */
export function useGoogle() {
  const store = useGoogleStore();
  
  // Return the same interface as the old GoogleContext
  // with additional methods that were in the context
  return {
    // State
    isAuthenticated: store.connected,
    authenticating: store.authenticating,
    connected: store.connected,
    profile: store.profile,
    calendarEvents: store.calendarEvents,
    driveFiles: store.driveFiles,
    lastSyncTime: store.lastSyncTime,
    error: store.error,
    
    // Flags
    calendarSyncing: store.syncingCalendar,
    calendarSynced: !!store.lastSyncTime,
    tasksSyncing: store.syncingTasks,
    tasksSynced: store.tasksSynced,
    driveSyncing: store.syncingDrive,
    
    // Actions from store
    authenticate: store.authenticate,
    disconnect: store.disconnect,
    syncCalendar: store.syncCalendar,
    syncTasks: store.syncTasks,
    syncDrive: store.syncDrive,
    syncAll: store.syncAll,
    checkConnection: store.checkConnection,
    clearError: store.clearError,
    
    // Additional methods that were in the context
    createCalendarEvent: async (event: Partial<GoogleCalendarEvent>) => {
      try {
        const result = await api.google.createEvent(event);
        // Refresh calendar after creating event
        await store.syncCalendar();
        return result;
      } catch (error) {
        logger.error('Failed to create calendar event', error);
        throw error;
      }
    },
    
    updateCalendarEvent: async (eventId: string, updates: Partial<GoogleCalendarEvent>) => {
      try {
        const result = await api.google.updateEvent(eventId, updates);
        // Refresh calendar after updating event
        await store.syncCalendar();
        return result;
      } catch (error) {
        logger.error('Failed to update calendar event', error);
        throw error;
      }
    },
    
    deleteCalendarEvent: async (eventId: string) => {
      try {
        await api.google.deleteEvent(eventId);
        // Refresh calendar after deleting event
        await store.syncCalendar();
      } catch (error) {
        logger.error('Failed to delete calendar event', error);
        throw error;
      }
    },
    
    uploadToDrive: async (file: File, folderId?: string) => {
      try {
        const result = await api.google.uploadFile(file, folderId);
        // Refresh drive files after upload
        await store.syncDrive();
        return result;
      } catch (error) {
        logger.error('Failed to upload to Drive', error);
        throw error;
      }
    },
  };
}