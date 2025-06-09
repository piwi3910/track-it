import { Badge } from '@/components/ui/badge';
import { IconMessageCircle2 } from '@tabler/icons-react';
import type { Task } from '@track-it/shared/types';

interface TaskMetadataProps {
  task: Task;
  commentCount: number;
  onViewConversation?: () => void;
}

/**
 * Component for displaying task metadata
 * Shows due date, comments count, and tags
 */
export function TaskMetadata({ task, commentCount, onViewConversation }: TaskMetadataProps) {
  return (
    <>
      {/* Due date */}
      {task.dueDate && (
        <p className="text-xs text-muted-foreground task-card-secondary-text">
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </p>
      )}

      {/* Comments indicator */}
      {commentCount > 0 && (
        <div 
          className="flex items-center gap-2 mt-2 cursor-pointer" 
          data-no-propagation="true" 
          onClick={() => onViewConversation?.()}
        >
          <IconMessageCircle2 size={12} />
          <p className="text-xs task-card-secondary-text">
            {commentCount} comment{commentCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3" data-no-propagation="true">
          {task.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-sm lowercase"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </>
  );
}