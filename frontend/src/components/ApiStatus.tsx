import { Badge, Button, Group, Popover, Stack, Text, Tooltip, ActionIcon } from '@mantine/core';
import { IconRefresh, IconCloud, IconCloudOff, IconDatabaseImport, IconAlertCircle, IconDatabase } from '@tabler/icons-react';
import { useApiStore } from '@/stores/useApiStore';
import { useState } from 'react';

/**
 * ApiStatus component displays the current status of the API connection
 * and provides a refresh button to check the connection.
 */
export function ApiStatus() {
  const { 
    apiAvailable, 
    apiError, 
    isApiLoading, 
    checkApiAvailability,
    isMockApi,
    useMockApi,
    connectionAttempts,
    recentErrors,
    lastChecked
  } = useApiStore();
  
  const [opened, setOpened] = useState(false);
  
  // Format time ago
  const formatTimeAgo = (timestamp: string | null) => {
    if (!timestamp) return 'never';
    
    const diff = Date.now() - new Date(timestamp).getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };
  
  // Don't show anything in prod mode if API is available and not using mock
  if (import.meta.env.MODE === 'production' && apiAvailable && !apiError && !isMockApi) {
    return null;
  }
  
  return (
    <Popover 
      opened={opened} 
      onChange={setOpened} 
      position="bottom-end" 
      shadow="md"
      width={300}
    >
      <Popover.Target>
        <Group gap="xs">
          {isMockApi ? (
            <Tooltip label="Using mock API" position="bottom">
              <Badge variant="light" color="blue" size="sm" leftSection={<IconDatabaseImport size={14} />}>
                Mock
              </Badge>
            </Tooltip>
          ) : apiAvailable ? (
            <Tooltip label="API is connected" position="bottom">
              <Badge variant="light" color="green" size="sm" leftSection={<IconCloud size={14} />}>
                API
              </Badge>
            </Tooltip>
          ) : (
            <Tooltip label={apiError || 'API is not available'} position="bottom">
              <Badge variant="light" color="red" size="sm" leftSection={<IconCloudOff size={14} />}>
                API Down
              </Badge>
            </Tooltip>
          )}

          {!isMockApi && (
            <Tooltip label="Check API connection" position="bottom">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                loading={isApiLoading}
                onClick={() => {
                  checkApiAvailability();
                  setOpened(true);
                }}
              >
                <IconRefresh size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Popover.Target>
      
      <Popover.Dropdown>
        <Stack gap="xs">
          <Text fw={500}>API Connection Status</Text>
          
          <Group>
            <Badge 
              variant="filled"
              color={isMockApi ? 'blue' : apiAvailable ? 'green' : 'red'}
              rightSection={
                isMockApi ? <IconDatabase size={12} /> : 
                apiAvailable ? <IconCloud size={12} /> : 
                <IconCloudOff size={12} />
              }
            >
              {isMockApi ? 'Mock API' : apiAvailable ? 'Connected' : 'Disconnected'}
            </Badge>
            
            <Button 
              variant="light" 
              size="compact-xs" 
              rightSection={<IconRefresh size={14} />}
              loading={isApiLoading}
              onClick={() => checkApiAvailability()}
              disabled={isMockApi}
            >
              Check
            </Button>
          </Group>
          
          {!isMockApi && !apiAvailable && (
            <>
              <Text size="xs" c="dimmed">
                {apiError || 'Cannot connect to API server'}
              </Text>
              
              {connectionAttempts > 0 && (
                <Text size="xs">
                  Connection attempts: {connectionAttempts}
                </Text>
              )}
              
              {lastChecked && (
                <Text size="xs">
                  Last checked: {formatTimeAgo(lastChecked)}
                </Text>
              )}
              
              <Button
                variant="light"
                color="blue" 
                size="xs"
                onClick={() => useMockApi(true)}
              >
                Switch to Mock API
              </Button>
            </>
          )}
          
          {isMockApi && (
            <>
              <Text size="xs" c="dimmed">
                Using mock API data. No server connection required.
              </Text>
              
              <Button
                variant="light"
                color="blue" 
                size="xs"
                onClick={() => {
                  useMockApi(false);
                  checkApiAvailability();
                }}
              >
                Try Real API
              </Button>
            </>
          )}
          
          {recentErrors.length > 0 && (
            <>
              <Text size="xs" mt="xs" fw={500}>Recent Errors</Text>
              {recentErrors.slice(0, 3).map((error, i) => (
                <Text key={i} size="xs" c="dimmed">
                  {new Date(error.timestamp).toLocaleTimeString()}: {error.message}
                </Text>
              ))}
            </>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}