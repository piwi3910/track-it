import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Group,
  Button,
  Grid,
  Paper,
  Text,
  Stack,
  Card,
  Badge,
  Loader,
  useMantineTheme,
  ActionIcon,
  Tooltip,
  Modal,
  ScrollArea,
  Divider,
  Notification,
  Box,
} from '@mantine/core';
import { MonthPickerInput, DatePickerInput } from '@mantine/dates';
import {
  IconPlus,
  IconCalendarEvent,
  IconClockHour4,
  IconCirclePlus,
  IconWeight,
  IconListDetails,
  IconX,
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
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/hooks/useApp';
import { useGoogle } from '@/context/GoogleContext';

// Generate additional mock data for current month
const generateCurrentMonthTasks = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Generate dates for current month
  const tasks = [];

  // Weekly team meeting (every Monday)
  for (let i = 1; i <= 31; i++) {
    const date = new Date(year, month, i);
    if (date.getDay() === 1 && date <= today) { // Mondays only and not in the future
      tasks.push({
        id: `meeting-${i}`,
        title: 'Weekly Team Meeting',
        description: 'Discuss progress and blockers',
        status: 'todo',
        priority: 'medium',
        tags: ['meeting', 'recurring'],
        dueDate: date.toISOString().split('T')[0],
        source: 'google'
      });
    }
  }

  // Sprint planning (1st and 15th of month)
  [1, 15].forEach(day => {
    const date = new Date(year, month, day);
    if (date <= today) {
      tasks.push({
        id: `sprint-${day}`,
        title: 'Sprint Planning',
        description: 'Plan the next two weeks of work',
        status: 'todo',
        priority: 'high',
        tags: ['planning', 'sprint'],
        dueDate: date.toISOString().split('T')[0],
        source: 'google'
      });
    }
  });

  // Project deadline
  const deadlineDate = new Date(year, month, 25);
  if (deadlineDate > today) {
    tasks.push({
      id: 'project-deadline',
      title: 'Project Deadline',
      description: 'Final deliverables due',
      status: 'todo',
      priority: 'urgent',
      tags: ['deadline', 'important'],
      dueDate: deadlineDate.toISOString().split('T')[0]
    });
  }

  // Random one-off tasks
  const randomDays = [3, 8, 12, 17, 22, 28];
  randomDays.forEach((day, index) => {
    const date = new Date(year, month, day);
    if (date.getTime() > today.getTime() - (86400000 * 2) && date.getTime() < today.getTime() + (86400000 * 14)) {
      tasks.push({
        id: `task-${index}`,
        title: [
          'Client Meeting',
          'Review Pull Requests',
          'Update Documentation',
          'Stakeholder Demo',
          'Bug Fixing Session',
          'Deployment Planning'
        ][index],
        description: 'Task for ' + date.toLocaleDateString(),
        status: date < today ? 'done' : 'todo',
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        tags: ['work', index % 2 === 0 ? 'meeting' : 'task'],
        dueDate: date.toISOString().split('T')[0]
      });
    }
  });

  return tasks;
};

// Map to get tasks by date
const getTasksByDate = (tasks: Task[]) => {
  const taskMap: Record<string, Task[]> = {};

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
        taskMap[dateStr].push({
          ...task,
          _multiDay: {
            isFirstDay,
            isLastDay,
            isMiddleDay: !isFirstDay && !isLastDay,
            totalDays: Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
          }
        });

        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (task.dueDate) {
      // For regular tasks, just add to the due date
      const date = task.dueDate;
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
  const theme = useMantineTheme();

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
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconCalendarTime size={20} />
          <Text fw={600}>
            {formattedDate}
            {isToday && <Badge ml="sm" color="green">Today</Badge>}
          </Text>
        </Group>
      }
      size="lg"
    >
      <Stack gap="md">
        <Group justify="flex-end">
          <Button
            leftSection={<IconPlus size={14} />}
            onClick={() => onAddTask(day)}
            disabled={isPast}
          >
            Add Task
          </Button>
        </Group>

        {tasks.length === 0 ? (
          <Paper withBorder p="md" bg="gray.0">
            <Stack align="center" py="lg">
              <IconListDetails size={40} opacity={0.3} />
              <Text c="dimmed">No tasks for this day</Text>
              {!isPast && (
                <Button variant="light" onClick={() => onAddTask(day)} mt="sm">
                  Add a task
                </Button>
              )}
            </Stack>
          </Paper>
        ) : (
          <Stack gap="md">
            {googleTasks.length > 0 && (
              <>
                <Text fw={600} size="sm" c="dimmed">CALENDAR EVENTS</Text>
                <Stack gap="xs">
                  {googleTasks.map(task => (
                    <Card
                      key={task.id}
                      withBorder
                      padding="sm"
                      style={{
                        backgroundColor: '#e8f5e9',
                        cursor: 'pointer'
                      }}
                      onClick={() => onViewTask(task)}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="xs" wrap="nowrap">
                          <IconCalendarEvent size={16} color="#43a047" style={{ flexShrink: 0 }} />
                          <div>
                            <Text fw={500} size="sm">{task.title}</Text>
                            {task.description && (
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {task.description}
                              </Text>
                            )}
                          </div>
                        </Group>
                        <ActionIcon variant="subtle" onClick={(e) => {
                          e.stopPropagation();
                          onViewTask(task);
                        }}>
                          <IconEdit size={16} />
                        </ActionIcon>
                      </Group>
                    </Card>
                  ))}
                </Stack>
                <Divider my="xs" />
              </>
            )}

            {sortedAppTasks.length > 0 && (
              <>
                <Text fw={600} size="sm" c="dimmed">TASKS</Text>
                <ScrollArea h={400}>
                  <Stack gap="xs">
                    {sortedAppTasks.map(task => (
                      <Card
                        key={task.id}
                        withBorder
                        padding="sm"
                        style={{
                          borderLeft: `4px solid ${
                            task.priority === 'high' ? theme.colors.orange[6] :
                            task.priority === 'urgent' ? theme.colors.red[6] :
                            task.priority === 'medium' ? theme.colors.yellow[6] :
                            theme.colors.blue[6]
                          }`,
                          cursor: 'pointer'
                        }}
                        onClick={() => onViewTask(task)}
                      >
                        <Group justify="space-between" wrap="nowrap">
                          <div>
                            <Group gap="xs" wrap="nowrap">
                              <Badge color={
                                task.priority === 'high' ? 'orange' :
                                task.priority === 'urgent' ? 'red' :
                                task.priority === 'medium' ? 'yellow' :
                                'blue'
                              } size="xs">
                                {task.priority}
                              </Badge>
                              <Badge size="xs" color={
                                task.status === 'done' ? 'green' :
                                task.status === 'in_progress' ? 'blue' :
                                task.status === 'in_review' ? 'grape' :
                                task.status === 'todo' ? 'yellow' :
                                'gray'
                              }>
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </Group>
                            <Text fw={500} mt="xs">{task.title}</Text>
                            {task.isMultiDay && (
                              <Group gap={4} mt={4}>
                                <Badge size="xs" color="blue">Multi-day</Badge>
                                <Text size="xs" c="dimmed">
                                  {task.startDate && task.endDate
                                    ? `${new Date(task.startDate).toLocaleDateString()} - ${new Date(task.endDate).toLocaleDateString()}`
                                    : ''
                                  }
                                </Text>
                              </Group>
                            )}
                            {task.description && (
                              <Text size="xs" c="dimmed" lineClamp={2} mt={4}>
                                {task.description}
                              </Text>
                            )}
                            <Group gap="xs" mt="xs">
                              {task.estimatedHours && (
                                <Group gap={4}>
                                  <IconClockHour4 size={14} color="#777" />
                                  <Text size="xs" c="dimmed">Est: {task.estimatedHours}h</Text>
                                </Group>
                              )}
                              {task.weight && (
                                <Group gap={4}>
                                  <IconWeight size={14} color="#777" />
                                  <Text size="xs" c="dimmed">Weight: {task.weight}</Text>
                                </Group>
                              )}
                              {task.tags && task.tags.length > 0 && (
                                <Group gap={4}>
                                  {task.tags.map(tag => (
                                    <Badge key={tag} size="xs" variant="outline" color="gray">
                                      {tag}
                                    </Badge>
                                  ))}
                                </Group>
                              )}
                            </Group>
                          </div>
                          <ActionIcon variant="subtle" onClick={(e) => {
                            e.stopPropagation();
                            onViewTask(task);
                          }}>
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </ScrollArea>
              </>
            )}
          </Stack>
        )}
      </Stack>
    </Modal>
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
  allDayTasks: Task[]; // All tasks for this day
  onViewTask: (task: Task) => void; // To view a specific task
}) {
  const [hovered, setHovered] = useState(false);
  const theme = useMantineTheme();
  
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
      <Paper
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
        p="xs"
        withBorder
        onClick={isPast ? undefined : onClick}
      >
        {hovered && !isPast && (
          <ActionIcon
            variant="light"
            color="blue"
            radius="xl"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 2,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <IconCirclePlus size={16} />
          </ActionIcon>
        )}
        {/* We replace the children prop with our custom implementation */}
        <Group justify="space-between" mb={6}>
          <Text
            fw={isToday ? 700 : 400}
            size={isToday ? "md" : "sm"}
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              onDateClick();
            }}
          >
            {day.getDate()}
          </Text>
          {isToday && <Badge size="xs" color="green">Today</Badge>}
        </Group>

        {/* Render the task items */}
        {React.Children.map(children, child => {
          // Skip the Group element containing the date and badge
          if (React.isValidElement(child) &&
              child.type === Group &&
              child.props.mb === 6) {
            return null;
          }
          return child;
        })}
      </Paper>
      
      {/* Zoomed overlay popup when hovering */}
      {hovered && hasTasksToShow && (
        <Paper
          shadow="md"
          p="sm"
          radius="md"
          withBorder
          style={{
            position: 'absolute',
            width: '320px',
            top: '-10px',
            // Check if day is close to the right edge (columns 5-6 in a 7-column grid)
            ...(day.getDay() >= 5 ?
              { right: '100%', marginRight: '10px' } : // Position to the left for days close to right edge
              { left: '100%', marginLeft: '10px' }     // Position to the right for other days
            ),
            zIndex: 999,
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Group justify="space-between" mb="xs">
            <Group>
              <Text fw={700} size="lg">
                {day.getDate()}
              </Text>
              <Text c="dimmed" size="sm">
                {day.toLocaleDateString(undefined, { weekday: 'long', month: 'short' })}
              </Text>
            </Group>
            {isToday && <Badge color="green">Today</Badge>}
          </Group>
          
          <Divider mb="xs" />
          
          <ScrollArea.Autosize mah={350}>
            <Stack gap="md">
              {/* Show Google Calendar events first */}
              {googleTasks.length > 0 && (
                <>
                  <Text fw={600} size="xs" c="dimmed" mt="xs">CALENDAR EVENTS</Text>
                  <Stack gap="xs">
                    {googleTasks.map(task => (
                      <Card
                        key={task.id}
                        withBorder
                        padding="sm"
                        style={{
                          backgroundColor: '#e8f5e9',
                          cursor: 'pointer'
                        }}
                        onClick={() => onViewTask(task)}
                      >
                        <Group justify="space-between" wrap="nowrap">
                          <Group gap="xs" wrap="nowrap">
                            <IconCalendarEvent size={16} color="#43a047" style={{ flexShrink: 0 }} />
                            <div>
                              <Text fw={500} size="sm">{task.title}</Text>
                              {task.description && (
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                  {task.description}
                                </Text>
                              )}
                            </div>
                          </Group>
                          <ActionIcon variant="subtle" onClick={(e) => {
                            e.stopPropagation();
                            onViewTask(task);
                          }}>
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </>
              )}

              {/* App tasks */}
              {sortedAppTasks.length > 0 && (
                <>
                  <Text fw={600} size="xs" c="dimmed" mt={googleTasks.length > 0 ? "md" : "xs"}>TASKS</Text>
                  <Stack gap="xs">
                    {sortedAppTasks.map(task => (
                      <Card
                        key={task.id}
                        withBorder
                        padding="sm"
                        style={{
                          borderLeft: `4px solid ${
                            task.priority === 'high' ? theme.colors.orange[6] :
                            task.priority === 'urgent' ? theme.colors.red[6] :
                            task.priority === 'medium' ? theme.colors.yellow[6] :
                            theme.colors.blue[6]
                          }`,
                          cursor: 'pointer'
                        }}
                        onClick={() => onViewTask(task)}
                      >
                        <Group justify="space-between" wrap="nowrap">
                          <div>
                            <Group gap="xs" wrap="nowrap">
                              <Badge color={
                                task.priority === 'high' ? 'orange' :
                                task.priority === 'urgent' ? 'red' :
                                task.priority === 'medium' ? 'yellow' :
                                'blue'
                              } size="xs">
                                {task.priority}
                              </Badge>
                              <Badge size="xs" color={
                                task.status === 'done' ? 'green' :
                                task.status === 'in_progress' ? 'blue' :
                                task.status === 'in_review' ? 'grape' :
                                task.status === 'todo' ? 'yellow' :
                                'gray'
                              }>
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </Group>
                            <Text fw={500} mt="xs">{task.title}</Text>
                            {task.description && (
                              <Text size="xs" c="dimmed" lineClamp={2} mt={4}>
                                {task.description}
                              </Text>
                            )}
                          </div>
                          <ActionIcon variant="subtle" onClick={(e) => {
                            e.stopPropagation();
                            onViewTask(task);
                          }}>
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </>
              )}
              
              {allDayTasks.length === 0 && (
                <Text c="dimmed" ta="center" py="lg">No tasks for this day</Text>
              )}
            </Stack>
            
            <Button 
              fullWidth 
              variant="light" 
              mt="md" 
              leftSection={<IconListDetails size={16} />}
              onClick={(e) => {
                e.stopPropagation();
                onDateClick();
              }}
            >
              View all details
            </Button>
          </ScrollArea.Autosize>
        </Paper>
      )}
    </div>
  );
}

// Calendar view type definition
type CalendarViewType = 'month' | 'week' | 'day';

export function CalendarPage() {
  const { colors } = useTheme();
  const theme = useMantineTheme();
  const { tasks: appTasks, createTask, updateTask } = useApp();
  const { isAuthenticated, calendarEvents, syncCalendar } = useGoogle();

  const [loading, setLoading] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [date, setDate] = useState<Date | null>(new Date());
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);
  const [viewType, setViewType] = useState<CalendarViewType>('month');

  // State for day detail modal
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [tasksByDateMap, setTasksByDateMap] = useState<Record<string, Task[]>>({});

  // Combine app tasks, Google calendar events, and generated mock tasks
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
    } as Task));

    // Generate additional mock tasks
    const generatedTasks = generateCurrentMonthTasks();

    // Combine all task sources
    const combinedTasks = [...appTasks, ...calendarTasks, ...generatedTasks];
    setAllTasks(combinedTasks);
    
    // Also create a map of tasks by date for easy access
    setTasksByDateMap(getTasksByDate(combinedTasks));
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

  const handleAddTask = () => {
    // Pre-fill with the selected date if available
    const newTask: Partial<Task> = {
      dueDate: date ? date.toISOString().split('T')[0] : undefined,
    };
    setSelectedTask(newTask as Task);
    setTaskModalOpen(true);
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
        await updateTask(taskData.id, taskData);
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
    <Container size="xl">
      <Group justify="space-between" align="center" mb="md">
        <Title>Calendar</Title>
        <Group>
          <Group>
            <Button.Group>
              <Button
                variant={viewType === 'month' ? 'filled' : 'light'}
                onClick={() => setViewType('month')}
                leftSection={<IconCalendarMonth size={16} />}
              >
                Month
              </Button>
              <Button
                variant={viewType === 'week' ? 'filled' : 'light'}
                onClick={() => setViewType('week')}
                leftSection={<IconCalendarWeek size={16} />}
              >
                Week
              </Button>
              <Button
                variant={viewType === 'day' ? 'filled' : 'light'}
                onClick={() => setViewType('day')}
                leftSection={<IconCalendar size={16} />}
              >
                Day
              </Button>
            </Button.Group>
          </Group>

          <Group>
            <ActionIcon
              onClick={() => {
                const newDate = new Date(date);
                if (viewType === 'month') {
                  newDate.setMonth(newDate.getMonth() - 1);
                } else if (viewType === 'week') {
                  newDate.setDate(newDate.getDate() - 7);
                } else {
                  newDate.setDate(newDate.getDate() - 1);
                }
                setDate(newDate);
              }}
            >
              <IconChevronLeft size={18} />
            </ActionIcon>

            {viewType === 'day' ? (
              <DatePickerInput
                value={date}
                onChange={setDate}
                valueFormat="DD MMM YYYY"
              />
            ) : (
              <MonthPickerInput
                value={date}
                onChange={setDate}
                valueFormat="MMMM YYYY"
              />
            )}

            <ActionIcon
              onClick={() => {
                const newDate = new Date(date);
                if (viewType === 'month') {
                  newDate.setMonth(newDate.getMonth() + 1);
                } else if (viewType === 'week') {
                  newDate.setDate(newDate.getDate() + 7);
                } else {
                  newDate.setDate(newDate.getDate() + 1);
                }
                setDate(newDate);
              }}
            >
              <IconChevronRight size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </Group>

      <Box mb="xl">
        <QuickAddTask
          defaultDueDate={date ? date.toISOString().split('T')[0] : undefined}
          onTaskAdded={() => console.log('Task added from calendar quick add')}
        />
      </Box>

      {/* Success notification */}
      {successNotification && (
        <Notification
          icon={<IconCheck size="1.2rem" />}
          color="teal"
          title="Task Moved"
          onClose={() => setSuccessNotification(null)}
          mb="md"
        >
          {successNotification}
        </Notification>
      )}

      {loading ? (
        <Paper withBorder p="xl" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <Stack align="center">
            <Loader size="md" />
            <Text c="dimmed" mt="md">Loading calendar events...</Text>
          </Stack>
        </Paper>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Paper withBorder p="md">
            {/* Month View */}
            {viewType === 'month' && (
              <Grid columns={7}>
                {/* Weekday headers */}
                {weekDays.map((day, i) => (
                  <Grid.Col span={1} key={`header-${i}`}>
                    <Text ta="center" fw={700} size="sm">
                      {day}
                    </Text>
                  </Grid.Col>
                ))}

                {/* Empty cells for days before the first of month */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <Grid.Col span={1} key={`empty-${i}`}>
                    <Paper
                      style={{
                        minHeight: '150px',
                        backgroundColor: colors.cardBackground,
                        opacity: 0.5
                      }}
                      p="xs"
                      withBorder
                    >
                      {/* We still add a droppable area, but users shouldn't be able to drop here */}
                      <Droppable droppableId={`empty-${i}`} type="task" isDropDisabled={true}>
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} style={{ minHeight: '100px' }}>
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </Paper>
                  </Grid.Col>
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
                    <Grid.Col span={1} key={`day-${i}`}>
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
                      <Group justify="space-between" mb={6}>
                        <Text fw={isToday ? 700 : 400} size={isToday ? "md" : "sm"}>
                          {day.getDate()}
                        </Text>
                        {isToday && <Badge size="xs" color="green">Today</Badge>}
                      </Group>

                    <Droppable droppableId={`day-${day.toISOString().split('T')[0]}`} type="task">
                      {(provided) => (
                        <Stack
                          gap={4}
                          mt="xs"
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
                                      padding={4}
                                      style={{
                                        cursor: 'pointer',
                                        backgroundColor: '#e8f5e9'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewTask(task);
                                      }}
                                    >
                                      <Group gap={4} wrap="nowrap" align="flex-start">
                                        <IconCalendarEvent size={12} style={{ marginTop: 3 }} color="#43a047" />
                                        <Text size="xs" lineClamp={1} fw={500} style={{ flex: 1 }}>
                                          {task.title}
                                        </Text>
                                      </Group>
                                    </Card>
                                  </div>
                                )}
                              </Draggable>
                            ))}

                            {/* App tasks */}
                            {appTasks.slice(0, 2).map((task, index) => {
                              // Check if this is a multi-day task
                              const isMultiDay = task._multiDay;

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
                                        width: isMultiDay ? (isMultiDay.isFirstDay ? '95%' : isMultiDay.isLastDay ? '95%' : '100%') : 'auto',
                                        marginLeft: isMultiDay && !isMultiDay.isFirstDay ? '-3px' : '0',
                                        marginRight: isMultiDay && !isMultiDay.isLastDay ? '-3px' : '0'
                                      }}
                                    >
                                      <Card
                                        padding={4}
                                        style={{
                                          cursor: 'pointer',
                                          borderRadius: isMultiDay ?
                                            (isMultiDay.isFirstDay ? '3px 0 0 3px' :
                                             isMultiDay.isLastDay ? '0 3px 3px 0' : '0')
                                            : '3px',
                                          borderLeft: isMultiDay && !isMultiDay.isFirstDay ? 'none' :
                                            `3px solid ${
                                              task.priority === 'high' ? theme.colors.orange[6] :
                                              task.priority === 'urgent' ? theme.colors.red[6] :
                                              task.priority === 'medium' ? theme.colors.yellow[6] :
                                              theme.colors.blue[6]
                                            }`,
                                          backgroundColor: isMultiDay ? theme.colors.blue[1] : undefined,
                                          borderRight: isMultiDay && !isMultiDay.isLastDay ? 'none' : undefined
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewTask(task);
                                        }}
                                      >
                                        <Group gap={4} wrap="nowrap" align="center">
                                          {isMultiDay && (
                                            <Badge size="xs" color="blue" radius={0} style={{ padding: '2px 4px' }}>
                                              {isMultiDay.isFirstDay ? 'Start' : isMultiDay.isLastDay ? 'End' : 'Day ' + (isMultiDay.totalDays > 3 ? Math.floor(isMultiDay.totalDays / 2) : '')}
                                            </Badge>
                                          )}
                                          {!isMultiDay && task.estimatedHours && (
                                            <IconClockHour4 size={12} style={{ marginRight: 2 }} color="#999" />
                                        )}
                                        <Text size="xs" lineClamp={1} style={{ flex: 1 }}>
                                          {isMultiDay && !isMultiDay.isFirstDay ? '' : task.title}
                                        </Text>
                                      </Group>
                                    </Card>
                                  </div>
                                )}
                              </Draggable>
                            );
                            })}

                            {googleTasks.length > 1 && (
                              <Text size="xs" c="green" ta="left">
                                +{googleTasks.length - 1} calendar events
                              </Text>
                            )}

                            {dayTasks.length > (googleTasks.length > 0 ? 3 : 2) && (
                              <Text size="xs" c="dimmed" ta="center">
                                +{dayTasks.length - (googleTasks.length > 0 ? 3 : 2)} more
                              </Text>
                            )}
                            {provided.placeholder}
                          </Stack>
                        )}
                      </Droppable>
                  </DayCell>
                </Grid.Col>
              );
            })}
          </Grid>
            )}

            {/* Week View */}
            {viewType === 'week' && (
              <Stack>
                {/* Weekday Headers */}
                <Grid columns={7}>
                  {getDaysInWeek(date).map((day, index) => {
                    const isToday = new Date().toDateString() === day.toDateString();
                    return (
                      <Grid.Col span={1} key={`weekday-${index}`}>
                        <Paper
                          p="xs"
                          withBorder
                          style={{
                            backgroundColor: isToday ? colors.highlight : colors.cardBackground,
                            textAlign: 'center'
                          }}
                        >
                          <Text fw={700} size="sm">
                            {weekDays[index]}
                          </Text>
                          <Text
                            fw={isToday ? 700 : 500}
                            size="md"
                            style={{
                              backgroundColor: isToday ? theme.colors.blue[1] : 'transparent',
                              borderRadius: theme.radius.sm,
                              display: 'inline-block',
                              padding: '2px 8px',
                            }}
                          >
                            {day.getDate()}
                          </Text>
                        </Paper>
                      </Grid.Col>
                    );
                  })}
                </Grid>

                {/* Tasks Section */}
                <Grid columns={7}>
                  {getDaysInWeek(date).map((day, index) => {
                    const dayTasks = getTasksForDate(day);
                    const isToday = new Date().toDateString() === day.toDateString();
                    const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                    return (
                      <Grid.Col span={1} key={`week-day-${index}`}>
                        <Droppable droppableId={`day-${day.toISOString().split('T')[0]}`} type="task">
                          {(provided) => (
                            <Paper
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              style={{
                                backgroundColor: isToday ? colors.highlight : colors.cardBackground,
                                opacity: isPast ? 0.95 : 1,
                                minHeight: '300px',
                                padding: '8px',
                                position: 'relative'
                              }}
                              withBorder
                            >
                              {/* Add task button */}
                              {!isPast && (
                                <ActionIcon
                                  variant="light"
                                  color="blue"
                                  radius="xl"
                                  style={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                    zIndex: 2,
                                  }}
                                  onClick={() => handleAddTaskForDay(day)}
                                >
                                  <IconCirclePlus size={16} />
                                </ActionIcon>
                              )}

                              {/* Tasks */}
                              <Stack gap="xs" mt={30}>
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
                                            padding="xs"
                                            style={{
                                              cursor: 'pointer',
                                              ...(task.source === 'google'
                                                ? { backgroundColor: '#e8f5e9' }
                                                : {
                                                    borderLeft: `4px solid ${
                                                      task.priority === 'high' ? theme.colors.orange[6] :
                                                      task.priority === 'urgent' ? theme.colors.red[6] :
                                                      task.priority === 'medium' ? theme.colors.yellow[6] :
                                                      theme.colors.blue[6]
                                                    }`
                                                  }
                                              )
                                            }}
                                            onClick={() => handleViewTask(task)}
                                          >
                                            <Group justify="space-between" wrap="nowrap">
                                              <div>
                                                <Text fw={500} size="sm" lineClamp={1}>{task.title}</Text>
                                                {task.source === 'google' && (
                                                  <Group gap={4} wrap="nowrap">
                                                    <IconCalendarEvent size={12} color="#43a047" />
                                                    <Text size="xs" c="dimmed">Google Calendar</Text>
                                                  </Group>
                                                )}
                                                {!task.source && task.estimatedHours && (
                                                  <Group gap={4} wrap="nowrap">
                                                    <IconClockHour4 size={12} color="#777" />
                                                    <Text size="xs" c="dimmed">{task.estimatedHours}h</Text>
                                                  </Group>
                                                )}
                                              </div>
                                              <ActionIcon variant="subtle" onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewTask(task);
                                              }}>
                                                <IconEdit size={16} />
                                              </ActionIcon>
                                            </Group>
                                          </Card>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                {provided.placeholder}
                              </Stack>
                            </Paper>
                          )}
                        </Droppable>
                      </Grid.Col>
                    );
                  })}
                </Grid>
              </Stack>
            )}

            {/* Day View */}
            {viewType === 'day' && (
              <Stack>
                {/* Date Header */}
                <Paper
                  p="md"
                  withBorder
                  style={{
                    backgroundColor: colors.cardBackground,
                    textAlign: 'center'
                  }}
                >
                  <Text fw={700} size="xl">
                    {date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </Text>
                </Paper>

                {/* Hour slots */}
                <Grid>
                  <Grid.Col span={2}>
                    <Paper withBorder p="md" style={{ height: '50px', textAlign: 'center' }}>
                      <Text fw={700}>All-day</Text>
                    </Paper>
                  </Grid.Col>
                  <Grid.Col span={10}>
                    <Droppable droppableId={`day-${date.toISOString().split('T')[0]}`} type="task">
                      {(provided) => (
                        <Paper
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          withBorder
                          p="md"
                          style={{
                            minHeight: '50px',
                            backgroundColor: colors.cardBackground
                          }}
                        >
                          <Stack gap="xs">
                            {getTasksForDate(date).map((task, index) => (
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
                                      padding="xs"
                                      style={{
                                        cursor: 'pointer',
                                        ...(task.source === 'google'
                                          ? { backgroundColor: '#e8f5e9' }
                                          : {
                                              borderLeft: `4px solid ${
                                                task.priority === 'high' ? theme.colors.orange[6] :
                                                task.priority === 'urgent' ? theme.colors.red[6] :
                                                task.priority === 'medium' ? theme.colors.yellow[6] :
                                                theme.colors.blue[6]
                                              }`
                                            }
                                        )
                                      }}
                                      onClick={() => handleViewTask(task)}
                                    >
                                      <Group justify="space-between" wrap="nowrap">
                                        <div>
                                          <Text fw={500} size="sm">{task.title}</Text>
                                          {task.description && (
                                            <Text size="xs" c="dimmed" lineClamp={1}>{task.description}</Text>
                                          )}
                                          {task.source === 'google' && (
                                            <Group gap={4} wrap="nowrap">
                                              <IconCalendarEvent size={12} color="#43a047" />
                                              <Text size="xs" c="dimmed">Google Calendar</Text>
                                            </Group>
                                          )}
                                        </div>
                                        <ActionIcon variant="subtle" onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewTask(task);
                                        }}>
                                          <IconEdit size={16} />
                                        </ActionIcon>
                                      </Group>
                                    </Card>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </Stack>

                          {/* Add task button */}
                          <Button
                            leftSection={<IconPlus size={14} />}
                            variant="light"
                            mt="md"
                            onClick={() => handleAddTaskForDay(date)}
                          >
                            Add Task
                          </Button>
                        </Paper>
                      )}
                    </Droppable>
                  </Grid.Col>
                </Grid>

                {/* Hour slots */}
                {getHourSlots().map((slot) => (
                  <Grid key={`hour-${slot.hour}`}>
                    <Grid.Col span={2}>
                      <Paper
                        withBorder
                        p="md"
                        style={{
                          height: '80px',
                          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Text fw={500}>{slot.label}</Text>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={10}>
                      <Paper
                        withBorder
                        p="xs"
                        style={{
                          height: '80px',
                          backgroundColor: colors.cardBackground,
                          borderTop: '1px dashed rgba(0, 0, 0, 0.1)',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          // Future: Add time-based task creation
                          handleAddTaskForDay(date);
                        }}
                      />
                    </Grid.Col>
                  </Grid>
                ))}
              </Stack>
            )}
        </Paper>
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
    </Container>
  );
}