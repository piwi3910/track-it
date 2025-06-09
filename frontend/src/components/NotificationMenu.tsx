import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
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
    <DropdownMenu
      open={menuOpened}
      onOpenChange={setMenuOpened}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title="Notifications"
        >
          <IconBell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3">
          <h3 className="font-semibold">Notifications</h3>
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
        </div>
        
        <Separator />
        
        {loading ? (
          <div className="flex flex-col items-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-6">
            <p className="text-sm text-red-600">{error.message}</p>
            <Button size="sm" className="h-6 text-xs mt-2" onClick={clearError}>Dismiss</Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-6">
            <IconBell size={24} className="text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mt-2">No notifications</p>
          </div>
        ) : (
          <>
            <div className="max-h-96 overflow-y-auto">
              {notifications.map(notification => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-3 cursor-pointer ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-950' : ''
                  } ${notification.read ? 'opacity-80' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={() => navigate('/settings')}
              className="p-3"
            >
              <IconSettings size={16} className="mr-2 h-4 w-4" />
              Notification settings
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}