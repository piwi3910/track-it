import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  IconClock, 
  IconHourglass, 
  IconPlayerPlay, 
  IconPlayerStop, 
  IconCheck 
} from '@tabler/icons-react';
import type { Task } from '@track-it/shared/types';

interface TaskTimeTrackingProps {
  task: Task;
  isTracking: boolean;
  trackingTime: number;
  formatTrackingTime: (time: number) => string;
  onToggleTracking: () => void;
  onTimeChange: (field: 'estimatedHours' | 'actualHours', value: number) => void;
}

/**
 * Component for displaying and managing task time tracking
 * Shows estimated/actual hours with time tracking controls
 */
export function TaskTimeTracking({ 
  task, 
  isTracking, 
  trackingTime, 
  formatTrackingTime, 
  onToggleTracking, 
  onTimeChange 
}: TaskTimeTrackingProps) {
  const [timePopoverOpened, setTimePopoverOpened] = useState(false);

  const handleSaveTimeChanges = () => {
    setTimePopoverOpened(false);
  };

  return (
    <Popover
      open={timePopoverOpened}
      onOpenChange={setTimePopoverOpened}
    >
      <PopoverTrigger asChild>
        <div
          className="flex items-center gap-2 mt-2 cursor-pointer"
          onClick={() => {
            setTimePopoverOpened(true);
          }}
          data-no-propagation="true"
        >
          <IconClock size={12} />
          <p className="text-xs task-card-secondary-text">
            {task.actualHours ? `${task.actualHours}h spent` : ''}
            {task.actualHours && task.estimatedHours ? ' / ' : ''}
            {task.estimatedHours ? `${task.estimatedHours}h estimated` : ''}
            {!task.actualHours && !task.estimatedHours ? 'Set time tracking...' : ''}
          </p>
          {isTracking && (
            <Badge variant="destructive" className="text-xs h-5">
              {formatTrackingTime(trackingTime)}
            </Badge>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Estimated Hours</label>
            <div className="relative">
              <IconHourglass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Enter estimated hours"
                value={task.estimatedHours || ''}
                onChange={(e) => onTimeChange('estimatedHours', parseFloat(e.target.value) || 0)}
                min={0}
                step={0.5}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Actual Hours Spent</label>
            <div className="relative">
              <IconClock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Enter actual hours spent"
                value={task.actualHours || ''}
                onChange={(e) => onTimeChange('actualHours', parseFloat(e.target.value) || 0)}
                min={0}
                step={0.5}
                className="pl-10"
              />
            </div>
          </div>

          {/* Time tracking buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isTracking ? 'destructive' : 'secondary'}
              className="h-6 text-xs"
              onClick={() => {
                onToggleTracking();
              }}
            >
              {isTracking ? <IconPlayerStop size={14} className="mr-2 h-4 w-4" /> : <IconPlayerPlay size={14} className="mr-2 h-4 w-4" />}
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </Button>

            {trackingTime > 0 && (
              <p className="text-sm font-medium">
                {formatTrackingTime(trackingTime)}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSaveTimeChanges}
            >
              <IconCheck size={16} className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}