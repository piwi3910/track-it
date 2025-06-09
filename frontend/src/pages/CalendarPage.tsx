import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  IconPlus,
  IconCalendarEvent,
  IconClockHour4,
  IconCirclePlus,
  IconWeight,
  IconListDetails,
  IconEdit,
  IconCalendarTime,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCalendarMonth,
  IconCalendarWeek,
  IconCalendar, // Using IconCalendar instead of IconCalendarDay which isn't available
} from '@tabler/icons-react';
import QuickAddTask from '@/components/QuickAddTask';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import TaskModal from '@/components/TaskModal';
import type { Task } from '@/types/task';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/hooks/useApp';
import { useGoogle } from '@/hooks/useGoogle';


// Extended Task interface with multi-day display properties
interface TaskWithMultiDayInfo extends Task {
  _isFirstDay?: boolean;
  _isLastDay?: boolean;
  _isMiddleDay?: boolean;
  _totalDays?: number;
}

// Map to get tasks by date
const getTasksByDate = (tasks: Task[]) => {
  const taskMap: Record<string, TaskWithMultiDayInfo[]> = {};

  tasks.forEach(task => {
    if (task.isMultiDay && task.startDate && task.endDate) {
      // For multi-day tasks, add the task to each day between startDate and endDate
      const startDate = new Date(task.startDate);
      const endDate = new Date(task.endDate);

      // Iterate through each day between start and end dates
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (!taskMap[dateStr]) {
          taskMap[dateStr] = [];
        }

        // Create a special property to indicate which part of the multi-day task this is
        const isFirstDay = dateStr === task.startDate;
        const isLastDay = dateStr === task.endDate;

        // Add the task with multi-day specific properties
        const extendedTask: TaskWithMultiDayInfo = {
          ...task,
          // Store multi-day info in a separate property
          _isFirstDay: isFirstDay,
          _isLastDay: isLastDay,
          _isMiddleDay: !isFirstDay && !isLastDay,
          _totalDays: Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        };
        taskMap[dateStr].push(extendedTask);

        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (task.dueDate) {
      // For regular tasks, just add to the due date
      // Extract just the date part (YYYY-MM-DD) from the ISO string
      const date = task.dueDate.split('T')[0];
      if (!taskMap[date]) {
        taskMap[date] = [];
      }
      taskMap[date].push(task);
    }
  });

  return taskMap;
};

// Generate calendar days
const getDaysInMonth = (year: number, month: number) => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

// Get days in current week
const getDaysInWeek = (inputDate: Date) => {
  const date = new Date(inputDate);
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday

  // Calculate the start of the week (Sunday)
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - day);

  // Generate all 7 days of the week
  const days = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    days.push(currentDate);
  }

  return days;
};

// Format a time (hours and minutes)
const formatTime = (hours: number, minutes: number = 0) => {
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 || 12; // Convert 0 to 12 for 12AM
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  return `${hour}:${minutesStr} ${period}`;
};

// Get hour slots for day view
const getHourSlots = () => {
  const slots = [];
  for (let i = 0; i < 24; i++) {
    slots.push({
      hour: i,
      label: formatTime(i)
    });
  }
  return slots;
};

// Day Detail Modal to show all tasks for a day
function DayDetailModal({
  day,
  tasks,
  opened,
  onClose,
  onAddTask,
  onViewTask
}: {
  day: Date | null;
  tasks: Task[];
  opened: boolean;
  onClose: () => void;
  onAddTask: (day: Date) => void;
  onViewTask: (task: Task) => void;
}) {
  // Theme removed - using Tailwind classes instead

  if (!day) return null;

  // Group tasks by source and priority
  const googleTasks = tasks.filter(task => task.source === 'google');
  const appTasks = tasks.filter(task => !task.source || task.source === 'app');

  // Sort tasks by priority
  const sortedAppTasks = [...appTasks].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Format the date
  const formattedDate = day.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isToday = new Date().toDateString() === day.toDateString();
  const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <IconCalendarTime size={20} />
              <span className="font-semibold">
                {formattedDate}
                {isToday && <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ml-2">Today</Badge>}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            onClick={() => onAddTask(day)}
            disabled={isPast}
          >
            <IconPlus size={14} className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>

        {tasks.length === 0 ? (
          <Card className="bg-gray-50 dark:bg-gray-900">
            <CardContent className="flex flex-col items-center py-12">
              <IconListDetails size={40} className="opacity-30" />
              <p className="text-muted-foreground">No tasks for this day</p>
              {!isPast && (
                <Button variant="secondary" onClick={() => onAddTask(day)} className="mt-4">
                  Add a task
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {googleTasks.length > 0 && (
              <>
                <p className="text-sm font-semibold text-muted-foreground">CALENDAR EVENTS</p>
                <div className="space-y-2">
                  {googleTasks.map(task => (
                    <Card
                      key={task.id}
                      className="p-3 border"
                      style={{
                        backgroundColor: '#e8f5e9',
                        cursor: 'pointer'
                      }}
                      onClick={() => onViewTask(task)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconCalendarEvent size={16} color="#43a047" style={{ flexShrink: 0 }} />
                          <div>
                            <p className="text-sm font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                          e.stopPropagation();
                          onViewTask(task);
                        }}>
                          <IconEdit size={16} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
                <Separator className="my-2" />
              </>
            )}

            {sortedAppTasks.length > 0 && (
              <>
                <p className="text-sm font-semibold text-muted-foreground">TASKS</p>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {sortedAppTasks.map(task => (
                      <Card
                        key={task.id}
                        className="p-3 border cursor-pointer"
                        style={{
                          borderLeft: `4px solid ${
                            task.priority === 'high' ? '#f97316' :
                            task.priority === 'urgent' ? '#ef4444' :
                            task.priority === 'medium' ? '#eab308' :
                            '#3b82f6'
                          }`
                        }}
                        onClick={() => onViewTask(task)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={task.priority === 'urgent' ? 'destructive' : 'secondary'}
                                className={`text-xs h-5 ${
                                  task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                  task.priority === 'low' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  ''
                                }`}>
                                {task.priority}
                              </Badge>
                              <Badge 
                                className={`text-xs h-5 ${
                                  task.status === 'done' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  task.status === 'in_review' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                  task.status === 'todo' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                  ''
                                }`}
                                variant="secondary">
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="font-medium mt-2">{task.title}</p>
                            {task.isMultiDay && (
                              <div className="flex items-center gap-1 mt-1">
                                <Badge className="text-xs h-5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Multi-day</Badge>
                                <p className="text-xs text-muted-foreground">
                                  {task.startDate && task.endDate
                                    ? `${new Date(task.startDate).toLocaleDateString()} - ${new Date(task.endDate).toLocaleDateString()}`
                                    : ''
                                  }
                                </p>
                              </div>
                            )}
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {task.estimatedHours && (
                                <div className="flex items-center gap-1">
                                  <IconClockHour4 size={14} color="#777" />
                                  <p className="text-xs text-muted-foreground">Est: {task.estimatedHours}h</p>
                                </div>
                              )}
                              {task.weight && (
                                <div className="flex items-center gap-1">
                                  <IconWeight size={14} color="#777" />
                                  <p className="text-xs text-muted-foreground">Weight: {task.weight}</p>
                                </div>
                              )}
                              {task.tags && task.tags.length > 0 && (
                                <div className="flex items-center gap-1">
                                  {task.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs h-5">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                            e.stopPropagation();
                            onViewTask(task);
                          }}>
                            <IconEdit size={16} />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        )}
      </div>
      </DialogContent>
    </Dialog>
  );
}

// Day cell component with hover effects and zoomed overlay
function DayCell({
  day,
  isToday,
  isPast,
  backgroundColor,
  onClick,
  onDateClick,
  children,
  allDayTasks,
  onViewTask
}: {
  day: Date;
  isToday: boolean;
  isPast: boolean;
  backgroundColor: string;
  onClick: () => void; // For adding a task
  onDateClick: () => void; // For viewing day detail
  children: React.ReactNode;
  allDayTasks: TaskWithMultiDayInfo[]; // All tasks for this day
  onViewTask: (task: Task) => void; // To view a specific task
}) {
  const [hovered, setHovered] = useState(false);
  // Theme removed - using Tailwind classes instead
  
  // Group tasks by source for the overlay
  const googleTasks = allDayTasks.filter(task => task.source === 'google');
  const appTasks = allDayTasks.filter(task => !task.source || task.source === 'app');
  
  // Sort app tasks by priority
  const sortedAppTasks = [...appTasks].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const hasTasksToShow = allDayTasks.length > 0;

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="border rounded-lg p-2"
        style={{
          minHeight: '150px',
          backgroundColor,
          opacity: isPast ? 0.95 : 1,
          cursor: isPast ? 'default' : 'pointer',
          position: 'relative',
          transition: 'transform 0.1s ease, box-shadow 0.1s ease',
          transform: hovered && !isPast ? 'translateY(-2px)' : 'none',
          boxShadow: hovered && !isPast ? '0 4px 8px rgba(0,0,0,0.1)' : 'none',
          zIndex: 1
        }}
        onClick={isPast ? undefined : onClick}
      >
        {hovered && !isPast && (
          <Button
            variant="default"
            size="icon"
            className="absolute top-2 right-2 z-[2] h-8 w-8 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <IconCirclePlus size={16} />
          </Button>
        )}
        {/* We replace the children prop with our custom implementation */}
        <div className="flex items-center justify-between mb-6">
          <p
            className={`${isToday ? "text-base font-bold" : "text-sm font-normal"} cursor-pointer`}
            onClick={(e) => {
              e.stopPropagation();
              onDateClick();
            }}
          >
            {day.getDate()}
          </p>
          {isToday && <Badge className="text-xs h-5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Today</Badge>}
        </div>

        {/* Render the task items */}
        {children}
      </div>
      
      {/* Zoomed overlay popup when hovering */}
      {hovered && hasTasksToShow && (
        <div
          className="absolute w-80 -top-2.5 bg-white dark:bg-gray-950 border rounded-lg shadow-md p-3 overflow-hidden"
          style={{
            // Check if day is close to the right edge (columns 5-6 in a 7-column grid)
            ...(day.getDay() >= 5 ?
              { right: '100%', marginRight: '10px' } : // Position to the left for days close to right edge
              { left: '100%', marginLeft: '10px' }     // Position to the right for other days
            ),
            zIndex: 999
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold">
                {day.getDate()}
              </p>
              <p className="text-sm text-muted-foreground">
                {day.toLocaleDateString(undefined, { weekday: 'long', month: 'short' })}
              </p>
            </div>
            {isToday && <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Today</Badge>}
          </div>
          
          <Separator className="mb-2" />
          
          <ScrollArea className="h-auto max-h-[350px]">
            <div className="space-y-4">
              {/* Show Google Calendar events first */}
              {googleTasks.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-muted-foreground mt-2">CALENDAR EVENTS</p>
                  <div className="space-y-2">
                    {googleTasks.map(task => (
                      <Card
                        key={task.id}
                        className="p-3 border"
                        style={{
                          backgroundColor: '#e8f5e9',
                          cursor: 'pointer'
                        }}
                        onClick={() => onViewTask(task)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconCalendarEvent size={16} color="#43a047" style={{ flexShrink: 0 }} />
                            <div>
                              <p className="text-sm font-medium">{task.title}</p>
                              {task.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                            e.stopPropagation();
                            onViewTask(task);
                          }}>
                            <IconEdit size={16} />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {/* App tasks */}
              {sortedAppTasks.length > 0 && (
                <>
                  <p className={`text-xs font-semibold text-muted-foreground ${googleTasks.length > 0 ? "mt-4" : "mt-2"}`}>TASKS</p>
                  <div className="space-y-2">
                    {sortedAppTasks.map(task => (
                      <Card
                        key={task.id}
                        className="p-3 border"
                        style={{
                          borderLeft: `4px solid ${
                            task.priority === 'high' ? '#f97316' :
                            task.priority === 'urgent' ? '#ef4444' :
                            task.priority === 'medium' ? '#eab308' :
                            '#3b82f6'
                          }`,
                          cursor: 'pointer'
                        }}
                        onClick={() => onViewTask(task)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={task.priority === 'urgent' ? 'destructive' : 'secondary'}
                                className={`text-xs h-5 ${
                                  task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                  task.priority === 'low' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  ''
                                }`}>
                                {task.priority}
                              </Badge>
                              <Badge 
                                className={`text-xs h-5 ${
                                  task.status === 'done' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  task.status === 'in_review' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                  task.status === 'todo' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                  ''
                                }`}
                                variant="secondary">
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="font-medium mt-2">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                            e.stopPropagation();
                            onViewTask(task);
                          }}>
                            <IconEdit size={16} />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
              
              {allDayTasks.length === 0 && (
                <p className="text-muted-foreground text-center py-12">No tasks for this day</p>
              )}
            </div>
            
            <Button 
              className="w-full mt-4" 
              variant="secondary" 
              onClick={(e) => {
                e.stopPropagation();
                onDateClick();
              }}
            >
              <IconListDetails size={16} className="mr-2 h-4 w-4" />
              View all details
            </Button>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

// Calendar view type definition
type CalendarViewType = 'month' | 'week' | 'day';

export function CalendarPage() {
  const { colors } = useTheme();
  // Theme removed - using Tailwind classes instead
  const { tasks: appTasks, createTask, updateTask } = useApp();
  const { isAuthenticated, calendarEvents, syncCalendar } = useGoogle();

  const [loading, setLoading] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [date, setDate] = useState<Date | null>(new Date());
  const [allTasks, setAllTasks] = useState<TaskWithMultiDayInfo[]>([]);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);
  const [viewType, setViewType] = useState<CalendarViewType>('month');

  // State for day detail modal
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Combine app tasks and Google calendar events
  useEffect(() => {
    // Create tasks from Google Calendar events
    const calendarTasks: Task[] = calendarEvents.map(event => ({
      id: `google-${event.id}`,
      title: event.title,
      description: event.description || 'Google Calendar Event',
      status: new Date(event.start) < new Date() ? 'done' : 'todo',
      priority: 'medium',
      tags: ['calendar', 'google'],
      dueDate: new Date(event.start).toISOString().split('T')[0],
      source: 'google',
      createdAt: new Date().toISOString(),
      taskNumber: 0, // Required field for Task type
    } as Task));

    // Combine real task sources only (no more mock data)
    const combinedTasks = [...appTasks, ...calendarTasks] as TaskWithMultiDayInfo[];
    setAllTasks(combinedTasks);
  }, [appTasks, calendarEvents]);

  // Sync calendar on initial load if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const loadCalendarData = async () => {
        setLoading(true);
        await syncCalendar();
        setLoading(false);
      };
      loadCalendarData();
    }
  }, [isAuthenticated, syncCalendar]);

  const tasksByDate = getTasksByDate(allTasks);

  // Calculate the current month's days
  const year = date ? date.getFullYear() : new Date().getFullYear();
  const month = date ? date.getMonth() : new Date().getMonth();
  const daysInMonth = getDaysInMonth(year, month);

  // Calculate the day of week for the first day (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Find the tasks for a specific date
  const getTasksForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return tasksByDate[dateString] || [];
  };


  // Handle adding task for a specific day
  const handleAddTaskForDay = (day: Date) => {
    // Pre-fill with the clicked day's date
    const newTask: Partial<Task> = {
      dueDate: day.toISOString().split('T')[0],
    };
    setSelectedTask(newTask as Task);
    setTaskModalOpen(true);

    // Close day detail modal if it's open
    if (dayDetailOpen) {
      setDayDetailOpen(false);
    }
  };

  // Open the day detail modal to show all tasks for a day
  const handleViewDayDetail = (day: Date) => {
    setSelectedDay(day);
    setDayDetailOpen(true);
  };

  // Close the day detail modal
  const handleCloseDayDetail = () => {
    setDayDetailOpen(false);
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);

    // Close day detail modal if it's open
    if (dayDetailOpen) {
      setDayDetailOpen(false);
    }
  };

  const handleTaskSubmit = async (taskData: Partial<Task>) => {
    setLoading(true);

    try {
      if (taskData.id && taskData.id.startsWith('task-')) {
        // For mock tasks, just close the modal
        console.log('Would update task:', taskData);
      } else if (taskData.id && taskData.id.startsWith('google-')) {
        // For Google Calendar tasks, just close the modal
        console.log('Would update Google Calendar event:', taskData);
      } else if (taskData.id) {
        // Update existing task
        // Extract id and pass the rest as data
        const { id, ...data } = taskData;
        await updateTask(id, data);
      } else {
        // Create new task
        await createTask(taskData as Omit<Task, 'id'>);
      }
    } catch (error) {
      console.error('Error handling task:', error);
    } finally {
      setLoading(false);
      setTaskModalOpen(false);
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Handle drag end event
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If the item was dropped outside a droppable area
    if (!destination) return;

    // If the item was dropped back into its original position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    // Get the task that was dragged
    const taskId = draggableId;
    const task = allTasks.find(t => t.id === taskId);

    if (!task) return;

    // Cannot move Google Calendar events
    if (task.source === 'google') return;

    // Parse the date from the destination droppable ID
    const destinationDateString = destination.droppableId.replace('day-', '');

    // Don't update if the task is already on this date
    if (task.dueDate === destinationDateString) return;

    try {
      setLoading(true);

      // Update task with the new date
      let updateData: Partial<Task> = {};

      if (task.isMultiDay && task.startDate && task.endDate) {
        // For multi-day tasks, shift all dates by the same amount
        const oldStartDate = new Date(task.startDate);
        const oldEndDate = new Date(task.endDate);
        const newDate = new Date(destinationDateString);

        // Calculate the day difference
        const dayDiff = Math.floor((newDate.getTime() - oldStartDate.getTime()) / (1000 * 60 * 60 * 24));

        // Apply the same shift to both start and end dates
        const newEndDate = new Date(oldEndDate);
        newEndDate.setDate(newEndDate.getDate() + dayDiff);

        updateData = {
          startDate: destinationDateString,
          endDate: newEndDate.toISOString().split('T')[0],
          dueDate: newEndDate.toISOString().split('T')[0] // For compatibility
        };
      } else {
        // For regular tasks, just update the due date
        updateData = {
          dueDate: destinationDateString
        };
      }

      const updatedTask = await updateTask(taskId, updateData);

      if (updatedTask) {
        setSuccessNotification(`Task "${task.title}" moved to ${new Date(destinationDateString).toLocaleDateString()}`);

        // Clear the notification after 3 seconds
        setTimeout(() => {
          setSuccessNotification(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to update task date:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <div className="flex items-center gap-4">
          <div className="flex">
            <Button
              variant={viewType === 'month' ? 'default' : 'outline'}
              onClick={() => setViewType('month')}
              className="rounded-r-none"
            >
              <IconCalendarMonth size={16} className="mr-2 h-4 w-4" />
              Month
            </Button>
            <Button
              variant={viewType === 'week' ? 'default' : 'outline'}
              onClick={() => setViewType('week')}
              className="rounded-none border-x-0"
            >
              <IconCalendarWeek size={16} className="mr-2 h-4 w-4" />
              Week
            </Button>
            <Button
              variant={viewType === 'day' ? 'default' : 'outline'}
              onClick={() => setViewType('day')}
              className="rounded-l-none"
            >
              <IconCalendar size={16} className="mr-2 h-4 w-4" />
              Day
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (date) {
                  const newDate = new Date(date);
                  if (viewType === 'month') {
                    newDate.setMonth(newDate.getMonth() - 1);
                  } else if (viewType === 'week') {
                    newDate.setDate(newDate.getDate() - 7);
                  } else {
                    newDate.setDate(newDate.getDate() - 1);
                  }
                  setDate(newDate);
                }
              }}
            >
              <IconChevronLeft size={18} />
            </Button>

            {viewType === 'day' ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <IconCalendarEvent className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd MMM yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date || undefined}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <Select
                value={date ? format(date, 'yyyy-MM') : ''}
                onValueChange={(value) => {
                  const [year, month] = value.split('-');
                  const newDate = new Date(parseInt(year), parseInt(month) - 1);
                  setDate(newDate);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select month">
                    {date ? format(date, 'MMMM yyyy') : 'Select month'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthDate = new Date(date?.getFullYear() || new Date().getFullYear(), i);
                    return (
                      <SelectItem key={i} value={format(monthDate, 'yyyy-MM')}>
                        {format(monthDate, 'MMMM yyyy')}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (date) {
                  const newDate = new Date(date);
                  if (viewType === 'month') {
                    newDate.setMonth(newDate.getMonth() + 1);
                  } else if (viewType === 'week') {
                    newDate.setDate(newDate.getDate() + 7);
                  } else {
                    newDate.setDate(newDate.getDate() + 1);
                  }
                  setDate(newDate);
                }
              }}
            >
              <IconChevronRight size={18} />
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <QuickAddTask
          defaultDueDate={date instanceof Date ? date : null}
          onTaskAdded={() => {
            // Task will be automatically added to the store
          }}
        />
      </div>

      {/* Success notification */}
      {successNotification && (
        <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 flex items-start gap-3">
          <IconCheck className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-green-900 dark:text-green-100">Task Moved</p>
            <p className="text-sm text-green-800 dark:text-green-200">{successNotification}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900"
            onClick={() => setSuccessNotification(null)}
          >
            ×
          </Button>
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
              <p className="text-muted-foreground mt-4">Loading calendar events...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Card>
            <CardContent className="p-4">
              {/* Month View */}
              {viewType === 'month' && (
                <div className="grid grid-cols-7 gap-0">
                  {/* Weekday headers */}
                {weekDays.map((day, i) => (
                  <div key={`header-${i}`}>
                    <p className="text-center text-sm font-bold">
                      {day}
                    </p>
                  </div>
                ))}

                {/* Empty cells for days before the first of month */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`}>
                    <div
                      className="border rounded-lg p-2"
                      style={{
                        minHeight: '150px',
                        backgroundColor: colors.cardBackground,
                        opacity: 0.5
                      }}
                    >
                      {/* We still add a droppable area, but users shouldn't be able to drop here */}
                      <Droppable droppableId={`empty-${i}`} type="task" isDropDisabled={true}>
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} style={{ minHeight: '100px' }}>
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  </div>
                ))}

                {/* Days of the month */}
                {daysInMonth.map((day, i) => {
                  const dayTasks = getTasksForDate(day);
                  const isToday = new Date().toDateString() === day.toDateString();
                  const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                  // Group tasks by source
                  const googleTasks = dayTasks.filter(task => task.source === 'google');
                  const appTasks = dayTasks.filter(task => !task.source || task.source === 'app');

                  return (
                    <div key={`day-${i}`}>
                      <DayCell
                        day={day}
                        isToday={isToday}
                        isPast={isPast}
                        backgroundColor={
                          isToday
                            ? colors.highlight
                            : isPast
                            ? `${colors.cardBackground}95`
                            : colors.cardBackground
                        }
                        onClick={() => handleAddTaskForDay(day)}
                        onDateClick={() => handleViewDayDetail(day)}
                        allDayTasks={dayTasks}
                        onViewTask={handleViewTask}
                      >
                      <div className="flex items-center justify-between mb-6">
                        <p className={isToday ? "text-base font-bold" : "text-sm font-normal"}>
                          {day.getDate()}
                        </p>
                        {isToday && <Badge className="text-xs h-5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Today</Badge>}
                      </div>

                    <Droppable droppableId={`day-${day.toISOString().split('T')[0]}`} type="task">
                      {(provided) => (
                        <div
                          className="space-y-1 mt-2"
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          style={{ minHeight: dayTasks.length === 0 ? '60px' : 'auto' }}
                        >
                          {/* Show Google Calendar events first with icon */}
                          {dayTasks.length > 0 && googleTasks.slice(0, 1).map((task, index) => (
                              <Draggable
                                key={task.id}
                                draggableId={task.id}
                                index={index}
                                isDragDisabled={task.source === 'google'} // Google events can't be dragged
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                      opacity: snapshot.isDragging ? 0.8 : 1
                                    }}
                                  >
                                    <Card
                                      className="p-1 cursor-pointer"
                                      style={{
                                        backgroundColor: '#e8f5e9'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewTask(task);
                                      }}
                                    >
                                      <div className="flex items-start gap-1">
                                        <IconCalendarEvent size={12} style={{ marginTop: 3 }} color="#43a047" />
                                        <p className="text-xs line-clamp-1 font-medium flex-1">
                                          {task.title}
                                        </p>
                                      </div>
                                    </Card>
                                  </div>
                                )}
                              </Draggable>
                            ))}

                            {/* App tasks */}
                            {appTasks.slice(0, 2).map((task, index) => {
                              // Check if this is a multi-day task
                              const isMultiDay = task._isFirstDay || task._isLastDay || task._isMiddleDay;

                              return (
                                <Draggable
                                  key={task.id}
                                  draggableId={task.id}
                                  index={googleTasks.length + index}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      style={{
                                        ...provided.draggableProps.style,
                                        opacity: snapshot.isDragging ? 0.8 : 1,
                                        width: isMultiDay ? (task._isFirstDay ? '95%' : task._isLastDay ? '95%' : '100%') : 'auto',
                                        marginLeft: isMultiDay && !task._isFirstDay ? '-3px' : '0',
                                        marginRight: isMultiDay && !task._isLastDay ? '-3px' : '0'
                                      }}
                                    >
                                      <Card
                                        className="p-1 cursor-pointer"
                                        style={{
                                          borderRadius: isMultiDay ?
                                            (task._isFirstDay ? '3px 0 0 3px' :
                                             task._isLastDay ? '0 3px 3px 0' : '0')
                                            : '3px',
                                          borderLeft: isMultiDay && !task._isFirstDay ? 'none' :
                                            `3px solid ${
                                              task.priority === 'high' ? '#f97316' :
                                              task.priority === 'urgent' ? '#ef4444' :
                                              task.priority === 'medium' ? '#eab308' :
                                              '#3b82f6'
                                            }`,
                                          backgroundColor: isMultiDay ? '#dbeafe' : undefined,
                                          borderRight: isMultiDay && !task._isLastDay ? 'none' : undefined
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewTask(task);
                                        }}
                                      >
                                        <div className="flex items-center gap-1">
                                          {isMultiDay && (
                                            <Badge className="text-xs h-5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-none" style={{ padding: '2px 4px' }}>
                                              {task._isFirstDay ? 'Start' : task._isLastDay ? 'End' : 'Day ' + (task._totalDays && task._totalDays > 3 ? Math.floor(task._totalDays / 2) : '')}
                                            </Badge>
                                          )}
                                          {!isMultiDay && task.estimatedHours && (
                                            <IconClockHour4 size={12} style={{ marginRight: 2 }} color="#999" />
                                        )}
                                        <p className="text-xs line-clamp-1 flex-1">
                                          {isMultiDay && !task._isFirstDay ? '' : task.title}
                                        </p>
                                      </div>
                                    </Card>
                                  </div>
                                )}
                              </Draggable>
                            );
                            })}

                            {googleTasks.length > 1 && (
                              <p className="text-xs text-green-600 text-left">
                                +{googleTasks.length - 1} calendar events
                              </p>
                            )}

                            {dayTasks.length > (googleTasks.length > 0 ? 3 : 2) && (
                              <p className="text-xs text-muted-foreground text-center">
                                +{dayTasks.length - (googleTasks.length > 0 ? 3 : 2)} more
                              </p>
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                  </DayCell>
                </div>
              );
            })}
          </div>
            )}

            {/* Week View */}
            {viewType === 'week' && (
              <div className="space-y-4">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-0">
                  {date && getDaysInWeek(date).map((day, index) => {
                    const isToday = new Date().toDateString() === day.toDateString();
                    return (
                      <div key={`weekday-${index}`}>
                        <div
                          className="border rounded-lg p-2 text-center"
                          style={{
                            backgroundColor: isToday ? colors.highlight : colors.cardBackground
                          }}
                        >
                          <p className="text-sm font-bold">
                            {weekDays[index]}
                          </p>
                          <p
                            className={`text-base ${isToday ? "font-bold bg-blue-100 dark:bg-blue-900" : "font-medium"} inline-block px-2 py-0.5 rounded`}
                          >
                            {day.getDate()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tasks Section */}
                <div className="grid grid-cols-7 gap-0">
                  {date && getDaysInWeek(date).map((day, index) => {
                    const dayTasks = getTasksForDate(day);
                    const isToday = new Date().toDateString() === day.toDateString();
                    const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                    return (
                      <div key={`week-day-${index}`}>
                        <Droppable droppableId={`day-${day.toISOString().split('T')[0]}`} type="task">
                          {(provided) => (
                            <div
                              className="border rounded-lg p-2 relative"
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              style={{
                                backgroundColor: isToday ? colors.highlight : colors.cardBackground,
                                opacity: isPast ? 0.95 : 1,
                                minHeight: '300px'
                              }}
                            >
                              {/* Add task button */}
                              {!isPast && (
                                <Button
                                  variant="default"
                                  size="icon"
                                  className="absolute top-2 right-2 z-[2] h-8 w-8 rounded-full"
                                  onClick={() => handleAddTaskForDay(day)}
                                >
                                  <IconCirclePlus size={16} />
                                </Button>
                              )}

                              {/* Tasks */}
                              <div className="space-y-2 mt-8">
                                {/* Group tasks for this day by source */}
                                {dayTasks
                                  .sort((a, b) => {
                                    // First sort by source (google first)
                                    if (a.source === 'google' && b.source !== 'google') return -1;
                                    if (a.source !== 'google' && b.source === 'google') return 1;

                                    // Then by priority for app tasks
                                    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
                                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                                  })
                                  .map((task, taskIndex) => (
                                    <Draggable
                                      key={task.id}
                                      draggableId={task.id}
                                      index={taskIndex}
                                      isDragDisabled={task.source === 'google'}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          style={{
                                            ...provided.draggableProps.style,
                                            opacity: snapshot.isDragging ? 0.8 : 1
                                          }}
                                        >
                                          <Card
                                            className="p-2"
                                            style={{
                                              cursor: 'pointer',
                                              ...(task.source === 'google'
                                                ? { backgroundColor: '#e8f5e9' }
                                                : {
                                                    borderLeft: `4px solid ${
                                                      task.priority === 'high' ? '#f97316' :
                                                      task.priority === 'urgent' ? '#ef4444' :
                                                      task.priority === 'medium' ? '#eab308' :
                                                      '#3b82f6'
                                                    }`
                                                  }
                                              )
                                            }}
                                            onClick={() => handleViewTask(task)}
                                          >
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <p className="text-sm font-medium line-clamp-1">{task.title}</p>
                                                {task.source === 'google' && (
                                                  <div className="flex items-center gap-1">
                                                    <IconCalendarEvent size={12} color="#43a047" />
                                                    <p className="text-xs text-muted-foreground">Google Calendar</p>
                                                  </div>
                                                )}
                                                {!task.source && task.estimatedHours && (
                                                  <div className="flex items-center gap-1">
                                                    <IconClockHour4 size={12} color="#777" />
                                                    <p className="text-xs text-muted-foreground">{task.estimatedHours}h</p>
                                                  </div>
                                                )}
                                              </div>
                                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewTask(task);
                                              }}>
                                                <IconEdit size={16} />
                                              </Button>
                                            </div>
                                          </Card>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                {provided.placeholder}
                              </div>
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Day View */}
            {viewType === 'day' && (
              <div className="space-y-4">
                {/* Date Header */}
                <div
                  className="border rounded-lg p-4 text-center"
                  style={{
                    backgroundColor: colors.cardBackground
                  }}
                >
                  <p className="text-xl font-bold">
                    {date ? date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  </p>
                </div>

                {/* Hour slots */}
                <div className="grid grid-cols-12 gap-0">
                  <div className="col-span-2">
                    <div className="border rounded-lg p-4 h-[50px] text-center flex items-center justify-center">
                      <p className="font-bold">All-day</p>
                    </div>
                  </div>
                  <div className="col-span-10">
                    <Droppable droppableId={`day-${date ? date.toISOString().split('T')[0] : 'unknown'}`} type="task">
                      {(provided) => (
                        <div
                          className="border rounded-lg p-4"
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          style={{
                            minHeight: '50px',
                            backgroundColor: colors.cardBackground
                          }}
                        >
                          <div className="space-y-2">
                            {date && getTasksForDate(date).map((task, index) => (
                              <Draggable
                                key={task.id}
                                draggableId={task.id}
                                index={index}
                                isDragDisabled={task.source === 'google'}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                      opacity: snapshot.isDragging ? 0.8 : 1
                                    }}
                                  >
                                    <Card
                                      className="p-2"
                                      style={{
                                        cursor: 'pointer',
                                        ...(task.source === 'google'
                                          ? { backgroundColor: '#e8f5e9' }
                                          : {
                                              borderLeft: `4px solid ${
                                                task.priority === 'high' ? '#f97316' :
                                                task.priority === 'urgent' ? '#ef4444' :
                                                task.priority === 'medium' ? '#eab308' :
                                                '#3b82f6'
                                              }`
                                            }
                                        )
                                      }}
                                      onClick={() => handleViewTask(task)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-sm font-medium">{task.title}</p>
                                          {task.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                                          )}
                                          {task.source === 'google' && (
                                            <div className="flex items-center gap-1">
                                              <IconCalendarEvent size={12} color="#43a047" />
                                              <p className="text-xs text-muted-foreground">Google Calendar</p>
                                            </div>
                                          )}
                                        </div>
                                        <ActionIcon variant="subtle" onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewTask(task);
                                        }}>
                                          <IconEdit size={16} />
                                        </ActionIcon>
                                      </div>
                                    </Card>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>

                          {/* Add task button */}
                          <Button
                            variant="secondary"
                            className="mt-4"
                            onClick={() => date && handleAddTaskForDay(date)}
                          >
                            <IconPlus size={14} className="mr-2 h-4 w-4" />
                            Add Task
                          </Button>
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>

                {/* Hour slots */}
                {getHourSlots().map((slot) => (
                  <div key={`hour-${slot.hour}`} className="grid grid-cols-12 gap-0">
                    <div className="col-span-2">
                      <div
                        className="border rounded-lg p-4 h-20 bg-gray-100 dark:bg-gray-800 text-center flex items-center justify-center"
                      >
                        <p className="font-medium">{slot.label}</p>
                      </div>
                    </div>
                    <div className="col-span-10">
                      <div
                        className="border rounded-lg p-2 h-20 cursor-pointer border-t-dashed"
                        style={{
                          backgroundColor: colors.cardBackground
                        }}
                        onClick={() => {
                          if (date) {
                            handleAddTaskForDay(date);
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            </CardContent>
          </Card>
        </DragDropContext>
      )}

      <TaskModal
        opened={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        task={selectedTask}
        onSubmit={handleTaskSubmit}
      />

      {/* Day Detail Modal */}
      <DayDetailModal
        day={selectedDay}
        tasks={selectedDay ? getTasksForDate(selectedDay) : []}
        opened={dayDetailOpen}
        onClose={handleCloseDayDetail}
        onAddTask={handleAddTaskForDay}
        onViewTask={handleViewTask}
      />
    </div>
  );
}