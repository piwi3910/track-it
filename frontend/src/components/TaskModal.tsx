import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  IconPlus,
  IconTrash,
  IconSubtask,
  IconRepeat,
  IconCalendarEvent,
  IconCalendar,
  IconMessageCircle2,
  IconCopy
} from '@tabler/icons-react';
import { TaskChat } from './TaskChat';
import { api } from '@/api';
import type { Task, TaskStatus, TaskPriority } from '@track-it/shared/types';
import { logger } from '@/services/logger.service';

// Define interfaces for properties that don't exist in the shared Task type
interface TaskRecurrence {
  pattern: string;
  interval?: number;
  endDate?: string | null;
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<Task>) => void;
  task: Task | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface TaskWithConversation extends Task {
  openConversation?: boolean;
}

function TaskModalContent({ opened, onClose, onSubmit, task }: TaskModalProps) {
  // Check if we should open the conversation tab directly
  const taskWithConversation = task as TaskWithConversation | null;
  const initialTab = taskWithConversation?.openConversation ? 'conversation' : 'details';
  const [activeTab, setActiveTab] = useState<string | null>(initialTab);
  const [commentCount, setCommentCount] = useState(0);
  const [users, setUsers] = useState<User[]>([]);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | null;
    startDate: string | null;
    endDate: string | null;
    isMultiDay: boolean;
    tags: string[];
    assignee: string;
    subtasks: Subtask[];
    estimatedHours: number | undefined;
    actualHours: number | undefined;
    recurrence: TaskRecurrence | null;
    isRecurring: boolean;
  }>({
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    dueDate: null,
    startDate: null,
    endDate: null,
    isMultiDay: false,
    tags: [],
    assignee: '',
    subtasks: [],
    estimatedHours: undefined,
    actualHours: undefined,
    recurrence: null,
    isRecurring: false,
  });

  // Reset form when the modal opens/closes or task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: (task.status?.toLowerCase() || 'todo') as TaskStatus,
        priority: (task.priority?.toLowerCase() || 'medium') as TaskPriority,
        dueDate: task.dueDate || null,
        startDate: null, // Property doesn't exist in shared Task type
        endDate: null, // Property doesn't exist in shared Task type
        isMultiDay: false, // Property doesn't exist in shared Task type
        tags: task.tags || [],
        assignee: task.assigneeId || '',
        subtasks: [], // Using empty array since subtasks structure is different
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        recurrence: null, // Property doesn't exist in shared Task type
        isRecurring: false, // Property doesn't exist in shared Task type
      });

      // Fetch comment count when task changes
      const fetchCommentCount = async () => {
        try {
          const count = await api.comments.getCountByTaskId(task.id);
          if (count !== null && typeof count === 'number') {
            setCommentCount(count);
          }
        } catch (error) {
          logger.error('Failed to fetch comment count', error);
        }
      };

      if (task.id) {
        fetchCommentCount();
      }

      // Set the active tab based on the task object flag
      const taskWithConv = task as TaskWithConversation;
      if (taskWithConv.openConversation) {
        setActiveTab('conversation');
        // Reset the flag
        taskWithConv.openConversation = false;
      } else {
        setActiveTab('details');
      }
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'todo' as TaskStatus,
        priority: 'medium' as TaskPriority,
        dueDate: null,
        startDate: null,
        endDate: null,
        isMultiDay: false,
        tags: [],
        assignee: '',
        subtasks: [],
        estimatedHours: undefined,
        actualHours: undefined,
        recurrence: null,
        isRecurring: false,
      });

      // For new tasks, always start with details
      setActiveTab('details');
    }
  }, [task, opened]);

  // Fetch users for assignee dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api.admin.getAllUsers();
        setUsers(data as User[]);
      } catch (error) {
        logger.error('Error fetching users', error);
      }
    };

    fetchUsers();
  }, []);


  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    logger.debug('TaskModal handleSubmit called with formData:', { formData });

    // Basic validation
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }

    // Prepare recurrence data
    const recurrenceData = formData.isRecurring ? formData.recurrence : null;

    // Handle multi-day task data appropriately
    let taskData = {
      ...formData,
      id: task?.id, // Keep the ID if we're editing
      recurrence: recurrenceData,
      assigneeId: formData.assignee || null
    };

    if (formData.isMultiDay) {
      // For multi-day tasks, use startDate and endDate
      taskData = {
        ...taskData,
        startDate: formData.startDate,
        endDate: formData.endDate,
        dueDate: formData.endDate, // Set dueDate to endDate for compatibility
        isMultiDay: true
      };
    } else {
      // For single-day tasks, clear multi-day fields
      taskData = {
        ...taskData,
        startDate: null,
        endDate: null,
        isMultiDay: false
      };
    }

    logger.debug('TaskModal calling onSubmit with taskData:', { taskData });
    // @ts-expect-error - Temporary bypass for type mismatch with extra properties
    onSubmit(taskData);
  };

  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle adding a new subtask
  const handleAddSubtask = () => {
    setFormData(prev => ({
      ...prev,
      subtasks: [
        ...prev.subtasks,
        { id: `subtask-${Date.now()}`, title: '', completed: false }
      ]
    }));
  };

  // Handle changing a subtask
  const handleSubtaskChange = (id: string, field: keyof Subtask, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(subtask =>
        subtask.id === id ? { ...subtask, [field]: value } : subtask
      )
    }));
  };

  // Handle removing a subtask
  const handleRemoveSubtask = (id: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(subtask => subtask.id !== id)
    }));
  };

  // Handle toggling recurrence
  const handleToggleRecurrence = (isRecurring: boolean) => {
    setFormData(prev => ({
      ...prev,
      isRecurring,
      recurrence: isRecurring ?
        (prev.recurrence || { pattern: 'weekly', interval: 1 }) :
        null
    }));
  };

  // Handle recurrence change
  const handleRecurrenceChange = (field: keyof TaskRecurrence, value: TaskRecurrence[keyof TaskRecurrence]) => {
    setFormData(prev => ({
      ...prev,
      recurrence: {
        ...(prev.recurrence || { pattern: 'weekly', interval: 1 }),
        [field]: value
      }
    }));
  };

  // Create a human-readable summary of the recurrence pattern
  const getRecurrenceSummary = (recurrence: TaskRecurrence | null): string => {
    if (!recurrence) return 'No recurrence';

    const { pattern, interval = 1, daysOfWeek, dayOfMonth, endDate } = recurrence;

    let summary = `Repeats ${interval > 1 ? `every ${interval} ` : 'every '}`;

    switch (pattern) {
      case 'daily':
        summary += `day${interval > 1 ? 's' : ''}`;
        break;
      case 'weekly':
        summary += `week${interval > 1 ? 's' : ''}`;
        if (daysOfWeek && daysOfWeek.length > 0) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const selectedDays = daysOfWeek.map(d => dayNames[d]).join(', ');
          summary += ` on ${selectedDays}`;
        }
        break;
      case 'biweekly':
        summary = 'Repeats every 2 weeks';
        break;
      case 'monthly':
        summary += `month${interval > 1 ? 's' : ''}`;
        if (dayOfMonth) {
          summary += ` on day ${dayOfMonth}`;
        }
        break;
      case 'quarterly':
        summary = 'Repeats every 3 months';
        break;
      case 'yearly':
        summary += `year${interval > 1 ? 's' : ''}`;
        break;
    }

    if (endDate) {
      summary += ` until ${new Date(endDate).toLocaleDateString()}`;
    }

    return summary;
  };


  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px]" style={{ zIndex: 200 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{task ? 'Edit Task' : 'Create New Task'}</span>
            {task && task.id && (
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-sm cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(task.id);
                    alert('ID copied to clipboard!');
                  }}
                >
                  {task.id.replace('task', '')}
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(task.id);
                          alert('ID copied to clipboard!');
                        }}
                      >
                        <IconCopy size={14} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy ID to clipboard</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
      <div className="flex justify-between mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="subtasks">
              <IconSubtask className="mr-2 h-4 w-4" />
              Subtasks {formData.subtasks.length > 0 ? `(${formData.subtasks.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="recurrence">
              <IconRepeat className="mr-2 h-4 w-4" />
              Recurrence {formData.isRecurring ? '(Active)' : ''}
            </TabsTrigger>
            {task && task.id && (
              <>
                <TabsTrigger value="time">Time Tracking</TabsTrigger>
                <TabsTrigger value="conversation">
                  <IconMessageCircle2 className="mr-2 h-4 w-4" />
                  Conversation {commentCount > 0 && (
                    <Badge className="text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ml-1">
                      {commentCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </Tabs>

      </div>

      <TabsContent value="details">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Task title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Task description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleChange('priority', value)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="multi-day-task"
                checked={formData.isMultiDay}
                onCheckedChange={(checked) => handleChange('isMultiDay', checked)}
              />
              <Label htmlFor="multi-day-task">Multi-day task</Label>
            </div>

            {!formData.isMultiDay ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dueDate && "text-muted-foreground"
                        )}
                      >
                        <IconCalendarEvent className="mr-2 h-4 w-4" />
                        {formData.dueDate ? format(new Date(formData.dueDate), "PPP") : "Select due date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.dueDate ? new Date(formData.dueDate) : undefined}
                        onSelect={(date) => {
                          const dateStr = date ? date.toISOString().split('T')[0] : null;
                          handleChange('dueDate', dateStr);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.startDate && "text-muted-foreground"
                        )}
                      >
                        <IconCalendarEvent className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(new Date(formData.startDate), "PPP") : "Select start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate ? new Date(formData.startDate) : undefined}
                        onSelect={(date) => {
                          const dateStr = date ? date.toISOString().split('T')[0] : null;
                          handleChange('startDate', dateStr);

                          // If end date is not set or is before start date, set it to start date
                          if (dateStr && (!formData.endDate || new Date(dateStr) > new Date(formData.endDate))) {
                            handleChange('endDate', dateStr);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.endDate && "text-muted-foreground"
                        )}
                      >
                        <IconCalendarEvent className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(new Date(formData.endDate), "PPP") : "Select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate ? new Date(formData.endDate) : undefined}
                        onSelect={(date) => {
                          const dateStr = date ? date.toISOString().split('T')[0] : null;
                          handleChange('endDate', dateStr);
                        }}
                        disabled={(date) => formData.startDate ? date < new Date(formData.startDate) : false}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="assignee">Assignee</Label>
              <Select
                value={formData.assignee}
                onValueChange={(value) => handleChange('assignee', value)}
              >
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.role}</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="px-2 py-1">
                      {tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                        onClick={() => {
                          const newTags = formData.tags.filter((_, i) => i !== index);
                          handleChange('tags', newTags);
                        }}
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                </div>
                <Input
                  id="tags"
                  placeholder="Enter tag and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      const tag = input.value.trim();
                      if (tag && !formData.tags.includes(tag)) {
                        handleChange('tags', [...formData.tags, tag]);
                        input.value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Task</Button>
            </div>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="subtasks">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Subtasks</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.subtasks.filter(s => s.completed).length}/{formData.subtasks.length} completed
                  </p>
                </div>
                <Separator />

                {formData.subtasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No subtasks yet. Add subtasks to break down this task into smaller steps.
                  </p>
                ) : (
                <>
                  {/* Display completed subtasks at the bottom */}
                  {[...formData.subtasks]
                    .sort((a, b) => {
                      if (a.completed === b.completed) return 0;
                      return a.completed ? 1 : -1;
                    })
                      .map((subtask) => (
                        <div key={subtask.id} className="flex items-start gap-3">
                          <Checkbox
                            id={`subtask-${subtask.id}`}
                            checked={subtask.completed}
                            onCheckedChange={(checked) => handleSubtaskChange(subtask.id, 'completed', !!checked)}
                            className="mt-2"
                          />
                          <Input
                            className={cn(
                              "flex-1",
                              subtask.completed && "line-through opacity-70"
                            )}
                            placeholder="Subtask description"
                            value={subtask.title}
                            onChange={(e) => handleSubtaskChange(subtask.id, 'title', e.target.value)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleRemoveSubtask(subtask.id)}
                          >
                            <IconTrash size={16} />
                          </Button>
                        </div>
                      ))
                  }

                    {/* Show progress bar */}
                    {formData.subtasks.length > 0 && (
                      <Progress
                        value={(formData.subtasks.filter(s => s.completed).length / formData.subtasks.length) * 100}
                        className="w-full"
                      />
                    )}
                  </>
                )}

                <Button
                  variant="outline"
                  onClick={handleAddSubtask}
                >
                  <IconPlus size={14} className="mr-2 h-4 w-4" />
                  Add Subtask
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Task</Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="recurrence">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Recurring Task</p>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-recurrence"
                      checked={formData.isRecurring}
                      onCheckedChange={handleToggleRecurrence}
                    />
                    <Label htmlFor="enable-recurrence">Enable recurrence</Label>
                  </div>
                </div>
                <Separator />

                {formData.isRecurring ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="recurrence-pattern">Recurrence Pattern</Label>
                      <Select
                        value={formData.recurrence?.pattern || 'weekly'}
                        onValueChange={(value) => handleRecurrenceChange('pattern', value)}
                      >
                        <SelectTrigger id="recurrence-pattern">
                          <IconRepeat className="mr-2 h-4 w-4" />
                          <SelectValue placeholder="Select pattern" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="interval">Interval</Label>
                      <Input
                        id="interval"
                        type="number"
                        placeholder="Repeat every X"
                        value={formData.recurrence?.interval || 1}
                        onChange={(e) => handleRecurrenceChange('interval', parseInt(e.target.value) || 1)}
                        min={1}
                        max={99}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Repeat every {formData.recurrence?.interval || 1} {formData.recurrence?.pattern || 'week(s)'}
                      </p>
                    </div>

                    {formData.recurrence?.pattern === 'weekly' && (
                      <div className="space-y-2">
                        <Label>Days of Week</Label>
                        <div className="flex gap-2 flex-wrap">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                          const isSelected = formData.recurrence?.daysOfWeek?.includes(index);
                          return (
                            <Badge
                              key={day}
                              variant={isSelected ? 'default' : 'outline'}
                              className={isSelected ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                const currentDays = formData.recurrence?.daysOfWeek || [];
                                const newDays = isSelected
                                  ? currentDays.filter(d => d !== index)
                                  : [...currentDays, index];
                                handleRecurrenceChange('daysOfWeek', newDays);
                              }}
                            >
                              {day}
                            </Badge>
                          );
                        })}
                        </div>
                      </div>
                    )}

                    {formData.recurrence?.pattern === 'monthly' && (
                      <div>
                        <Label htmlFor="day-of-month">Day of Month</Label>
                        <Input
                          id="day-of-month"
                          type="number"
                          placeholder="Day of month"
                          value={formData.recurrence?.dayOfMonth || 1}
                          onChange={(e) => handleRecurrenceChange('dayOfMonth', parseInt(e.target.value) || 1)}
                          min={1}
                          max={31}
                        />
                      </div>
                    )}

                    <div>
                      <Label>End Date (Optional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.recurrence?.endDate && "text-muted-foreground"
                            )}
                          >
                            <IconCalendar className="mr-2 h-4 w-4" />
                            {formData.recurrence?.endDate ? format(new Date(formData.recurrence.endDate), "PPP") : "When should recurrence end?"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.recurrence?.endDate ? new Date(formData.recurrence.endDate) : undefined}
                            onSelect={(date) => {
                              const dateStr = date ? date.toISOString().split('T')[0] : null;
                              handleRecurrenceChange('endDate', dateStr);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <IconCalendarEvent size={16} />
                          <p className="text-sm">
                            {getRecurrenceSummary(formData.recurrence)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Enable recurrence to make this task repeat automatically.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Task</Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="time">
        {task && task.id && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <p className="font-medium">Time Tracking</p>
                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimated-hours">Estimated Hours</Label>
                    <Input
                      id="estimated-hours"
                      type="number"
                      placeholder="Enter estimated hours"
                      value={formData.estimatedHours || ''}
                      onChange={(e) => handleChange('estimatedHours', parseFloat(e.target.value) || undefined)}
                      min={0}
                      step={0.5}
                    />
                  </div>

                  <div>
                    <Label htmlFor="actual-hours">Actual Hours</Label>
                    <Input
                      id="actual-hours"
                      type="number"
                      placeholder="Enter actual hours spent"
                      value={formData.actualHours || ''}
                      onChange={(e) => handleChange('actualHours', parseFloat(e.target.value) || undefined)}
                      min={0}
                      step={0.5}
                    />
                  </div>
                </div>

                {formData.estimatedHours && formData.actualHours ? (
                  <Card className={formData.actualHours > formData.estimatedHours ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'}>
                    <CardContent className="p-3">
                      <p className="text-sm">
                        {formData.actualHours > formData.estimatedHours
                          ? `Over estimate by ${(formData.actualHours - formData.estimatedHours).toFixed(1)} hours`
                          : `Under estimate by ${(formData.estimatedHours - formData.actualHours).toFixed(1)} hours`}
                      </p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Task</Button>
          </div>
        </div>
        )}
      </TabsContent>

      <TabsContent value="conversation">
        {task && task.id && (
        <div className="space-y-4">
          <TaskChat
            taskId={task.id}
            onCommentCountChange={(count) => setCommentCount(count)}
          />

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
        )}
      </TabsContent>
      </DialogContent>
    </Dialog>
  );
}

export default function TaskModal(props: TaskModalProps) {
  return (
    <TooltipProvider>
      <TaskModalContent {...props} />
    </TooltipProvider>
  );
}