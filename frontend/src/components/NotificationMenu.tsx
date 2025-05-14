import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  ActionIcon,
  Text,
  Group,
  Divider,
  Button,
  ScrollArea,
  Indicator,
  Stack,
  Loader
} from '@mantine/core';
import {
  IconBell,
  IconCheck,
  IconSettings,
  IconMessage,
  IconUserPlus,
  IconClock,
  IconStatusChange
} from '@tabler/icons-react';
import { useNotifications } from '@/context/NotificationContext';
import { Notification } from '@/types/task';

export function NotificationMenu() {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error,
    markAsRead, 
    markAllAsRead,
    clearError
  } = useNotifications();
  
  const navigate = useNavigate();
  const [menuOpened, setMenuOpened] = useState(false);
  
  // Get icon for notification type - memoize to prevent recreation on every render
  const getNotificationIcon = useCallback((type: Notification['type']) => {
    switch (type) {
      case 'assignment':
        return <IconUserPlus size={16} />;
      case 'mention':
      case 'comment':
        return <IconMessage size={16} />;
      case 'due_soon':
        return <IconClock size={16} />;
      case 'status_change':
        return <IconStatusChange size={16} />;
      default:
        return <IconBell size={16} />;
    }
  }, []);
  
  // Handle notification click
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    // Mark as read and await the result
    try {
      await markAsRead(notification.id);
      
      // Navigate to related task if available (only after successful mark as read)
      if (notification.relatedTaskId) {
        setMenuOpened(false);
        navigate(`/kanban?task=${notification.relatedTaskId}`);
      }
    } catch (err) {
      console.error('Failed to mark notification as read before navigation:', err);
      // Still navigate even if marking as read fails
      if (notification.relatedTaskId) {
        setMenuOpened(false);
        navigate(`/kanban?task=${notification.relatedTaskId}`);
      }
    }
  }, [markAsRead, navigate]);
  
  // Format relative time
  const formatRelativeTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    
    return date.toLocaleDateString();
  }, []);
  
  return (
    <Menu
      position="bottom-end"
      width={320}
      opened={menuOpened}
      onChange={setMenuOpened}
    >
      <Menu.Target>
        <Indicator
          disabled={unreadCount === 0}
          color="red"
          size={16}
          label={unreadCount > 9 ? '9+' : unreadCount.toString()}
          offset={4}
        >
          <ActionIcon 
            variant="light" 
            title="Notifications"
            onClick={() => setMenuOpened(true)}
          >
            <IconBell size={18} />
          </ActionIcon>
        </Indicator>
      </Menu.Target>
      
      <Menu.Dropdown>
        <Group justify="space-between" p="xs">
          <Text fw={600}>Notifications</Text>
          {unreadCount > 0 && (
            <Button 
              variant="subtle" 
              size="xs" 
              onClick={() => markAllAsRead()}
              rightSection={<IconCheck size={14} />}
            >
              Mark all as read
            </Button>
          )}
        </Group>
        
        <Divider />
        
        {loading ? (
          <Stack align="center" py="md">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">Loading notifications...</Text>
          </Stack>
        ) : error ? (
          <Stack align="center" py="md">
            <Text size="sm" c="red">{error.message}</Text>
            <Button size="xs" onClick={clearError}>Dismiss</Button>
          </Stack>
        ) : notifications.length === 0 ? (
          <Stack align="center" py="md">
            <IconBell size={24} opacity={0.5} />
            <Text size="sm" c="dimmed">No notifications</Text>
          </Stack>
        ) : (
          <>
            <ScrollArea h={400} offsetScrollbars>
              <Stack gap={0}>
                {notifications.map(notification => (
                  <Menu.Item
                    key={notification.id}
                    leftSection={getNotificationIcon(notification.type)}
                    style={{
                      backgroundColor: notification.read ? undefined : 'var(--mantine-color-blue-0)',
                      opacity: notification.read ? 0.8 : 1
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <Text size="sm" lineClamp={2}>
                      {notification.message}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatRelativeTime(notification.createdAt)}
                    </Text>
                  </Menu.Item>
                ))}
              </Stack>
            </ScrollArea>
            
            <Divider />
            
            <Menu.Item
              leftSection={<IconSettings size={16} />}
              onClick={() => navigate('/settings')}
            >
              Notification settings
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}