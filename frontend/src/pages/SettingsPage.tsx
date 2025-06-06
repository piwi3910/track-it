import { useState } from 'react';
import {
  Container,
  Title,
  Paper,
  Group,
  Text,
  Divider,
  Select,
  TextInput,
  Accordion,
  Stack
} from '@mantine/core';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppTabs } from '@/components/ui/AppTabs';
import { AppSwitch } from '@/components/ui/AppSwitch';
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
import { useTheme } from '@/hooks/useTheme';;
import { api } from '@/api';

export function SettingsPage() {
  const { currentUser, userLoading } = useApp();
  const { isDark, toggleColorScheme } = useTheme();
  const [activeTab, setActiveTab] = useState<string | null>('account');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [defaultView, setDefaultView] = useState<string>('dashboard');
  
  // Handle avatar update using the correct API pattern
  const handleAvatarChange = async (avatarUrl: string | null) => {
    try {
      // @ts-expect-error - Method may not exist in current API
      await api.auth.updateProfile?.({
        avatarUrl: avatarUrl
      });
      
      // Handle success - no error checking needed with direct response
      
      // Trigger a refetch of user data to update the UI
      window.location.reload();
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update avatar');
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
      
      <AppTabs value={activeTab} onChange={setActiveTab}>
        <AppTabs.List mb="xl">
          <AppTabs.Tab value="account" leftSection={<IconUser size={16} />}>
            Account
          </AppTabs.Tab>
          <AppTabs.Tab value="notifications" leftSection={<IconBell size={16} />}>
            Notifications
          </AppTabs.Tab>
          <AppTabs.Tab value="appearance" leftSection={<IconPalette size={16} />}>
            Appearance
          </AppTabs.Tab>
          <AppTabs.Tab 
            value="integrations" 
            leftSection={<IconBrandGoogle size={16} />}
            className="disabled coming-soon"
          >
            Integrations
          </AppTabs.Tab>
        </AppTabs.List>
        
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
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{currentUser.role?.toUpperCase() || 'MEMBER'}</Badge>
                  </Group>
                  
                  <Divider my="md" />
                  
                  <Group justify="space-between">
                    <Button variant="outline">Change Password</Button>
                    <Button variant="destructive">
                      <IconLogout size={16} className="mr-2 h-4 w-4" />
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
                        <AppSwitch 
                          checked={emailNotifications} 
                          onChange={(e) => setEmailNotifications(e.currentTarget.checked)} 
                        />
                      </Group>
                      
                      <Divider my="xs" />
                      
                      <Group justify="space-between">
                        <Text>Task assignments</Text>
                        <AppSwitch defaultChecked disabled={!emailNotifications} />
                      </Group>
                      
                      <Group justify="space-between">
                        <Text>Task due date reminders</Text>
                        <AppSwitch defaultChecked disabled={!emailNotifications} />
                      </Group>
                      
                      <Group justify="space-between">
                        <Text>Mentions in comments</Text>
                        <AppSwitch defaultChecked disabled={!emailNotifications} />
                      </Group>
                      
                      <Group justify="space-between">
                        <Text>Status changes</Text>
                        <AppSwitch disabled={!emailNotifications} />
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
                        <AppSwitch 
                          checked={inAppNotifications} 
                          onChange={(e) => setInAppNotifications(e.currentTarget.checked)} 
                        />
                      </Group>
                      
                      <Divider my="xs" />
                      
                      <Group justify="space-between">
                        <Text>Task assignments</Text>
                        <AppSwitch defaultChecked disabled={!inAppNotifications} />
                      </Group>
                      
                      <Group justify="space-between">
                        <Text>Comments on your tasks</Text>
                        <AppSwitch defaultChecked disabled={!inAppNotifications} />
                      </Group>
                      
                      <Group justify="space-between">
                        <Text>Mentions in comments</Text>
                        <AppSwitch defaultChecked disabled={!inAppNotifications} />
                      </Group>
                      
                      <Group justify="space-between">
                        <Text>Status changes</Text>
                        <AppSwitch defaultChecked disabled={!inAppNotifications} />
                      </Group>
                      
                      <Group justify="space-between">
                        <Text>Due date reminders</Text>
                        <AppSwitch defaultChecked disabled={!inAppNotifications} />
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
                <AppSwitch 
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
      </AppTabs>
    </Container>
  );
}