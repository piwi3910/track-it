import { useState } from 'react';
import {
  Container,
  Title,
  Tabs,
  Paper,
  Group,
  Text,
  Divider,
  Switch,
  Select,
  TextInput,
  Button,
  Accordion,
  Badge,
  Stack
} from '@mantine/core';
import {
  IconUser,
  IconBrandGoogle,
  IconBell,
  IconPalette,
  IconLogout,
  IconMailFilled,
} from '@tabler/icons-react';
import { GoogleIntegrationPanel } from './settings/GoogleIntegrationPanel';
import { ProfilePictureUpload } from '@/components/ProfilePictureUpload';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/context/ThemeContext';
import { trpc } from '@/utils/trpc';

export function SettingsPage() {
  const { currentUser, userLoading } = useApp();
  const { isDark, toggleColorScheme } = useTheme();
  const [activeTab, setActiveTab] = useState<string | null>('account');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [defaultView, setDefaultView] = useState<string>('dashboard');
  
  // Get the update avatar mutation
  const updateAvatarMutation = trpc.users.updateAvatar.useMutation();
  
  // Handle avatar update
  const handleAvatarChange = async (avatarUrl: string | null) => {
    try {
      await updateAvatarMutation.mutateAsync({ avatarUrl });
      
      // Trigger a refetch of user data to update the UI
      // This should be handled by the AppContext, but we might need to trigger it manually
      window.location.reload(); // Simple approach for now - could be improved with proper state management
      
    } catch (error: any) {
      // Re-throw the error so the component can handle it
      throw new Error(error.message || 'Failed to update avatar');
    }
  };
  
  // Show loading state if user data is not available
  if (userLoading) {
    return (
      <Container size="xl">
        <Title mb="xl">Settings</Title>
        <Text>Loading user settings...</Text>
      </Container>
    );
  }

  // Show error state if no user data is available after loading
  if (!currentUser) {
    return (
      <Container size="xl">
        <Title mb="xl">Settings</Title>
        <Text c="red">Unable to load user settings. Please try refreshing the page.</Text>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Title mb="xl">Settings</Title>
      
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="xl">
          <Tabs.Tab value="account" leftSection={<IconUser size={16} />}>
            Account
          </Tabs.Tab>
          <Tabs.Tab value="notifications" leftSection={<IconBell size={16} />}>
            Notifications
          </Tabs.Tab>
          <Tabs.Tab value="appearance" leftSection={<IconPalette size={16} />}>
            Appearance
          </Tabs.Tab>
          <Tabs.Tab 
            value="integrations" 
            leftSection={<IconBrandGoogle size={16} />}
            className="disabled coming-soon"
          >
            Integrations
          </Tabs.Tab>
        </Tabs.List>
        
        {/* Account Settings */}
        {activeTab === 'account' && (
          <Paper withBorder p="xl">
            <Group align="flex-start" gap="xl">
              <ProfilePictureUpload
                currentAvatarUrl={currentUser.avatarUrl}
                userName={currentUser.name}
                onAvatarChange={handleAvatarChange}
                size="xl"
              />
              
              <div style={{ flex: 1 }}>
                <Stack>
                  <TextInput
                    label="Name"
                    defaultValue={currentUser.name}
                  />
                  
                  <TextInput
                    label="Email"
                    defaultValue={currentUser.email}
                  />
                  
                  <Group mt="md">
                    <Badge color="blue">{currentUser.role?.toUpperCase() || 'MEMBER'}</Badge>
                  </Group>
                  
                  <Divider my="md" />
                  
                  <Group justify="space-between">
                    <Button variant="outline">Change Password</Button>
                    <Button color="red" leftSection={<IconLogout size={16} />}>
                      Sign Out
                    </Button>
                  </Group>
                </Stack>
              </div>
            </Group>
          </Paper>
        )}
        
        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <Paper withBorder p="xl">
            <Stack>
              <Title order={3} mb="md">Notification Preferences</Title>
              
              <Accordion defaultValue="email">
                <Accordion.Item value="email">
                  <Accordion.Control icon={<IconMailFilled size={16} />}>
                    Email Notifications
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack>
                      <Group justify="space-between">
                        <Text>Receive email notifications</Text>
                        <Switch 
                          checked={emailNotifications} 
                          onChange={(e) => setEmailNotifications(e.currentTarget.checked)} 
                        />
                      </Group>
                      
                      <Divider my="xs" />
                      
                      <Group justify="space-between">
                        <Text>Task assignments</Text>
                        <Switch defaultChecked disabled={!emailNotifications} />
                      </Group>
                      
                      <Group justify="space-between">
                        <Text>Task due date reminders</Text>
                        <Switch defaultChecked disabled={!emailNotifications} />
                      </Group>
                      
                      <Group justify="space-between">
                        <Text>Mentions in comments</Text>
                        <Switch defaultChecked disabled={!emailNotifications} />
                      </Group>
                      
                      <Group justify="space-between">
                        <Text>Status changes</Text>
                        <Switch disabled={!emailNotifications} />
                      </Group>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
                
                <Accordion.Item value="in-app">
                  <Accordion.Control icon={<IconBell size={16} />}>
                    In-App Notifications
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack>
                      <Group justify="space-between">
                        <Text>Show in-app notifications</Text>
                        <Switch 
                          checked={inAppNotifications} 
                          onChange={(e) => setInAppNotifications(e.currentTarget.checked)} 
                        />
                      </Group>
                      
                      <Divider my="xs" />
                      
                      <Group justify="space-between">
                        <Text>Task assignments</Text>
                        <Switch defaultChecked disabled={!inAppNotifications} />
                      </Group>
                      
                      <Group justify="space-between">
                        <Text>Comments on your tasks</Text>
                        <Switch defaultChecked disabled={!inAppNotifications} />
                      </Group>
                      
                      <Group justify="space-between">
                        <Text>Mentions in comments</Text>
                        <Switch defaultChecked disabled={!inAppNotifications} />
                      </Group>
                      
                      <Group justify="space-between">
                        <Text>Status changes</Text>
                        <Switch defaultChecked disabled={!inAppNotifications} />
                      </Group>
                      
                      <Group justify="space-between">
                        <Text>Due date reminders</Text>
                        <Switch defaultChecked disabled={!inAppNotifications} />
                      </Group>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Stack>
          </Paper>
        )}
        
        {/* Appearance Settings */}
        {activeTab === 'appearance' && (
          <Paper withBorder p="xl">
            <Stack>
              <Title order={3} mb="md">Appearance</Title>
              
              <Group justify="space-between" mb="md">
                <div>
                  <Text>Dark Mode</Text>
                  <Text size="sm" c="dimmed">Enable dark mode for the application</Text>
                </div>
                <Switch 
                  checked={isDark} 
                  onChange={toggleColorScheme}
                  size="lg"
                />
              </Group>
              
              <Divider my="md" />
              
              <Group justify="space-between" mb="md">
                <div>
                  <Text>Default View</Text>
                  <Text size="sm" c="dimmed">Choose which page to show when you first log in</Text>
                </div>
                <Select
                  value={defaultView}
                  onChange={(val) => val && setDefaultView(val)}
                  data={[
                    { value: 'dashboard', label: 'Dashboard' },
                    { value: 'kanban', label: 'Kanban Board' },
                    { value: 'calendar', label: 'Calendar' },
                    { value: 'backlog', label: 'Backlog' },
                  ]}
                  style={{ width: 200 }}
                />
              </Group>
            </Stack>
          </Paper>
        )}
        
        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <GoogleIntegrationPanel />
        )}
      </Tabs>
    </Container>
  );
}