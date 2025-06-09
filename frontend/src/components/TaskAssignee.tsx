import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IconPlus, IconCheck } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { useUserCache } from '@/hooks/useUserCache';
import type { Task } from '@track-it/shared/types';

interface TaskAssigneeProps {
  task: Task;
  onAssigneeChange: (assigneeId: string | null) => void;
}

/**
 * Component for displaying and managing task assignment
 * Shows assignee avatar or assignment button with user selection popover
 */
export function TaskAssignee({ task, onAssigneeChange }: TaskAssigneeProps) {
  const { users, getUserName, getUserAvatar } = useUserCache();
  const [assignmentPopoverOpened, setAssignmentPopoverOpened] = useState(false);

  const handleUserSelect = (userId: string) => {
    onAssigneeChange(userId);
    setAssignmentPopoverOpened(false);
  };

  const handleUnassign = () => {
    onAssigneeChange(null);
    setAssignmentPopoverOpened(false);
  };

  return (
    <Popover 
      open={assignmentPopoverOpened}
      onOpenChange={setAssignmentPopoverOpened}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            {task.assigneeId ? (
              <button
                className="h-8 w-8 cursor-pointer bg-transparent border-0 p-0 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setAssignmentPopoverOpened(true);
                }}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={getUserAvatar(task.assigneeId) || `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserName(task.assigneeId))}&background=random`} 
                  />
                  <AvatarFallback>{getUserName(task.assigneeId).charAt(0)}</AvatarFallback>
                </Avatar>
              </button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 border-dashed"
                onClick={(e) => {
                  e.stopPropagation();
                  setAssignmentPopoverOpened(true);
                }}
              >
                <IconPlus size={12} />
              </Button>
            )}
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {task.assigneeId 
            ? `Assigned to ${getUserName(task.assigneeId)} - Click to reassign`
            : 'Click to assign task'
          }
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          <h4 className="font-medium">Task Assignment</h4>
          <Separator />
          {users.map((user) => (
            <div
              key={user.id}
              className={cn(
                "flex items-center justify-between p-2 rounded cursor-pointer hover:bg-accent",
                task.assigneeId === user.id && "bg-blue-50 dark:bg-blue-950"
              )}
              onClick={() => handleUserSelect(user.id)}
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage 
                    src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                  />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
              </div>
              {task.assigneeId === user.id && (
                <Button size="sm" variant="secondary" className="h-6 w-6 p-0">
                  <IconCheck size={14} />
                </Button>
              )}
            </div>
          ))}

          {/* Option to unassign */}
          {task.assigneeId && (
            <>
              <Separator />
              <div
                className="p-2 rounded cursor-pointer hover:bg-accent"
                onClick={handleUnassign}
              >
                <p className="text-sm text-red-600">Unassign</p>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}