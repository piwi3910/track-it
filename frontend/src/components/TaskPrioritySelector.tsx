import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { IconCheck } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import type { TaskPriority } from '@track-it/shared/types';

interface TaskPrioritySelectorProps {
  priority: TaskPriority;
  onPriorityChange: (priority: string) => void;
}

/**
 * Component for displaying and changing task priority
 * Shows priority badge with selection popover
 */
export function TaskPrioritySelector({ priority, onPriorityChange }: TaskPrioritySelectorProps) {
  const [priorityPopoverOpened, setPriorityPopoverOpened] = useState(false);

  const handlePriorityChange = (newPriority: string) => {
    onPriorityChange(newPriority);
    setPriorityPopoverOpened(false);
  };

  const getPriorityBadgeStyles = (priorityValue: string) => {
    switch (priorityValue.toLowerCase()) {
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return '';
    }
  };

  return (
    <Popover
      open={priorityPopoverOpened}
      onOpenChange={setPriorityPopoverOpened}
    >
      <PopoverTrigger asChild>
        <Badge
          variant={priority === 'urgent' ? 'destructive' : 'secondary'}
          className={cn(
            'cursor-pointer',
            getPriorityBadgeStyles(priority)
          )}
          onClick={(e) => {
            e.stopPropagation();
            setPriorityPopoverOpened(true);
          }}
        >
          {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-48">
        <div className="space-y-2">
          {['low', 'medium', 'high', 'urgent'].map((priorityOption) => (
            <div
              key={priorityOption}
              className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-accent"
              onClick={() => handlePriorityChange(priorityOption)}
            >
              <Badge 
                variant={priorityOption === 'urgent' ? 'destructive' : 'secondary'}
                className={cn(getPriorityBadgeStyles(priorityOption))}
              >
                {priorityOption.charAt(0).toUpperCase() + priorityOption.slice(1)}
              </Badge>
              {priority.toLowerCase() === priorityOption && <IconCheck size={14} />}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}