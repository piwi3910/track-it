import { createContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { api } from '@/api';
import { GoogleCalendarEvent, GoogleDriveFile, Task } from '@/types/task';
import { authService } from '@/services/auth.service';
import { useStore } from '@/hooks/useStore';

interface GoogleContextType {
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

// Utility function to safely handle API calls with error handling
const apiHandler = async <T,>(apiCall: () => Promise<T>): Promise<{ data: T | null; error: string | null }> => {
  try {
    const response = await apiCall();
    return { data: response, error: null };
  } catch (error) {
    console.error('API error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'API call failed' 
    };
  }
};

const GoogleContext = createContext<GoogleContextType | undefined>(undefined);

export function GoogleProvider({ children }: { children: ReactNode }) {
  // Get Google store state
  const { googleStore } = useStore();
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    googleStore?.connected || false
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
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>(
    googleStore?.driveFiles || []
  );

  // Sync state with Zustand store
  useEffect(() => {
    if (googleStore) {
      setIsAuthenticated(googleStore.connected);
      setDriveFiles(googleStore.driveFiles);
      
      if (googleStore.lastSyncTime) {
        setCalendarSynced(true);
      }
    }
  }, [googleStore]);
  
  // Handle auth state changes
  useEffect(() => {
    const checkGoogleAuth = async () => {
      try {
        // Only check if googleStore exists and has the method
        if (googleStore?.getAccountStatus) {
          const response = await googleStore.getAccountStatus();
          if (response && response.connected) {
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
  }, [googleStore]);
  
  // Authenticate with Google
  const authenticate = useCallback(async () => {
    setAuthenticating(true);
    try {
      // Use the Zustand store to handle authentication
      if (googleStore?.linkAccount) {
        // In a real implementation, this would get the auth code from Google OAuth
        const authCode = 'dummy-auth-code';
        const success = await googleStore.linkAccount(authCode);
        
        if (success) {
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
  }, [googleStore]);
  
  // Sync calendar
  const syncCalendar = useCallback(async () => {
    if (!isAuthenticated) {
      const success = await authenticate();
      if (!success) return;
    }
    
    setCalendarSyncing(true);
    try {
      if (googleStore?.syncCalendar) {
        await googleStore.syncCalendar();
      } else {
        const result = await api.googleIntegration.syncCalendar();
        if (result.error) {
          throw new Error(result.error);
        }
      }
      
      // Fetch calendar events from API
      const { data, error } = await apiHandler(() => 
        api.googleIntegration.getCalendarEvents.query()
      );
      
      if (error) {
        throw new Error(error);
      }
      
      setCalendarEvents(data || []);
      setCalendarSynced(true);
    } catch (error) {
      console.error('Calendar sync failed:', error);
    } finally {
      setCalendarSyncing(false);
    }
  }, [isAuthenticated, authenticate, googleStore]);
  
  // Import Google Tasks
  const importGoogleTasks = useCallback(async () => {
    if (!isAuthenticated) {
      const success = await authenticate();
      if (!success) return [];
    }
    
    setTasksSyncing(true);
    try {
      let tasks: Task[] = [];
      
      if (googleStore?.importGoogleTasks) {
        tasks = await googleStore.importGoogleTasks();
      } else {
        const response = await api.googleIntegration.importGoogleTasks.query();
        tasks = response;
      }
      
      setTasksSynced(true);
      return tasks || [];
    } catch (error) {
      console.error('Task import failed:', error);
      return [];
    } finally {
      setTasksSyncing(false);
    }
  }, [isAuthenticated, authenticate, googleStore]);
  
  // Fetch Google Drive files
  const fetchDriveFiles = useCallback(async () => {
    if (!isAuthenticated) {
      const success = await authenticate();
      if (!success) return;
    }
    
    setDriveSyncing(true);
    try {
      let files: GoogleDriveFile[] = [];
      
      if (googleStore?.fetchDriveFiles) {
        files = await googleStore.fetchDriveFiles();
      } else {
        const response = await api.googleIntegration.getGoogleDriveFiles.query();
        
        // Convert to GoogleDriveFile format
        files = response.map(file => ({
          id: file.id,
          name: file.name,
          mimeType: file.name.endsWith('.docx') || file.name.endsWith('.docs') 
            ? 'application/vnd.google-apps.document'
            : file.name.endsWith('.sheets') 
              ? 'application/vnd.google-apps.spreadsheet'
              : 'application/octet-stream',
          webViewLink: file.url,
          iconLink: `https://drive-thirdparty.googleusercontent.com/16/type/${
            file.name.endsWith('.docx') || file.name.endsWith('.docs') 
              ? 'application/vnd.google-apps.document'
              : file.name.endsWith('.sheets') 
                ? 'application/vnd.google-apps.spreadsheet'
                : 'application/octet-stream'
          }`
        }));
      }
      
      setDriveFiles(files);
    } catch (error) {
      console.error('Drive fetch failed:', error);
    } finally {
      setDriveSyncing(false);
    }
  }, [isAuthenticated, authenticate, googleStore]);
  
  // Log out
  const logout = useCallback(() => {
    authService.logout();
    
    if (googleStore?.unlinkAccount) {
      googleStore.unlinkAccount();
    }
    
    setIsAuthenticated(false);
    setCalendarSynced(false);
    setTasksSynced(false);
    setCalendarEvents([]);
    setDriveFiles([]);
  }, [googleStore]);
  
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