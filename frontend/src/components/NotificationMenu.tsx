import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  Text,
  Group,
  Divider,
  ScrollArea,
  Indicator,
  Stack,
  Loader
} from '@mantine/core';
import { Button } from '@/components/ui/button';
import { AppMenu } from '@/components/ui/AppMenu';
import {
  IconBell,
  IconCheck,
  IconSettings,
  IconMessage,
  IconUserPlus,
  IconClock,
  IconStatusChange
} from '@tabler/icons-react';
import { useNotifications } from '@/hooks/useNotifications';
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
      case 'TASK_ASSIGNED':
        return <IconUserPlus size={16} />;
      case 'MENTION':
      case 'COMMENT_ADDED':
        return <IconMessage size={16} />;
      case 'DUE_DATE_REMINDER':
        return <IconClock size={16} />;
      case 'TASK_UPDATED':
        return <IconStatusChange size={16} />;
      case 'SYSTEM':
        return <IconBell size={16} />;
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
    <AppMenu
      position="bottom-end"
      width={320}
      opened={menuOpened}
      onChange={setMenuOpened}
    >
      <AppMenu.Target>
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
      </AppMenu.Target>
      
      <AppMenu.Dropdown>
        <Group justify="space-between" p="xs">
          <Text fw={600}>Notifications</Text>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={() => markAllAsRead()}
            >
              Mark all as read
              <IconCheck size={14} className="ml-2 h-4 w-4" />
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
            <Button size="sm" className="h-6 text-xs" onClick={clearError}>Dismiss</Button>
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
                  <AppMenu.Item
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
                  </AppMenu.Item>
                ))}
              </Stack>
            </ScrollArea>
            
            <Divider />
            
            <AppMenu.Item
              leftSection={<IconSettings size={16} />}
              onClick={() => navigate('/settings')}
            >
              Notification settings
            </AppMenu.Item>
          </>
        )}
      </AppMenu.Dropdown>
    </AppMenu>
  );
}