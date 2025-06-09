import { useState, useCallback, ReactNode, useEffect, useMemo } from 'react';
import { api } from '@/api';
import { GoogleCalendarEvent, GoogleDriveFile } from '@/types/task';
import { Task, TaskStatus, TaskPriority } from '@track-it/shared/types/trpc';
import { authService } from '@/services/auth.service';
import { useStore } from '@/hooks/useStore';
import { GoogleContext, GoogleContextType } from './GoogleContextDefinition';
import { logger } from '@/services/logger.service';

export { GoogleContext, type GoogleContextType } from './GoogleContextDefinition';
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

  // Sync state with Zustand store - memoize to prevent infinite loops
  const googleConnected = google?.connected ?? false;
  const googleLastSyncTime = google?.lastSyncTime;
  const googleDriveFiles = useMemo(() => google?.driveFiles ?? [], [google?.driveFiles]);
  
  useEffect(() => {
    setIsAuthenticated(googleConnected);
  }, [googleConnected]);
  
  useEffect(() => {
    if (googleLastSyncTime) {
      setCalendarSynced(true);
    }
  }, [googleLastSyncTime]);
  
  // Sync drive files separately to avoid unnecessary re-renders
  useEffect(() => {
    if (googleDriveFiles.length > 0) {
      // Convert driveFiles from store format to GoogleDriveFile format
      const convertedFiles: GoogleDriveFile[] = googleDriveFiles.map(file => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        webViewLink: file.url,
        iconLink: file.iconUrl || `https://drive-thirdparty.googleusercontent.com/16/type/${file.mimeType}`
      }));
      setDriveFiles(convertedFiles);
    }
  }, [googleDriveFiles]);
  
  // Create a stable reference for the auth state change handler
  const handleAuthStateChange = useCallback(() => {
    if (google?.getAccountStatus) {
      google.getAccountStatus()
        .then(response => {
          if (response?.connected) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        })
        .catch(() => {
          // Silently handle auth errors - user is not authenticated
          setIsAuthenticated(false);
        });
    }
  }, [google]);
  
  // Handle auth state changes - run only once on mount
  useEffect(() => {
    // We don't need to check Google auth status here since this is handled
    // by the main auth context. This context is only for Google-specific features.
    // The infinite loop was caused by trying to check auth status repeatedly.
    
    window.addEventListener('auth_state_change', handleAuthStateChange);
    
    return () => {
      window.removeEventListener('auth_state_change', handleAuthStateChange);
    };
  }, [handleAuthStateChange]); // Dependency on the stable callback
  
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
      logger.error('Authentication failed', error);
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
        await api.googleIntegration.syncCalendar();
      }
      
      // Fetch calendar events from API
      const data = await api.googleIntegration.getCalendarEvents();
      
      setCalendarEvents((data as GoogleCalendarEvent[]) || []);
      setCalendarSynced(true);
    } catch (error) {
      logger.error('Calendar sync failed', error);
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
      
      if (google?.importTasks) {
        const googleTasks = await google.importTasks();
        // Map GoogleTasks to Tasks with proper type conversion
        tasks = googleTasks.map((gt, index) => ({
          id: gt.id,
          title: gt.title,
          status: gt.status.toLowerCase() as TaskStatus, // Convert uppercase to lowercase
          priority: gt.priority.toLowerCase() as TaskPriority, // Convert uppercase to lowercase
          dueDate: gt.dueDate || null,
          taskNumber: index + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
          creatorId: '',
          assigneeId: null,
          description: null,
          estimatedHours: null
        } as Task));
      } else {
        const response = await api.googleIntegration.importGoogleTasks();
        tasks = (response || []) as unknown as Task[];
      }
      
      setTasksSynced(true);
      return tasks || [];
    } catch (error) {
      logger.error('Task import failed', error);
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
        const apiFiles = response as Array<{ id: string; name: string; url: string; mimeType: string; iconUrl?: string }> || [];
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
      logger.error('Drive fetch failed', error);
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