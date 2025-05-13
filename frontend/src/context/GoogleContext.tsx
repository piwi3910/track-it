import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { api } from '@/api';
import { GoogleCalendarEvent, GoogleDriveFile, Task } from '@/types/task';

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

const GoogleContext = createContext<GoogleContextType | undefined>(undefined);

export function GoogleProvider({ children }: { children: ReactNode }) {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
  
  // Authenticate with Google
  const authenticate = useCallback(async () => {
    setAuthenticating(true);
    try {
      // In a real implementation, this would redirect to Google OAuth
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    } finally {
      setAuthenticating(false);
    }
  }, []);
  
  // Sync calendar
  const syncCalendar = useCallback(async () => {
    if (!isAuthenticated) {
      await authenticate();
    }
    
    setCalendarSyncing(true);
    try {
      await api.googleIntegration.syncCalendar();
      
      // Mock calendar events
      const today = new Date();
      const events: GoogleCalendarEvent[] = [
        {
          id: 'event1',
          title: 'Team Meeting',
          description: 'Weekly team sync',
          start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0).toISOString(),
          location: 'Conference Room A',
          link: 'https://meet.google.com/abc-defg-hij'
        },
        {
          id: 'event2',
          title: 'Project Review',
          description: 'Review project progress with stakeholders',
          start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 14, 0).toISOString(),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 15, 30).toISOString(),
          location: 'Virtual',
          link: 'https://meet.google.com/xyz-abcd-efg'
        },
        {
          id: 'event3',
          title: 'Sprint Planning',
          description: 'Plan tasks for next sprint',
          start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 9, 0).toISOString(),
          end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 11, 0).toISOString(),
          location: 'Conference Room B',
          link: 'https://meet.google.com/123-456-789'
        }
      ];
      
      setCalendarEvents(events);
      setCalendarSynced(true);
    } catch (error) {
      console.error('Calendar sync failed:', error);
    } finally {
      setCalendarSyncing(false);
    }
  }, [isAuthenticated, authenticate]);
  
  // Import Google Tasks
  const importGoogleTasks = useCallback(async () => {
    if (!isAuthenticated) {
      await authenticate();
    }
    
    setTasksSyncing(true);
    try {
      const { data, error } = await apiHandler(() => api.googleIntegration.importGoogleTasks());
      if (error) {
        throw new Error(error);
      }
      
      setTasksSynced(true);
      return data || [];
    } catch (error) {
      console.error('Task import failed:', error);
      return [];
    } finally {
      setTasksSyncing(false);
    }
  }, [isAuthenticated, authenticate]);
  
  // Fetch Google Drive files
  const fetchDriveFiles = useCallback(async () => {
    if (!isAuthenticated) {
      await authenticate();
    }
    
    setDriveSyncing(true);
    try {
      const response = await api.googleIntegration.getGoogleDriveFiles();
      
      // Convert to GoogleDriveFile format
      const files: GoogleDriveFile[] = response.map(file => ({
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
      
      setDriveFiles(files);
    } catch (error) {
      console.error('Drive fetch failed:', error);
    } finally {
      setDriveSyncing(false);
    }
  }, [isAuthenticated, authenticate]);
  
  // Log out
  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCalendarSynced(false);
    setTasksSynced(false);
    setCalendarEvents([]);
    setDriveFiles([]);
  }, []);
  
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

export function useGoogle() {
  const context = useContext(GoogleContext);
  if (context === undefined) {
    throw new Error('useGoogle must be used within a GoogleProvider');
  }
  return context;
}