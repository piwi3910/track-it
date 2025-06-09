import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  IconCalendar,
  IconChecklist,
  IconFileDescription,
  IconBrandGoogle,
  IconExternalLink,
  IconDownload,
  IconPlus,
  IconRefresh,
  IconCheck
} from '@tabler/icons-react';
import { useGoogle } from '@/hooks/useGoogle';;
import { useApp } from '@/hooks/useApp';
import { notifications } from '@/components/ui/notifications';
import { GoogleCalendarEvent, GoogleDriveFile } from '@/types/task';

export function GoogleIntegrationPage() {
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
    fetchDriveFiles
  } = useGoogle();

  const { createTask } = useApp();
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedCalendarEvents, setSelectedCalendarEvents] = useState<string[]>([]);
  const [importingEvents, setImportingEvents] = useState(false);

  // Handle authentication
  const handleAuth = async () => {
    await authenticate();
    notifications.show({
      title: 'Successfully connected',
      message: 'Your Google account has been connected successfully',
      color: 'green'
    });
  };

  // Handle calendar sync
  const handleSyncCalendar = async () => {
    await syncCalendar();
    notifications.show({
      title: 'Calendar synced',
      message: 'Your Google Calendar has been synced successfully',
      color: 'green'
    });
  };

  // Handle import tasks
  const handleImportTasks = async () => {
    const importedTasks = await importGoogleTasks();
    notifications.show({
      title: 'Tasks imported',
      message: `${importedTasks.length} tasks imported from Google Tasks`,
      color: 'green'
    });
  };

  // Handle fetch Drive files
  const handleFetchDriveFiles = async () => {
    await fetchDriveFiles();
    notifications.show({
      title: 'Drive files fetched',
      message: 'Your Google Drive files have been fetched successfully',
      color: 'green'
    });
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
    } catch (error) {
      console.error('Failed to import events:', error);
      notifications.show({
        title: 'Import failed',
        message: 'Failed to import calendar events',
        color: 'red'
      });
    } finally {
      setImportingEvents(false);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Google Integration</h1>
      
      {!isAuthenticated ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-red-100 text-red-600">
                  <IconBrandGoogle size={40} />
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">Connect your Google account</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Connect your Google account to sync your calendar, tasks, and documents.
                This allows you to view and import data from Google services directly into Track-It.
              </p>
              <Button 
                className="bg-red-600 hover:bg-red-700"
                onClick={handleAuth}
                disabled={authenticating}
              >
                <IconBrandGoogle size={16} className="mr-2 h-4 w-4" />
                {authenticating ? 'Connecting...' : 'Connect with Google'}
              </Button>
            </div>
          </CardContent>
        </Card>
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
            </TabsList>
          </Tabs>
          
          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Google Calendar</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={handleSyncCalendar}
                      disabled={calendarSyncing}
                    >
                      <IconRefresh size={16} className="mr-2 h-4 w-4" />
                      {calendarSyncing ? 'Syncing...' : 'Sync Calendar'}
                    </Button>
                    <Button 
                      disabled={selectedCalendarEvents.length === 0 || calendarEvents.length === 0 || importingEvents}
                      onClick={importSelectedEvents}
                    >
                      <IconDownload size={16} className="mr-2 h-4 w-4" />
                      {importingEvents ? 'Importing...' : `Import Selected (${selectedCalendarEvents.length})`}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {calendarSyncing ? (
                  <div className="flex flex-col items-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    <p className="text-muted-foreground mt-2">Syncing your calendar...</p>
                  </div>
                ) : calendarEvents.length === 0 ? (
                  <div className="flex flex-col items-center py-8">
                    <p className="text-muted-foreground">No calendar events found. Sync your calendar to see events.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
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
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Google Tasks</CardTitle>
                  <Button 
                    onClick={handleImportTasks}
                    disabled={tasksSyncing}
                  >
                    <IconDownload size={16} className="mr-2 h-4 w-4" />
                    {tasksSyncing ? 'Importing...' : 'Import Tasks'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tasksSyncing ? (
                  <div className="flex flex-col items-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    <p className="text-muted-foreground mt-2">Importing your tasks...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <IconChecklist size={48} className="opacity-50" strokeWidth={1.5} />
                    <h4 className="text-lg font-semibold">Import Tasks from Google</h4>
                    <p className="text-muted-foreground text-center max-w-lg">
                      Click the Import button to fetch and import your tasks from Google Tasks.
                      They will be added to your project with the appropriate status and due dates.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Maintains task titles and descriptions</li>
                      <li>• Preserves due dates when available</li>
                      <li>• Tasks are tagged with 'google' for easy identification</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="drive">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Google Drive</CardTitle>
                  <Button
                    variant="outline"
                    onClick={handleFetchDriveFiles}
                    disabled={driveSyncing}
                  >
                    <IconRefresh size={16} className="mr-2 h-4 w-4" />
                    {driveSyncing ? 'Fetching...' : 'Fetch Files'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {driveSyncing ? (
                  <div className="flex flex-col items-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    <p className="text-muted-foreground mt-2">Fetching your files...</p>
                  </div>
                ) : driveFiles.length === 0 ? (
                  <div className="flex flex-col items-center py-8">
                    <p className="text-muted-foreground">No files found. Fetch your files to see them here.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {driveFiles.map(file => (
                        <DriveFileCard key={file.id} file={file} />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </>
      )}
    </div>
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
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant={selected ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
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
          size="sm"
          className="h-8 w-8 p-0"
          asChild
        >
          <a href={event.link} target="_blank" rel="noopener noreferrer">
            <IconExternalLink size={16} />
          </a>
        </Button>
      </div>
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
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <img src={getFileIcon()} width={24} height={24} alt="File icon" />
        <div className="flex-1">
          <p className="font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {file.mimeType.split('/').pop()}
          </p>
        </div>
        <Button 
          size="sm"
          variant="ghost" 
          className="h-8 w-8 p-0"
          asChild
        >
          <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
            <IconExternalLink size={16} />
          </a>
        </Button>
      </div>
    </Card>
  );
}