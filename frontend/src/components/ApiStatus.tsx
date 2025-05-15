import { Badge, Button, Group, Popover, Stack, Text, Tooltip, ActionIcon, Progress } from '@mantine/core';
import { IconRefresh, IconCloud, IconCloudOff, IconDatabaseImport, IconAlertCircle, IconDatabase, IconAlarmClock } from '@tabler/icons-react';
import { useApiStore } from '@/stores/useApiStore';
import { useState, useMemo } from 'react';

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
    maxConnectionAttempts,
    recentErrors,
    lastChecked,
    nextScheduledCheck,
    resetConnectionAttempts
  } = useApiStore();
  
  const [opened, setOpened] = useState(false);
  
  // Calculate time until next check
  const timeUntilNextCheck = useMemo(() => {
    if (!nextScheduledCheck) return null;
    
    const diff = nextScheduledCheck - Date.now();
    if (diff <= 0) return null;
    
    return Math.ceil(diff / 1000); // In seconds
  }, [nextScheduledCheck]);
  
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
            <Tooltip 
              label={
                isApiLoading ? "Checking API connection..." : 
                connectionAttempts >= maxConnectionAttempts ? "Connection attempts exhausted" :
                !apiAvailable && timeUntilNextCheck ? `Next check in ${timeUntilNextCheck}s` :
                !apiAvailable ? "API unavailable" :
                "Check API connection"
              } 
              position="bottom"
            >
              <ActionIcon
                variant="subtle"
                color={
                  isApiLoading ? "blue" : 
                  connectionAttempts >= maxConnectionAttempts ? "red" : 
                  !apiAvailable ? "yellow" : 
                  "gray"
                }
                size="sm"
                loading={isApiLoading}
                onClick={() => {
                  checkApiAvailability(true); // Force check
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
              onClick={() => checkApiAvailability(true)} // Force check
              disabled={isMockApi}
              title="Force API check"
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
                <>
                  <Group gap="xs" align="center">
                    <Text size="xs">Connection attempts:</Text>
                    <Progress 
                      value={(connectionAttempts / maxConnectionAttempts) * 100} 
                      color={connectionAttempts >= maxConnectionAttempts ? "red" : "yellow"} 
                      size="xs" 
                      w={100}
                    />
                    <Text size="xs" fw={500}>
                      {connectionAttempts}/{maxConnectionAttempts}
                    </Text>
                  </Group>
                  
                  {timeUntilNextCheck && (
                    <Group gap="xs" align="center">
                      <IconAlarmClock size={14} />
                      <Text size="xs">
                        Next check in {timeUntilNextCheck}s
                      </Text>
                      <Button 
                        variant="subtle" 
                        color="gray" 
                        size="compact-xs"
                        onClick={() => resetConnectionAttempts()}
                      >
                        Reset
                      </Button>
                    </Group>
                  )}
                </>
              )}
              
              {lastChecked && (
                <Text size="xs">
                  Last checked: {formatTimeAgo(lastChecked)}
                </Text>
              )}
              
              <Group gap="xs">
                <Button
                  variant="light"
                  color="blue" 
                  size="xs"
                  onClick={() => useMockApi(true)}
                >
                  Switch to Mock API
                </Button>
                
                {connectionAttempts >= maxConnectionAttempts && (
                  <Button
                    variant="outline"
                    color="green"
                    size="xs"
                    onClick={() => {
                      resetConnectionAttempts();
                      checkApiAvailability(true);
                    }}
                  >
                    Retry Connection
                  </Button>
                )}
              </Group>
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
                  resetConnectionAttempts();
                  checkApiAvailability(true);
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
              
              {recentErrors.length > 3 && (
                <Text size="xs" c="dimmed" fs="italic">
                  +{recentErrors.length - 3} more errors
                </Text>
              )}
            </>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}