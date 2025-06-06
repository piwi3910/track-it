import { Group, Popover, Stack, Text, ActionIcon, Progress } from '@mantine/core';
import { IconRefresh, IconCloud, IconCloudOff, IconDatabaseImport, IconDatabase, IconClock } from '@tabler/icons-react';
import { useApiStore } from '@/stores/useApiStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppTooltip } from '@/components/ui/AppTooltip';
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
    setMockApi,
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
            <AppTooltip label="Using mock API" position="bottom">
              <Badge variant="secondary" className="text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <IconDatabaseImport size={14} className="mr-1 inline" />
                Mock
              </Badge>
            </AppTooltip>
          ) : apiAvailable ? (
            <AppTooltip label="API is connected" position="bottom">
              <Badge variant="secondary" className="text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <IconCloud size={14} className="mr-1 inline" />
                API
              </Badge>
            </AppTooltip>
          ) : (
            <AppTooltip label={apiError || 'API is not available'} position="bottom">
              <Badge variant="destructive" className="text-sm">
                <IconCloudOff size={14} className="mr-1 inline" />
                API Down
              </Badge>
            </AppTooltip>
          )}

          {!isMockApi && (
            <AppTooltip 
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
            </AppTooltip>
          )}
        </Group>
      </Popover.Target>
      
      <Popover.Dropdown>
        <Stack gap="xs">
          <Text fw={500}>API Connection Status</Text>
          
          <Group>
            <Badge 
              variant={isMockApi || apiAvailable ? 'default' : 'destructive'}
              className={isMockApi ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
                        apiAvailable ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
            >
              {isMockApi ? 'Mock API' : apiAvailable ? 'Connected' : 'Disconnected'}
              {isMockApi ? <IconDatabase size={12} className="ml-1 inline" /> : 
               apiAvailable ? <IconCloud size={12} className="ml-1 inline" /> : 
               <IconCloudOff size={12} className="ml-1 inline" />}
            </Badge>
            
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-6 text-xs"
              onClick={() => checkApiAvailability(true)} // Force check
              disabled={isMockApi || isApiLoading}
              title="Force API check"
            >
              {isApiLoading ? 'Checking...' : 'Check'}
              {!isApiLoading && <IconRefresh size={14} className="ml-2 h-4 w-4" />}
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
                      <IconClock size={14} />
                      <Text size="xs">
                        Next check in {timeUntilNextCheck}s
                      </Text>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 text-xs"
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
                  variant="secondary"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setMockApi(true)}
                >
                  Switch to Mock API
                </Button>
                
                {connectionAttempts >= maxConnectionAttempts && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
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
                variant="secondary"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setMockApi(false);
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