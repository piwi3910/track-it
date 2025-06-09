import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  IconCalendar,
  IconChecklist,
  IconFileDescription,
  IconBrandGoogle,
  IconExternalLink,
  IconDownload,
  IconPlus,
  IconRefresh,
  IconCheck,
  IconAlertCircle,
  IconSettings,
  IconX
} from '@tabler/icons-react';
import { useGoogle } from '@/hooks/useGoogle';;
import { useApp } from '@/hooks/useApp';
import { useStore } from '@/hooks/useStore';
import { notifications } from '@/components/ui/notifications';
import { GoogleCalendarEvent, GoogleDriveFile } from '@/types/task';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

export function GoogleIntegrationPanel() {
  const { google } = useStore();
  const {
    isAuthenticated,
    authenticating,
    authenticate,
    calendarEvents,
    calendarSyncing,
    syncCalendar,
    importGoogleTasks,
    tasksSyncing,
    driveFiles,
    driveSyncing,
    fetchDriveFiles,
    logout: googleLogout
  } = useGoogle();
  const { createTask } = useApp();
  const { renderButton, isGoogleLoaded } = useGoogleAuth();
  
  // Get Google account status
  const [accountStatus, setAccountStatus] = useState<{
    name?: string;
    email?: string;
    picture?: string;
  } | null>(null);
  
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedCalendarEvents, setSelectedCalendarEvents] = useState<string[]>([]);
  const [importingEvents, setImportingEvents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  
  // Sync settings
  const [autoSync, setAutoSync] = useState(true);
  const [calendarSync, setCalendarSync] = useState(true);
  const [tasksSync, setTasksSync] = useState(true);
  const [driveSync, setDriveSync] = useState(false);

  // Fetch Google account status when authenticated
  useEffect(() => {
    const fetchAccountStatus = async () => {
      if (isAuthenticated && google?.getAccountStatus) {
        try {
          const status = await google.getAccountStatus();
          if (status) {
            setAccountStatus({
              email: status.email
            });
          }
        } catch (error) {
          console.error('Failed to fetch Google account status:', error);
        }
      }
    };
    
    fetchAccountStatus();
  }, [isAuthenticated, google]);
  
  // Render Google Sign-in button if not authenticated
  useEffect(() => {
    if (!isAuthenticated && isGoogleLoaded && googleButtonRef.current) {
      renderButton('google-signin-button');
    }
  }, [isAuthenticated, isGoogleLoaded, renderButton]);

  // Handle authentication
  const handleAuth = async () => {
    setError(null);
    try {
      await authenticate();
      notifications.show({
        title: 'Successfully connected',
        message: 'Your Google account has been connected successfully',
        color: 'green'
      });
    } catch (err) {
      console.error('Authentication failed:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  // Handle disconnecting account
  const handleDisconnect = async () => {
    setError(null);
    try {
      // Disconnect Google account both in store and context
      if (google?.unlink) {
        await google.unlink();
      }
      googleLogout();
      
      notifications.show({
        title: 'Account disconnected',
        message: 'Your Google account has been disconnected',
        color: 'blue'
      });
    } catch (err) {
      console.error('Failed to disconnect Google account:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect account');
    }
  };

  // Handle calendar sync
  const handleSyncCalendar = async () => {
    setError(null);
    try {
      await syncCalendar();
      notifications.show({
        title: 'Calendar synced',
        message: 'Your Google Calendar has been synced successfully',
        color: 'green'
      });
    } catch (err) {
      console.error('Calendar sync failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync calendar');
    }
  };

  // Handle import tasks
  const handleImportTasks = async () => {
    setError(null);
    try {
      const importedTasks = await importGoogleTasks();
      notifications.show({
        title: 'Tasks imported',
        message: `${importedTasks.length} tasks imported from Google Tasks`,
        color: 'green'
      });
    } catch (err) {
      console.error('Failed to import tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to import tasks');
    }
  };

  // Handle fetch Drive files
  const handleFetchDriveFiles = async () => {
    setError(null);
    try {
      await fetchDriveFiles();
      notifications.show({
        title: 'Drive files fetched',
        message: 'Your Google Drive files have been fetched successfully',
        color: 'green'
      });
    } catch (err) {
      console.error('Failed to fetch Drive files:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Drive files');
    }
  };

  // Toggle calendar event selection
  const toggleEventSelection = (eventId: string) => {
    setSelectedCalendarEvents(prev => 
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  // Import selected calendar events as tasks
  const importSelectedEvents = async () => {
    if (selectedCalendarEvents.length === 0) return;
    
    setImportingEvents(true);
    setError(null);
    try {
      // Create tasks from selected events
      const eventsToImport = calendarEvents.filter(event => 
        selectedCalendarEvents.includes(event.id)
      );
      
      for (const event of eventsToImport) {
        await createTask({
          title: event.title,
          description: `${event.description || ''}\n\nFrom Google Calendar: ${event.link}`,
          status: 'todo',
          priority: 'medium',
          dueDate: new Date(event.start).toISOString().split('T')[0],
          tags: ['calendar', 'imported']
        });
      }
      
      notifications.show({
        title: 'Events imported',
        message: `${selectedCalendarEvents.length} events imported as tasks`,
        color: 'green'
      });
      
      // Clear selection
      setSelectedCalendarEvents([]);
    } catch (err) {
      console.error('Failed to import events:', err);
      setError(err instanceof Error ? err.message : 'Failed to import events');
      notifications.show({
        title: 'Import failed',
        message: 'Failed to import calendar events',
        color: 'red'
      });
    } finally {
      setImportingEvents(false);
    }
  };

  // Settings section if authenticated
  const renderSettings = () => (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage 
            src={accountStatus?.picture || 
              `https://ui-avatars.com/api/?name=${encodeURIComponent(google?.email || 'User')}&background=random`
            } 
            alt="User avatar"
          />
          <AvatarFallback className="bg-red-100 dark:bg-red-900">
            {(accountStatus?.name || google?.email || 'U').charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-0">
          <p className="font-medium">{accountStatus?.name || 'Connected to Google'}</p>
          <p className="text-sm text-muted-foreground">{accountStatus?.email || google?.email || 'Google account connected'}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleDisconnect}
          className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          Disconnect
        </Button>
      </div>
      
      <Separator className="my-4" />
      <div className="text-center">
        <Label className="text-sm font-medium">Sync Settings</Label>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Auto-sync</p>
            <p className="text-xs text-muted-foreground">Automatically sync data when changes occur</p>
          </div>
          <Switch 
            id="auto-sync"
            checked={autoSync} 
            onCheckedChange={setAutoSync} 
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Calendar</p>
            <p className="text-xs text-muted-foreground">Sync Google Calendar events</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              id="calendar-sync"
              checked={calendarSync} 
              onCheckedChange={setCalendarSync} 
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Tasks</p>
            <p className="text-xs text-muted-foreground">Sync Google Tasks</p>
          </div>
          <Switch 
            id="tasks-sync"
            checked={tasksSync} 
            onCheckedChange={setTasksSync} 
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Drive</p>
            <p className="text-xs text-muted-foreground">Access Google Drive files</p>
          </div>
          <Switch 
            id="drive-sync"
            checked={driveSync} 
            onCheckedChange={setDriveSync} 
          />
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-xs text-muted-foreground text-center">
          Last synced: {google?.lastSyncTime ? 
            new Date(google.lastSyncTime).toLocaleString() : 
            'Never'
          }
        </p>
      </div>
    </div>
  );

  return (
    <Card>
      <CardContent className="p-6">
      {error && (
        <Alert variant="destructive" className="relative mb-4">
          <IconAlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <button
            onClick={() => setError(null)}
            className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <IconX className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </Alert>
      )}
    
      {!isAuthenticated ? (
        <div className="flex flex-col items-center gap-6">
          <Avatar className="h-20 w-20 bg-red-100 dark:bg-red-900">
            <AvatarFallback className="bg-red-100 dark:bg-red-900">
              <IconBrandGoogle size={40} className="text-red-600 dark:text-red-400" />
            </AvatarFallback>
          </Avatar>
          <h3 className="text-xl font-semibold">Connect your Google account</h3>
          <p className="text-center text-muted-foreground max-w-md">
            Connect your Google account to sync your calendar, tasks, and documents.
            This allows you to view and import data from Google services directly into Track-It.
          </p>
          
          {/* Legacy button */}
          <Button 
            variant="destructive" 
            onClick={handleAuth}
            disabled={authenticating}
          >
            <IconBrandGoogle size={16} className="mr-2" />
            {authenticating ? 'Connecting...' : 'Connect with Google'}
          </Button>
          
          {/* Google Identity Services button */}
          <div 
            id="google-signin-button" 
            ref={googleButtonRef}
            style={{ 
              display: 'flex', 
              justifyContent: 'center',
              marginTop: '8px' 
            }}
          />
        </div>
      ) : (
        <>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="mb-8">
            <TabsList>
              <TabsTrigger value="calendar">
                <IconCalendar className="mr-2 h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="tasks">
                <IconChecklist className="mr-2 h-4 w-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="drive">
                <IconFileDescription className="mr-2 h-4 w-4" />
                Drive
              </TabsTrigger>
              <TabsTrigger value="settings">
                <IconSettings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <TabsContent value="settings">
            {renderSettings()}
          </TabsContent>
          
          <TabsContent value="calendar" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Google Calendar</h3>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline"
                    onClick={handleSyncCalendar}
                    disabled={calendarSyncing}
                  >
                    <IconRefresh size={16} className="mr-2" />
                    {calendarSyncing ? 'Syncing...' : 'Sync Calendar'}
                  </Button>
                  <Button 
                    disabled={selectedCalendarEvents.length === 0 || calendarEvents.length === 0 || importingEvents}
                    onClick={importSelectedEvents}
                  >
                    <IconDownload size={16} className="mr-2" />
                    {importingEvents ? 'Importing...' : `Import Selected (${selectedCalendarEvents.length})`}
                  </Button>
                </div>
              </div>
              
              {calendarSyncing ? (
                <div className="flex flex-col items-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                  <p className="text-muted-foreground mt-4">Syncing your calendar...</p>
                </div>
              ) : calendarEvents.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <p className="text-muted-foreground">No calendar events found. Sync your calendar to see events.</p>
                  <Button 
                    variant="secondary"
                    onClick={handleSyncCalendar}
                    className="mt-4"
                  >
                    <IconRefresh size={16} className="mr-2" />
                    Sync Now
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {calendarEvents.map(event => (
                      <CalendarEventCard 
                        key={event.id}
                        event={event}
                        selected={selectedCalendarEvents.includes(event.id)}
                        onToggleSelect={() => toggleEventSelection(event.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="tasks" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Google Tasks</h3>
                <Button
                  onClick={handleImportTasks}
                  disabled={tasksSyncing}
                >
                  <IconDownload size={16} className="mr-2" />
                  {tasksSyncing ? 'Importing...' : 'Import Tasks'}
                </Button>
              </div>
              
              {tasksSyncing ? (
                <div className="flex flex-col items-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                  <p className="text-muted-foreground mt-4">Importing your tasks...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-12">
                  <IconChecklist size={48} className="opacity-50" stroke={1.5} />
                  <h4 className="text-lg font-semibold">Import Tasks from Google</h4>
                  <p className="text-muted-foreground text-center max-w-[500px]">
                    Click the Import button to fetch and import your tasks from Google Tasks.
                    They will be added to your project with the appropriate status and due dates.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <IconCheck size={16} className="text-green-600" />
                      Maintains task titles and descriptions
                    </li>
                    <li className="flex items-center gap-2">
                      <IconCheck size={16} className="text-green-600" />
                      Preserves due dates when available
                    </li>
                    <li className="flex items-center gap-2">
                      <IconCheck size={16} className="text-green-600" />
                      Tasks are tagged with 'google' for easy identification
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="drive" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Google Drive</h3>
                <Button
                  variant="outline"
                  onClick={handleFetchDriveFiles}
                  disabled={driveSyncing}
                >
                  <IconRefresh size={16} className="mr-2" />
                  {driveSyncing ? 'Fetching...' : 'Fetch Files'}
                </Button>
              </div>
              
              {driveSyncing ? (
                <div className="flex flex-col items-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                  <p className="text-muted-foreground mt-4">Fetching your files...</p>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <p className="text-muted-foreground">No files found. Fetch your files to see them here.</p>
                  <Button 
                    variant="secondary"
                    onClick={handleFetchDriveFiles}
                    className="mt-4"
                  >
                    <IconRefresh size={16} className="mr-2" />
                    Fetch Now
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {driveFiles.map(file => (
                      <DriveFileCard key={file.id} file={file} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
        </>
      )}
    </CardContent>
    </Card>
  );
}

// Calendar Event Card component
function CalendarEventCard({ 
  event, 
  selected, 
  onToggleSelect 
}: { 
  event: GoogleCalendarEvent; 
  selected: boolean; 
  onToggleSelect: () => void; 
}) {
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  
  const formattedDate = startDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  
  const formattedStartTime = startDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const formattedEndTime = endDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant={selected ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8"
              onClick={onToggleSelect}
            >
              {selected ? <IconCheck size={16} /> : <IconPlus size={16} />}
            </Button>
            <div>
              <p className="font-medium">{event.title}</p>
              <p className="text-xs text-muted-foreground">
                {formattedDate} • {formattedStartTime} - {formattedEndTime}
              </p>
              {event.location && (
                <p className="text-xs text-muted-foreground">
                  {event.location}
                </p>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            asChild
          >
            <a 
              href={event.link} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <IconExternalLink size={16} />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Drive File Card component
function DriveFileCard({ file }: { file: GoogleDriveFile }) {
  const getFileIcon = () => {
    if (file.mimeType.includes('document')) {
      return 'https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_document_x32.png';
    } else if (file.mimeType.includes('spreadsheet')) {
      return 'https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_spreadsheet_x32.png';
    } else {
      return 'https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_generic_x32.png';
    }
  };
  
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <img src={getFileIcon()} width={24} height={24} alt="File icon" />
          <div className="flex-1">
            <p className="font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {file.mimeType.split('/').pop()}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            asChild
          >
            <a 
              href={file.webViewLink} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <IconExternalLink size={16} />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}