import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { IconPencil, IconRepeat } from '@tabler/icons-react';
import { useTheme } from '@/hooks/useTheme';
import { useTaskState } from '@/hooks/useTaskState';
import { useTaskTimeTracking } from '@/hooks/useTaskTimeTracking';
import { useCommentCount } from '@/hooks/useCommentCount';
import { TaskNumber } from '@/components/TaskNumber';
import { TaskAssignee } from '@/components/TaskAssignee';
import { TaskPrioritySelector } from '@/components/TaskPrioritySelector';
import { TaskTimeTracking } from '@/components/TaskTimeTracking';
import { TaskSubtasks } from '@/components/TaskSubtasks';
import { TaskMetadata } from '@/components/TaskMetadata';
import { TaskMenu } from '@/components/TaskMenu';
import type { Task } from '@track-it/shared/types';

// Define interfaces for properties that don't exist in the shared Task type
interface TaskRecurrence {
  pattern: string;
  interval?: number;
  endDate?: string | null;
}

// Get a human-readable description of the recurrence
const getRecurrenceDescription = (recurrence: TaskRecurrence): string => {
  if (!recurrence) return 'Not recurring';

  const { pattern, interval = 1 } = recurrence;

  switch (pattern) {
    case 'daily':
      return `Repeats daily${interval > 1 ? ` every ${interval} days` : ''}`;
    case 'weekly':
      return `Repeats weekly${interval > 1 ? ` every ${interval} weeks` : ''}`;
    case 'biweekly':
      return 'Repeats every 2 weeks';
    case 'monthly':
      return `Repeats monthly${interval > 1 ? ` every ${interval} months` : ''}`;
    case 'quarterly':
      return 'Repeats quarterly';
    case 'yearly':
      return `Repeats yearly${interval > 1 ? ` every ${interval} years` : ''}`;
    default:
      return 'Recurring task';
  }
};

interface TaskCardProps {
  task: Task;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewConversation?: () => void; // Handler for opening the conversation tab
}

// Inline editable title component
function EditableTitle({ value, onChange, onSave }: { 
  value: string; 
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);
  
  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          setEditing(false);
          onSave();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setEditing(false);
            onSave();
          } else if (e.key === 'Escape') {
            setEditing(false);
          }
        }}
        className="text-sm font-medium px-2 py-1 h-auto w-full"
      />
    );
  }
  
  return (
    <div className="flex items-center gap-1 cursor-pointer group">
      <h3 className="flex-1 text-sm font-medium task-card-title">{value}</h3>
      <Button 
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
      >
        <IconPencil size={12} />
      </Button>
    </div>
  );
}

function TaskCardContent({ task, onEdit, onDelete, onViewConversation }: TaskCardProps) {
  const { getPriorityColor } = useTheme();
  
  // Use custom hooks for managing state and logic
  const {
    localTask,
    handleTitleChange,
    handleSaveTitleChanges,
    handlePriorityChange,
    handleTimeChange,
    handleAssigneeChange,
    handleSubtaskToggle,
    handleAddSubtask,
    subtaskCount,
    completedSubtasks,
    subtaskProgress
  } = useTaskState({ task });
  
  const {
    isTimeTrackingActive,
    trackingTime,
    formatTrackingTime,
    handleToggleTimeTracking
  } = useTaskTimeTracking({ task });
  
  const { commentCount } = useCommentCount({ taskId: task.id });


  const renderCardContent = () => (
    <div className="task-card-content">
      {/* Menu and assigned profile in the top-right corner */}
      <div className="task-card-corner-top-right" style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        zIndex: 25
      }}>
        <TaskAssignee 
          task={localTask} 
          onAssigneeChange={handleAssigneeChange} 
        />
        <TaskMenu
          isTimeTrackingActive={isTimeTrackingActive}
          trackingTime={trackingTime}
          commentCount={commentCount}
          formatTrackingTime={formatTrackingTime}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewConversation={onViewConversation}
          onToggleTimeTracking={handleToggleTimeTracking}
          onAddSubtask={() => handleAddSubtask(onEdit)}
        />
      </div>

      {/* Task number in the top-left corner */}
      <TaskNumber taskNumber={localTask.taskNumber} />

      {/* Task Content */}
      <div style={{ paddingTop: 48 }}>
        {/* Recurrence indicator */}
        {localTask.recurrence && (
          <div className="flex items-center gap-2 mb-2" data-no-propagation="true">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-blue-600">
                  <IconRepeat size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{getRecurrenceDescription(localTask.recurrence)}</TooltipContent>
            </Tooltip>
          </div>
        )}

        <EditableTitle
          value={localTask.title}
          onChange={handleTitleChange}
          onSave={handleSaveTitleChanges}
        />
      </div>

      {/* Task metadata - simplified */}
      <div className="flex items-center justify-between mt-2" data-no-propagation="true">
        <TaskPrioritySelector 
          priority={localTask.priority} 
          onPriorityChange={handlePriorityChange} 
        />
        {localTask.dueDate && (
          <p className="text-xs text-muted-foreground task-card-secondary-text">
            Due: {new Date(localTask.dueDate).toLocaleDateString()}
          </p>
        )}
      </div>
      
      {/* Subtasks progress if available */}
      <TaskSubtasks
        task={localTask}
        subtaskCount={subtaskCount}
        completedSubtasks={completedSubtasks}
        subtaskProgress={subtaskProgress}
        onSubtaskToggle={handleSubtaskToggle}
        onEdit={onEdit}
      />
      
      {/* Time tracking */}
      <TaskTimeTracking
        task={localTask}
        isTracking={isTimeTrackingActive}
        trackingTime={trackingTime}
        formatTrackingTime={formatTrackingTime}
        onToggleTracking={handleToggleTimeTracking}
        onTimeChange={handleTimeChange}
      />
      
      {/* Comments and tags */}
      <TaskMetadata 
        task={localTask} 
        commentCount={commentCount} 
        onViewConversation={onViewConversation}
      />
    </div>
  );


  // Create data attributes for CSS targeting
  const cardDataAttributes = {
    'data-blocked': 'false', // No BLOCKED status in shared types
    'data-done': localTask.status === 'done' ? 'true' : 'false'
  };

  return (
    <div className="relative">
      {/* This transparent overlay is what handles the click to open the editor */}
      <div
        className="task-card-clickable-overlay"
        onClick={onEdit}
      />

      {/* The actual card content, all with higher z-index for interactive elements */}
      <div className="relative">
        
        <Card
          className={cn(
            "relative z-10 border-l-4",
            cardDataAttributes['data-done'] === 'true' && "opacity-75"
          )}
          style={{
            borderLeftColor: getPriorityColor(localTask.priority)
          }}
        >
          <CardContent className="p-4">
            {renderCardContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TaskCard(props: TaskCardProps) {
  return (
    <TooltipProvider>
      <TaskCardContent {...props} />
    </TooltipProvider>
  );
}