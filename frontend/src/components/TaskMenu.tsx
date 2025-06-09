import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconMessageCircle2,
  IconSubtask,
  IconPlayerPlay,
  IconPlayerStop
} from '@tabler/icons-react';

interface TaskMenuProps {
  isTimeTrackingActive: boolean;
  trackingTime: number;
  commentCount: number;
  formatTrackingTime: (time: number) => string;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewConversation?: () => void;
  onToggleTimeTracking: () => void;
  onAddSubtask: () => void;
}

/**
 * Component for the task card action menu
 * Contains all task actions in a dropdown menu
 */
export function TaskMenu({
  isTimeTrackingActive,
  trackingTime,
  commentCount,
  formatTrackingTime,
  onEdit,
  onDelete,
  onViewConversation,
  onToggleTimeTracking,
  onAddSubtask
}: TaskMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
          <IconDotsVertical size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <IconPencil size={14} className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        {/* Time tracking in menu */}
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onToggleTimeTracking();
          }}
        >
          {isTimeTrackingActive ? 
            <IconPlayerStop size={14} className="mr-2 h-4 w-4" color="red" /> : 
            <IconPlayerPlay size={14} className="mr-2 h-4 w-4" color="green" />
          }
          {isTimeTrackingActive ? 'Stop Time Tracking' : 'Start Time Tracking'}
          {isTimeTrackingActive && trackingTime > 0 && ` (${formatTrackingTime(trackingTime)})`}
        </DropdownMenuItem>
        {onEdit && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onAddSubtask();
            }}
          >
            <IconSubtask size={14} className="mr-2 h-4 w-4" />
            Add Subtask
          </DropdownMenuItem>
        )}
        {onViewConversation && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onViewConversation();
            }}
          >
            <IconMessageCircle2 size={14} className="mr-2 h-4 w-4" />
            View Conversation
            {commentCount > 0 && (
              <Badge className="ml-auto text-xs h-5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {commentCount}
              </Badge>
            )}
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-destructive focus:text-destructive"
          >
            <IconTrash size={14} className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}