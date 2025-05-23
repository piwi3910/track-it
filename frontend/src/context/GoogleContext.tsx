import { createContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { api } from '@/api';
import { GoogleCalendarEvent, GoogleDriveFile, Task } from '@/types/task';
import { authService } from '@/services/auth.service';
import { useStore } from '@/hooks/useStore';

export interface GoogleContextType {
  isAuthenticated: boolean;
  authenticating: boolean;
  // Calendar
  calendarSyncing: boolean;
  calendarSynced: boolean;
  calendarEvents: GoogleCalendarEvent[];
  syncCalendar: () => Promise<void>;
  // Tasks
  tasksSyncing: boolean;
  tasksSynced: boolean;
  importGoogleTasks: () => Promise<Task[]>;
  // Drive
  driveSyncing: boolean;
  driveFiles: GoogleDriveFile[];
  fetchDriveFiles: () => Promise<void>;
  // Auth
  authenticate: () => Promise<boolean>;
  logout: () => void;
}

export const GoogleContext = createContext<GoogleContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function GoogleProvider({ children }: { children: ReactNode }) {
  // Get Google store state
  const { google } = useStore();
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    google?.connected || false
  );
  const [authenticating, setAuthenticating] = useState(false);
  
  // Calendar state
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [calendarSynced, setCalendarSynced] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  
  // Tasks state
  const [tasksSyncing, setTasksSyncing] = useState(false);
  const [tasksSynced, setTasksSynced] = useState(false);
  
  // Drive state
  const [driveSyncing, setDriveSyncing] = useState(false);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);

  // Sync state with Zustand store
  useEffect(() => {
    if (google) {
      setIsAuthenticated(google.connected);
      
      // Convert driveFiles from store format to GoogleDriveFile format
      const convertedFiles: GoogleDriveFile[] = google.driveFiles.map(file => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        webViewLink: file.url,
        iconLink: file.iconUrl || `https://drive-thirdparty.googleusercontent.com/16/type/${file.mimeType}`
      }));
      setDriveFiles(convertedFiles);
      
      if (google.lastSyncTime) {
        setCalendarSynced(true);
      }
    }
  }, [google]);
  
  // Handle auth state changes
  useEffect(() => {
    const checkGoogleAuth = async () => {
      try {
        // Only check if google store exists and has the method
        if (google?.getAccountStatus) {
          const response = await google.getAccountStatus();
          if (response?.connected) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } else {
          // Default to not authenticated if no store
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking Google authentication status:', error);
        setIsAuthenticated(false);
      }
    };
    
    // Check auth status on mount
    checkGoogleAuth();
    
    // Listen for auth state changes
    const handleAuthStateChange = () => {
      checkGoogleAuth();
    };
    
    window.addEventListener('auth_state_change', handleAuthStateChange);
    return () => {
      window.removeEventListener('auth_state_change', handleAuthStateChange);
    };
  }, [google]);
  
  // Authenticate with Google
  const authenticate = useCallback(async () => {
    setAuthenticating(true);
    try {
      // Use the Zustand store to handle authentication
      if (google?.link) {
        // In a real implementation, this would get the auth code from Google OAuth
        const authCode = 'dummy-auth-code';
        const result = await google.link(authCode);
        
        if (result) {
          setIsAuthenticated(true);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    } finally {
      setAuthenticating(false);
    }
  }, [google]);
  
  // Sync calendar
  const syncCalendar = useCallback(async () => {
    if (!isAuthenticated) {
      const success = await authenticate();
      if (!success) return;
    }
    
    setCalendarSyncing(true);
    try {
      if (google?.syncCalendar) {
        await google.syncCalendar();
      } else {
        const result = await api.googleIntegration.syncCalendar();
        if (result.error) {
          throw new Error(result.error);
        }
      }
      
      // Fetch calendar events from API
      const { data, error } = await api.googleIntegration.getCalendarEvents();
      
      if (error) {
        throw new Error(error);
      }
      
      setCalendarEvents((data as GoogleCalendarEvent[]) || []);
      setCalendarSynced(true);
    } catch (error) {
      console.error('Calendar sync failed:', error);
    } finally {
      setCalendarSyncing(false);
    }
  }, [isAuthenticated, authenticate, google]);
  
  // Import Google Tasks
  const importGoogleTasks = useCallback(async () => {
    if (!isAuthenticated) {
      const success = await authenticate();
      if (!success) return [];
    }
    
    setTasksSyncing(true);
    try {
      let tasks: Task[] = [];
      
      if (google?.importGoogleTasks) {
        const googleTasks = await google.importGoogleTasks();
        // Map GoogleTasks to Tasks with taskNumber
        tasks = googleTasks.map((gt, index) => ({
          ...gt,
          taskNumber: index + 1,
          source: 'google_tasks' as const
        } as Task));
      } else {
        const response = await api.googleIntegration.importGoogleTasks();
        tasks = (response.data as Task[]) || [];
      }
      
      setTasksSynced(true);
      return tasks || [];
    } catch (error) {
      console.error('Task import failed:', error);
      return [];
    } finally {
      setTasksSyncing(false);
    }
  }, [isAuthenticated, authenticate, google]);
  
  // Fetch Google Drive files
  const fetchDriveFiles = useCallback(async () => {
    if (!isAuthenticated) {
      const success = await authenticate();
      if (!success) return;
    }
    
    setDriveSyncing(true);
    try {
      let files: GoogleDriveFile[] = [];
      
      if (google?.fetchDriveFiles) {
        const storeFiles = await google.fetchDriveFiles();
        // Convert to GoogleDriveFile format
        files = storeFiles.map(file => ({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          webViewLink: file.url,
          iconLink: file.iconUrl || `https://drive-thirdparty.googleusercontent.com/16/type/${file.mimeType}`
        }));
      } else {
        const response = await api.googleIntegration.getGoogleDriveFiles();
        
        // Convert to GoogleDriveFile format
        const apiFiles = response.data as Array<{ id: string; name: string; url: string; mimeType: string; iconUrl?: string }> || [];
        files = apiFiles.map((file) => ({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          webViewLink: file.url,
          iconLink: file.iconUrl || `https://drive-thirdparty.googleusercontent.com/16/type/${file.mimeType}`
        }));
      }
      
      setDriveFiles(files);
    } catch (error) {
      console.error('Drive fetch failed:', error);
    } finally {
      setDriveSyncing(false);
    }
  }, [isAuthenticated, authenticate, google]);
  
  // Log out
  const logout = useCallback(() => {
    authService.logout();
    
    if (google?.unlink) {
      google.unlink();
    }
    
    setIsAuthenticated(false);
    setCalendarSynced(false);
    setTasksSynced(false);
    setCalendarEvents([]);
    setDriveFiles([]);
  }, [google]);
  
  const value: GoogleContextType = {
    isAuthenticated,
    authenticating,
    // Calendar
    calendarSyncing,
    calendarSynced,
    calendarEvents,
    syncCalendar,
    // Tasks
    tasksSyncing,
    tasksSynced,
    importGoogleTasks,
    // Drive
    driveSyncing,
    driveFiles,
    fetchDriveFiles,
    // Auth
    authenticate,
    logout
  };
  
  return (
    <GoogleContext.Provider value={value}>
      {children}
    </GoogleContext.Provider>
  );
}