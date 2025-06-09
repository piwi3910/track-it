import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { notifications } from '@/components/ui/notifications';
import {
  IconPlus,
  IconCalendarEvent,
  IconCheck,
  IconAlarm,
  IconUser,
  IconTag,
  IconFlag,
} from '@tabler/icons-react';
import { useApp } from '@/hooks/useApp';
import { api } from '@/api';
import type { Task, User, TaskStatus, TaskPriority } from '@track-it/shared/types';

interface QuickAddTaskProps {
  defaultStatus?: TaskStatus;
  defaultDueDate?: Date | null;
  onTaskAdded?: (task?: Task) => void;
  hideStatus?: boolean;
}

function QuickAddTaskContent({
  defaultStatus = 'todo',
  defaultDueDate = null,
  onTaskAdded,
  hideStatus = false,
}: QuickAddTaskProps) {
  const { createTask } = useApp();
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [dueDate, setDueDate] = useState<Date | null>(defaultDueDate);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState<number | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Custom tags input state and handlers
  
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
    setTagInput('');
  };
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Fetch users for assignee dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api.admin.getAllUsers();
        setUsers(data as User[]);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    // Create task data with frontend enum types
    const taskData = {
      taskNumber: Date.now(), // Temporary task number, will be replaced by backend
      title: title.trim(),
      status,
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: tags,
      creatorId: '', // Will be set by backend
      timeTrackingActive: false,
      trackingTimeSeconds: 0,
      savedAsTemplate: false,
      archived: false,
      dueDate: dueDate ? dueDate.toISOString() : null,
      assigneeId: assigneeId || null,
      estimatedHours: estimatedHours || null,
    };

    try {
      // @ts-expect-error - Temporary bypass for enum type mismatch
      const newTask = await createTask(taskData);
      
      if (newTask) {
        // Show success notification
        notifications.show({
          title: 'Task Created',
          message: `"${title.trim()}" has been added to ${status}.`,
          color: 'green',
        });
        
        // Reset form only on success
        setTitle('');
        setDueDate(defaultDueDate);
        setPriority('medium');
        setAssigneeId(null);
        setTags([]);
        setEstimatedHours(undefined);
        setDetailsOpen(false);
        
        // Callback with the created task, adding taskNumber if missing
        const taskWithNumber = {
          ...newTask,
          taskNumber: (newTask as unknown as Task & { taskNumber?: number }).taskNumber || Date.now()
        } as unknown as Task;
        if (onTaskAdded) onTaskAdded(taskWithNumber);
      } else {
        notifications.show({
          title: 'Failed to Create Task',
          message: 'There was an error creating the task. Please try again.',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred while creating the task.',
        color: 'red',
      });
    }
  };

  const statusOptions = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'in_review', label: 'In Review' },
    { value: 'done', label: 'Done' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'blue' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'urgent', label: 'Urgent', color: 'red' },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Input
            placeholder="Add a new task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          
          <Popover 
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0"
                    onClick={() => setDetailsOpen((o) => !o)}
                  >
                    <IconPlus size={16} />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>More details</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {!hideStatus && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <IconCheck size={16} />
                        Status
                      </Label>
                      <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <IconFlag size={16} />
                      Priority
                    </Label>
                    <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <IconCalendarEvent size={16} />
                      Due Date
                    </Label>
                    <DatePicker
                      placeholder="Select date"
                      value={dueDate}
                      onChange={setDueDate}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <IconAlarm size={16} />
                      Estimated Hours
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g. 2.5"
                      value={estimatedHours?.toString() || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setEstimatedHours(isNaN(value) ? undefined : value);
                      }}
                      step={0.5}
                      min={0}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <IconUser size={16} />
                    Assign To
                  </Label>
                  <Select value={assigneeId || undefined} onValueChange={(value) => setAssigneeId(value || null)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <IconTag size={16} />
                    Tags
                  </Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Add tags..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag(tagInput);
                        } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
                          removeTag(tags[tags.length - 1]);
                        }
                      }}
                    />
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeTag(tag)}
                          >
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button onClick={handleSubmit}>Add Task</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function QuickAddTask(props: QuickAddTaskProps) {
  return (
    <TooltipProvider>
      <QuickAddTaskContent {...props} />
    </TooltipProvider>
  );
}