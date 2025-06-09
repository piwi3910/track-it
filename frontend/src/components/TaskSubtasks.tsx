import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { IconSubtask } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import type { Task } from '@track-it/shared/types';

interface TaskSubtasksProps {
  task: Task;
  subtaskCount: number;
  completedSubtasks: number;
  subtaskProgress: number;
  onSubtaskToggle: (subtaskId: string, completed: boolean) => void;
  onEdit?: () => void;
}

/**
 * Component for displaying and managing task subtasks
 * Shows progress bar and subtask list in a popover
 */
export function TaskSubtasks({ 
  task, 
  subtaskCount, 
  completedSubtasks, 
  subtaskProgress,
  onSubtaskToggle,
  onEdit 
}: TaskSubtasksProps) {
  if (subtaskCount === 0) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="mt-2 cursor-pointer" data-no-propagation="true" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2 mb-1">
            <IconSubtask size={12} />
            <p className="text-xs task-card-secondary-text">{completedSubtasks}/{subtaskCount} subtasks</p>
          </div>
          <Progress
            value={subtaskProgress}
            className="h-2"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          <h4 className="font-medium">Subtasks</h4>
          <Separator />
          {task.subtasks?.map((subtask) => (
            <div key={subtask.id} className="flex items-start gap-2">
              <Checkbox
                id={`subtask-${subtask.id}`}
                checked={('completed' in subtask && Boolean(subtask.completed)) || false}
                onCheckedChange={(checked) => {
                  onSubtaskToggle(subtask.id, !!checked);
                }}
                className="mt-[3px]"
              />
              <p className={cn(
                "text-sm task-card-secondary-text",
                ('completed' in subtask && subtask.completed) && "line-through opacity-70"
              )}>
                {subtask.title}
              </p>
            </div>
          ))}
          {onEdit && (
            <Button
              size="sm"
              variant="secondary"
              className="h-6 text-xs"
              onClick={() => {
                onEdit();
              }}
            >
              <IconSubtask size={14} className="mr-2 h-4 w-4" />
              Manage Subtasks
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}