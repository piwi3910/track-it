import { useEffect, useRef, useState } from 'react';
import {
  Title,
  Text,
  Button,
  Paper,
  Group,
  Tabs,
  Card,
  Stack,
  Loader,
  Avatar,
  ActionIcon,
  ScrollArea,
  Image,
  List,
  Alert,
  Switch,
  Box,
  Divider
} from '@mantine/core';
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
  IconSettings
} from '@tabler/icons-react';
import { useGoogle } from '@/hooks/useGoogle';;
import { useApp } from '@/hooks/useApp';
import { useStore } from '@/hooks/useStore';
import { notifications } from '@mantine/notifications';
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
    <Stack>
      <Group align="start">
        <Avatar 
          src={accountStatus?.picture || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(google?.email || 'User')}&background=random`
          } 
          color="red" 
          radius="xl"
        />
        <Stack gap={0} style={{ flex: 1 }}>
          <Text fw={500}>{accountStatus?.name || 'Connected to Google'}</Text>
          <Text size="sm" c="dimmed">{accountStatus?.email || google?.email || 'Google account connected'}</Text>
        </Stack>
        <Button 
          variant="outline" 
          color="red" 
          onClick={handleDisconnect}
        >
          Disconnect
        </Button>
      </Group>
      
      <Divider my="md" label="Sync Settings" labelPosition="center" />
      
      <Stack>
        <Group justify="space-between">
          <div>
            <Text fw={500}>Auto-sync</Text>
            <Text size="xs" c="dimmed">Automatically sync data when changes occur</Text>
          </div>
          <Switch 
            checked={autoSync} 
            onChange={(e) => setAutoSync(e.currentTarget.checked)} 
          />
        </Group>
        
        <Group justify="space-between">
          <div>
            <Text fw={500}>Calendar</Text>
            <Text size="xs" c="dimmed">Sync Google Calendar events</Text>
          </div>
          <Group gap="xs">
            <Switch 
              checked={calendarSync} 
              onChange={(e) => setCalendarSync(e.currentTarget.checked)} 
            />
          </Group>
        </Group>
        
        <Group justify="space-between">
          <div>
            <Text fw={500}>Tasks</Text>
            <Text size="xs" c="dimmed">Sync Google Tasks</Text>
          </div>
          <Switch 
            checked={tasksSync} 
            onChange={(e) => setTasksSync(e.currentTarget.checked)} 
          />
        </Group>
        
        <Group justify="space-between">
          <div>
            <Text fw={500}>Drive</Text>
            <Text size="xs" c="dimmed">Access Google Drive files</Text>
          </div>
          <Switch 
            checked={driveSync} 
            onChange={(e) => setDriveSync(e.currentTarget.checked)} 
          />
        </Group>
      </Stack>
      
      <Box mt="md">
        <Text size="xs" c="dimmed" ta="center">
          Last synced: {google?.lastSyncTime ? 
            new Date(google.lastSyncTime).toLocaleString() : 
            'Never'
          }
        </Text>
      </Box>
    </Stack>
  );

  return (
    <Paper p="xl" withBorder>
      {error && (
        <Alert 
          icon={<IconAlertCircle size={16} />}
          title="Error" 
          color="red" 
          mb="md"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
    
      {!isAuthenticated ? (
        <Stack align="center" gap="lg">
          <Avatar size={80} color="red" radius={80}>
            <IconBrandGoogle size={40} />
          </Avatar>
          <Title order={3}>Connect your Google account</Title>
          <Text c="dimmed" ta="center">
            Connect your Google account to sync your calendar, tasks, and documents.
            This allows you to view and import data from Google services directly into Track-It.
          </Text>
          
          {/* Legacy button */}
          <Button 
            leftSection={<IconBrandGoogle size={16} />} 
            color="red" 
            onClick={handleAuth}
            loading={authenticating}
          >
            Connect with Google
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
        </Stack>
      ) : (
        <>
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'calendar')} mb="lg">
            <Tabs.List>
              <Tabs.Tab value="calendar" leftSection={<IconCalendar size={16} />}>
                Calendar
              </Tabs.Tab>
              <Tabs.Tab value="tasks" leftSection={<IconChecklist size={16} />}>
                Tasks
              </Tabs.Tab>
              <Tabs.Tab value="drive" leftSection={<IconFileDescription size={16} />}>
                Drive
              </Tabs.Tab>
              <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
                Settings
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
          
          {activeTab === 'settings' && renderSettings()}
          
          {activeTab === 'calendar' && (
            <Stack>
              <Group justify="space-between" mb="md">
                <Title order={3}>Google Calendar</Title>
                <Group>
                  <Button 
                    leftSection={<IconRefresh size={16} />} 
                    variant="outline"
                    onClick={handleSyncCalendar}
                    loading={calendarSyncing}
                  >
                    Sync Calendar
                  </Button>
                  <Button 
                    leftSection={<IconDownload size={16} />}
                    disabled={selectedCalendarEvents.length === 0 || calendarEvents.length === 0}
                    onClick={importSelectedEvents}
                    loading={importingEvents}
                  >
                    Import Selected ({selectedCalendarEvents.length})
                  </Button>
                </Group>
              </Group>
              
              {calendarSyncing ? (
                <Stack align="center" my="xl">
                  <Loader size="md" />
                  <Text c="dimmed">Syncing your calendar...</Text>
                </Stack>
              ) : calendarEvents.length === 0 ? (
                <Stack align="center" my="xl">
                  <Text c="dimmed">No calendar events found. Sync your calendar to see events.</Text>
                  <Button 
                    leftSection={<IconRefresh size={16} />}
                    variant="light"
                    onClick={handleSyncCalendar}
                  >
                    Sync Now
                  </Button>
                </Stack>
              ) : (
                <ScrollArea h={400}>
                  <Stack gap="md">
                    {calendarEvents.map(event => (
                      <CalendarEventCard 
                        key={event.id}
                        event={event}
                        selected={selectedCalendarEvents.includes(event.id)}
                        onToggleSelect={() => toggleEventSelection(event.id)}
                      />
                    ))}
                  </Stack>
                </ScrollArea>
              )}
            </Stack>
          )}
          
          {activeTab === 'tasks' && (
            <Stack>
              <Group justify="space-between" mb="md">
                <Title order={3}>Google Tasks</Title>
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleImportTasks}
                  loading={tasksSyncing}
                >
                  Import Tasks
                </Button>
              </Group>
              
              {tasksSyncing ? (
                <Stack align="center" my="xl">
                  <Loader size="md" />
                  <Text c="dimmed">Importing your tasks...</Text>
                </Stack>
              ) : (
                <Stack align="center" gap="md" my="xl">
                  <IconChecklist size={48} stroke={1.5} opacity={0.5} />
                  <Title order={4}>Import Tasks from Google</Title>
                  <Text c="dimmed" ta="center" maw={500}>
                    Click the Import button to fetch and import your tasks from Google Tasks.
                    They will be added to your project with the appropriate status and due dates.
                  </Text>
                  <List>
                    <List.Item>Maintains task titles and descriptions</List.Item>
                    <List.Item>Preserves due dates when available</List.Item>
                    <List.Item>Tasks are tagged with 'google' for easy identification</List.Item>
                  </List>
                </Stack>
              )}
            </Stack>
          )}
          
          {activeTab === 'drive' && (
            <Stack>
              <Group justify="space-between" mb="md">
                <Title order={3}>Google Drive</Title>
                <Button
                  leftSection={<IconRefresh size={16} />}
                  variant="outline"
                  onClick={handleFetchDriveFiles}
                  loading={driveSyncing}
                >
                  Fetch Files
                </Button>
              </Group>
              
              {driveSyncing ? (
                <Stack align="center" my="xl">
                  <Loader size="md" />
                  <Text c="dimmed">Fetching your files...</Text>
                </Stack>
              ) : driveFiles.length === 0 ? (
                <Stack align="center" my="xl">
                  <Text c="dimmed">No files found. Fetch your files to see them here.</Text>
                  <Button 
                    leftSection={<IconRefresh size={16} />}
                    variant="light"
                    onClick={handleFetchDriveFiles}
                  >
                    Fetch Now
                  </Button>
                </Stack>
              ) : (
                <ScrollArea h={400}>
                  <Stack gap="md">
                    {driveFiles.map(file => (
                      <DriveFileCard key={file.id} file={file} />
                    ))}
                  </Stack>
                </ScrollArea>
              )}
            </Stack>
          )}
        </>
      )}
    </Paper>
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
    <Card p="sm" withBorder>
      <Group justify="space-between">
        <Group>
          <ActionIcon 
            color={selected ? 'blue' : 'gray'} 
            variant={selected ? 'filled' : 'subtle'}
            onClick={onToggleSelect}
          >
            {selected ? <IconCheck size={16} /> : <IconPlus size={16} />}
          </ActionIcon>
          <div>
            <Text fw={500}>{event.title}</Text>
            <Text size="xs" c="dimmed">
              {formattedDate} • {formattedStartTime} - {formattedEndTime}
            </Text>
            {event.location && (
              <Text size="xs" c="dimmed">
                {event.location}
              </Text>
            )}
          </div>
        </Group>
        <ActionIcon 
          variant="subtle" 
          component="a" 
          href={event.link} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <IconExternalLink size={16} />
        </ActionIcon>
      </Group>
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
    <Card p="sm" withBorder>
      <Group>
        <Image src={getFileIcon()} w={24} h={24} alt="File icon" />
        <div style={{ flex: 1 }}>
          <Text fw={500}>{file.name}</Text>
          <Text size="xs" c="dimmed">
            {file.mimeType.split('/').pop()}
          </Text>
        </div>
        <ActionIcon 
          variant="subtle" 
          component="a" 
          href={file.webViewLink} 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <IconExternalLink size={16} />
        </ActionIcon>
      </Group>
    </Card>
  );
}