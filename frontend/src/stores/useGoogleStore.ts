import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/api';
import type { RouterOutputs } from '@track-it/shared';

type GoogleAccountStatus = RouterOutputs['googleIntegration']['getGoogleAccountStatus'];
type GoogleDriveFile = RouterOutputs['googleIntegration']['getGoogleDriveFiles'][0];
type GoogleTask = RouterOutputs['googleIntegration']['importGoogleTasks'][0];

interface GoogleState {
  // Status
  connected: boolean;
  connectedEmail: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Data
  driveFiles: GoogleDriveFile[];
  googleTasks: GoogleTask[];
  
  // Calendar sync
  lastSyncTime: Date | null;
  syncInProgress: boolean;
  
  // Actions
  getAccountStatus: () => Promise<GoogleAccountStatus | null>;
  linkAccount: (authCode: string) => Promise<boolean>;
  unlinkAccount: () => Promise<boolean>;
  fetchDriveFiles: () => Promise<GoogleDriveFile[]>;
  importGoogleTasks: () => Promise<GoogleTask[]>;
  syncCalendar: () => Promise<boolean>;
  clearError: () => void;
}

export const useGoogleStore = create<GoogleState>()(
  persist(
    (set, get) => ({
      // Initial state
      connected: false,
      connectedEmail: null,
      isLoading: false,
      error: null,
      driveFiles: [],
      googleTasks: [],
      lastSyncTime: null,
      syncInProgress: false,
      
      // Get Google account status
      getAccountStatus: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.googleIntegration.getGoogleAccountStatus();
          
          if (response.error) {
            set({ 
              isLoading: false, 
              error: response.error,
              connected: false,
              connectedEmail: null
            });
            return null;
          }
          
          const status = response.data;
          
          set({ 
            connected: status.connected,
            connectedEmail: status.email || null,
            isLoading: false
          });
          
          return status;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to get Google account status';
          set({ 
            isLoading: false, 
            error: errorMessage,
            connected: false
          });
          return null;
        }
      },
      
      // Link Google account
      linkAccount: async (authCode) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.googleIntegration.linkGoogleAccount(authCode);
          
          if (response.error) {
            set({ isLoading: false, error: response.error });
            return false;
          }
          
          // Refresh account status after linking
          await get().getAccountStatus();
          
          return true;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to link Google account';
          set({ isLoading: false, error: errorMessage });
          return false;
        }
      },
      
      // Unlink Google account
      unlinkAccount: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.googleIntegration.unlinkGoogleAccount();
          
          if (response.error) {
            set({ isLoading: false, error: response.error });
            return false;
          }
          
          set({ 
            connected: false,
            connectedEmail: null,
            driveFiles: [],
            googleTasks: [],
            isLoading: false
          });
          
          return true;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to unlink Google account';
          set({ isLoading: false, error: errorMessage });
          return false;
        }
      },
      
      // Fetch Google Drive files
      fetchDriveFiles: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.googleIntegration.getGoogleDriveFiles();
          
          if (response.error) {
            set({ isLoading: false, error: response.error });
            return [];
          }
          
          const files = response.data || [];
          set({ driveFiles: files, isLoading: false });
          
          return files;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Drive files';
          set({ isLoading: false, error: errorMessage });
          return [];
        }
      },
      
      // Import Google Tasks
      importGoogleTasks: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.googleIntegration.importGoogleTasks();
          
          if (response.error) {
            set({ isLoading: false, error: response.error });
            return [];
          }
          
          const tasks = response.data || [];
          set({ googleTasks: tasks, isLoading: false });
          
          return tasks;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to import Google Tasks';
          set({ isLoading: false, error: errorMessage });
          return [];
        }
      },
      
      // Sync with Google Calendar
      syncCalendar: async () => {
        set({ syncInProgress: true, error: null });
        
        try {
          const response = await api.googleIntegration.syncCalendar();
          
          if (response.error) {
            set({ syncInProgress: false, error: response.error });
            return false;
          }
          
          set({ 
            lastSyncTime: new Date(),
            syncInProgress: false
          });
          
          return true;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to sync with Google Calendar';
          set({ syncInProgress: false, error: errorMessage });
          return false;
        }
      },
      
      // Clear error
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'track-it-google',
      version: 1,
      partialize: (state) => ({
        // Only persist connection status and last sync time
        connected: state.connected,
        connectedEmail: state.connectedEmail,
        lastSyncTime: state.lastSyncTime
      })
    }
  )
);

// Initialize Google status when the store is first created
if (typeof window !== 'undefined') {
  // Wait for auth to be loaded first
  setTimeout(() => {
    useGoogleStore.getState().getAccountStatus();
  }, 1000);
}