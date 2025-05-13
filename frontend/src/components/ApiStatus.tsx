import { Badge, Group, Tooltip, ActionIcon } from '@mantine/core';
import { useApi } from '@/hooks/useApi';
import { IconRefresh, IconCloud, IconCloudOff, IconDatabaseImport } from '@tabler/icons-react';

/**
 * ApiStatus component displays the current status of the API connection
 * and provides a refresh button to check the connection.
 */
export function ApiStatus() {
  const { apiAvailable, isApiLoading, apiError, checkApiAvailability, isMockApi } = useApi();
  
  // Don't show anything in prod mode if API is available
  if (import.meta.env.MODE === 'production' && apiAvailable && !apiError) {
    return null;
  }
  
  return (
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
            onClick={() => checkApiAvailability()}
          >
            <IconRefresh size={14} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}