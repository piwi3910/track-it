import { createContext } from 'react';
import { Task } from '@track-it/shared';
import { GoogleCalendarEvent, GoogleDriveFile } from '@/types/task';

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