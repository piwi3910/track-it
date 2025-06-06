import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Text,
  Group,
  ActionIcon,
  useMantineTheme,
  Progress,
  Avatar,
  Box,
  TextInput,
  NumberInput,
  Popover,
  Stack,
  Divider,
  Indicator
} from '@mantine/core';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppTooltip } from '@/components/ui/AppTooltip';
import { AppMenu } from '@/components/ui/AppMenu';
import { AppCheckbox } from '@/components/ui/AppCheckbox';
// Using centralized theme styles
import {
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconMessageCircle2,
  IconSubtask,
  IconClock,
  IconCheck,
  IconHourglass,
  IconRepeat,
  IconPlayerPlay,
  IconPlayerStop,
  IconPlus
} from '@tabler/icons-react';
import { useApp } from '@/hooks/useApp';
import { useTheme } from '@/hooks/useTheme';;
import type { Task } from '@track-it/shared/types/trpc';
import { api } from '@/api';

// Define interfaces for properties that don't exist in the shared Task type
interface TaskRecurrence {
  pattern: string;
  interval?: number;
  endDate?: string | null;
}

// Global users cache to avoid refetching in every component
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

let globalUsersCache: User[] = [];
let globalUsersCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper functions for user data
const getAssigneeName = (userId: string): string => {
  const user = globalUsersCache.find(u => u.id === userId);
  return user?.name || 'Unknown User';
};

const getAssigneeAvatar = (userId: string): string => {
  const user = globalUsersCache.find(u => u.id === userId);
  return user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(getAssigneeName(userId))}&background=random`;
};

// Function to fetch and cache users
const fetchUsersIfNeeded = async () => {
  const now = Date.now();
  if (globalUsersCache.length > 0 && (now - globalUsersCacheTime) < CACHE_DURATION) {
    return; // Cache is still valid
  }

  try {
    const data = await api.admin.getAllUsers();
    globalUsersCache = data as User[];
    globalUsersCacheTime = now;
  } catch (error) {
    console.error('Error fetching users for TaskCard:', error);
  }
};

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
      <TextInput
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
        size="sm"
        styles={{
          input: {
            fontWeight: 500,
            padding: '2px 8px',
            height: 'auto',
          },
          wrapper: {
            width: '100%'
          }
        }}
      />
    );
  }
  
  return (
    <Group gap={4} style={{ cursor: 'pointer' }}>
      <Text fw={500} className="task-card-title" style={{ flex: 1 }}>{value}</Text>
      <ActionIcon 
        size="xs" 
        variant="subtle" 
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
      >
        <IconPencil size={12} />
      </ActionIcon>
    </Group>
  );
}

export default function TaskCard({ task, onEdit, onDelete, onViewConversation }: TaskCardProps) {
  const mantineTheme = useMantineTheme();
  const { getPriorityColor } = useTheme();
  
  const [localTask, setLocalTask] = useState<Task>(task);
  const [titleChanged, setTitleChanged] = useState(false);
  const [priorityPopoverOpened, setPriorityPopoverOpened] = useState(false);
  const [timePopoverOpened, setTimePopoverOpened] = useState(false);
  const [assignmentPopoverOpened, setAssignmentPopoverOpened] = useState(false);
  const [isTimeTrackingActive, setIsTimeTrackingActive] = useState(!!task.timeTrackingActive);

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsersIfNeeded();
  }, []);
  const [trackingTime, setTrackingTime] = useState(task.trackingTimeSeconds || 0); // in seconds
  const [trackingInterval, setTrackingInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const { updateTask } = useApp();

  // Fetch comment count
  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const result = await api.comments.getCountByTaskId(task.id);
        if (typeof result === 'number') {
          setCommentCount(result);
        }
      } catch (error) {
        console.error('Failed to fetch comment count:', error);
      }
    };

    fetchCommentCount();
  }, [task.id]);
  
  // Update local task when prop changes
  useEffect(() => {
    setLocalTask(task);
    
    // Update tracking status from task
    setIsTimeTrackingActive(!!task.timeTrackingActive);
    setTrackingTime(task.trackingTimeSeconds || 0);
    
    // If task is actively being tracked, restart the timer
    if (task.timeTrackingActive && !trackingInterval) {
      const interval = setInterval(() => {
        setTrackingTime(prev => {
          // Save updated tracking time to task every 5 seconds
          if ((prev + 1) % 5 === 0) {
            updateTask(task.id, { 
              trackingTimeSeconds: prev + 1,
              timeTrackingActive: true
            });
          }
          return prev + 1;
        });
      }, 1000);
      
      setTrackingInterval(interval);
    }
  }, [task, trackingInterval, updateTask]);
  
  // Calculate subtask completion
  const subtaskCount = localTask.subtasks?.length || 0;
  const completedSubtasks = localTask.subtasks?.filter(subtask => 'completed' in subtask && subtask.completed).length || 0;
  const subtaskProgress = subtaskCount > 0 ? (completedSubtasks / subtaskCount) * 100 : 0;
  
  // Handle title change
  const handleTitleChange = (title: string) => {
    setLocalTask(prev => ({ ...prev, title }));
    setTitleChanged(true);
  };
  
  // Handle save changes
  const handleSaveChanges = () => {
    if (titleChanged) {
      updateTask(localTask.id, { title: localTask.title });
      setTitleChanged(false);
    }
  };
  
  // Handle priority change
  const handlePriorityChange = (value: string) => {
    setLocalTask(prev => ({ ...prev, priority: value }));
    updateTask(localTask.id, { priority: value });
    setPriorityPopoverOpened(false);
  };
  
  // Handle time change
  const handleTimeChange = (field: 'estimatedHours' | 'actualHours', value: number | string) => {
    if (typeof value === 'number') {
      setLocalTask(prev => ({ ...prev, [field]: value }));
      updateTask(localTask.id, { [field]: value });
    }
  };
  
  // Save time changes
  const handleSaveTimeChanges = () => {
    setTimePopoverOpened(false);
  };

  // Format tracking time for display (HH:MM:SS)
  const formatTrackingTime = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  // Handle starting and stopping time tracking
  const handleToggleTimeTracking = () => {
    if (isTimeTrackingActive) {
      // Stop tracking
      if (trackingInterval) {
        clearInterval(trackingInterval);
        setTrackingInterval(null);
      }

      // Convert tracking time to hours and add to actual hours
      const trackingHours = parseFloat((trackingTime / 3600).toFixed(1));
      const currentHours = localTask.actualHours || 0;
      const totalHours = parseFloat((currentHours + trackingHours).toFixed(1));

      // Update task with new actual hours and reset tracking status
      updateTask(localTask.id, { 
        actualHours: totalHours,
        timeTrackingActive: false,
        trackingTimeSeconds: 0
      });

      // Update local state
      setLocalTask(prev => ({
        ...prev,
        actualHours: totalHours,
        timeTrackingActive: false,
        trackingTimeSeconds: 0
      }));

      // Reset tracking time
      setTrackingTime(0);
    } else {
      // Start tracking
      const interval = setInterval(() => {
        setTrackingTime(prev => {
          // Save updated tracking time to task every 5 seconds
          if ((prev + 1) % 5 === 0) {
            updateTask(localTask.id, { 
              trackingTimeSeconds: prev + 1,
              timeTrackingActive: true
            });
            
            setLocalTask(currentTask => ({
              ...currentTask,
              trackingTimeSeconds: prev + 1,
              timeTrackingActive: true
            }));
          }
          return prev + 1;
        });
      }, 1000);

      // Update task immediately to mark it as being tracked
      updateTask(localTask.id, { 
        timeTrackingActive: true,
        trackingTimeSeconds: trackingTime
      });
      
      // Update local state
      setLocalTask(prev => ({
        ...prev,
        timeTrackingActive: true,
        trackingTimeSeconds: trackingTime
      }));

      setTrackingInterval(interval);
    }

    setIsTimeTrackingActive(!isTimeTrackingActive);
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval);

        // If time tracking is active, save the current tracking time before unmounting
        if (isTimeTrackingActive) {
          updateTask(localTask.id, {
            trackingTimeSeconds: trackingTime,
            timeTrackingActive: true
          });
        }
      }
    };
  }, [trackingInterval, isTimeTrackingActive, trackingTime, localTask.id, updateTask]);

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
        {/* Assignment popover for both assigned and unassigned tasks */}
        <Popover 
          opened={assignmentPopoverOpened}
          onChange={setAssignmentPopoverOpened}
          position="bottom" 
          withArrow 
          shadow="md"
        >
          <Popover.Target>
            {localTask.assigneeId ? (
              <AppTooltip label={`Assigned to ${getAssigneeName(localTask.assigneeId)} - Click to reassign`} position="bottom">
                <span style={{ display: 'inline-block' }}>
                  <Avatar
                    size={32}
                    radius="xl"
                    src={getAssigneeAvatar(localTask.assigneeId)}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAssignmentPopoverOpened(true);
                    }}
                  />
                </span>
              </AppTooltip>
            ) : (
              <AppTooltip label="Click to assign task" position="bottom">
                <ActionIcon
                  size={32}
                  radius="xl"
                  variant="outline"
                  color="gray"
                  style={{ 
                    cursor: 'pointer',
                    borderStyle: 'dashed',
                    borderWidth: '1px'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssignmentPopoverOpened(true);
                  }}
                >
                  <IconPlus size={12} />
                </ActionIcon>
              </AppTooltip>
            )}
          </Popover.Target>
          <Popover.Dropdown>
            <Stack gap="xs">
              <Text fw={500}>Task Assignment</Text>
              <Divider />
              {globalUsersCache.map((user) => (
                <Group
                  key={user.id}
                  justify="space-between"
                  style={{
                    padding: '6px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: localTask.assigneeId === user.id ?
                      mantineTheme.colors.blue[0] :
                      'transparent'
                  }}
                  className="hover-highlight"
                  onClick={() => {
                    setLocalTask(prev => ({ ...prev, assigneeId: user.id }));
                    updateTask(localTask.id, { assigneeId: user.id });
                    setAssignmentPopoverOpened(false);
                  }}
                >
                  <Group gap="sm">
                    <Avatar size="sm" radius="xl" src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} />
                    <div>
                      <Text size="sm">{user.name}</Text>
                      <Text size="xs" c="dimmed">{user.role}</Text>
                    </div>
                  </Group>
                  {localTask.assigneeId === user.id && (
                    <ActionIcon size="sm" color="blue" variant="light">
                      <IconCheck size={14} />
                    </ActionIcon>
                  )}
                </Group>
              ))}

              {/* Option to unassign */}
              {localTask.assigneeId && (
                <>
                  <Divider />
                  <Group
                    style={{
                      padding: '6px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    className="hover-highlight"
                    onClick={() => {
                      setLocalTask(prev => ({ ...prev, assigneeId: null }));
                      updateTask(localTask.id, { assigneeId: null });
                      setAssignmentPopoverOpened(false);
                    }}
                  >
                    <Text size="sm" c="red">Unassign</Text>
                  </Group>
                </>
              )}
            </Stack>
          </Popover.Dropdown>
        </Popover>
        
        {/* Menu */}
        <AppMenu position="bottom-end">
          <AppMenu.Target>
            <ActionIcon variant="subtle" size="sm" onClick={(e) => e.stopPropagation()}>
              <IconDotsVertical size={16} />
            </ActionIcon>
          </AppMenu.Target>
          <AppMenu.Dropdown>
            {onEdit && (
              <AppMenu.Item
                leftSection={<IconPencil size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                Edit
              </AppMenu.Item>
            )}
            {/* Time tracking in menu */}
            <AppMenu.Item
              leftSection={isTimeTrackingActive ? <IconPlayerStop size={14} color="red" /> : <IconPlayerPlay size={14} color="green" />}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleTimeTracking();
              }}
            >
              {isTimeTrackingActive ? 'Stop Time Tracking' : 'Start Time Tracking'}
              {isTimeTrackingActive && trackingTime > 0 && ` (${formatTrackingTime(trackingTime)})`}
            </AppMenu.Item>
            {onEdit && (
              <AppMenu.Item
                leftSection={<IconSubtask size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  // Create a new subtask and then open the edit modal
                  const updatedSubtasks = [
                    ...(localTask.subtasks || []),
                    { id: `subtask-${Date.now()}`, title: '', completed: false }
                  ];

                  updateTask(localTask.id, {
                    subtasks: updatedSubtasks
                  });

                  // Update local state
                  setLocalTask(prev => ({
                    ...prev,
                    subtasks: updatedSubtasks
                  }));

                  // Open the edit modal to allow the user to edit the new subtask
                  onEdit();
                }}
              >
                Add Subtask
              </AppMenu.Item>
            )}
            {onViewConversation && (
              <AppMenu.Item
                leftSection={<IconMessageCircle2 size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewConversation();
                }}
                rightSection={commentCount > 0 && (
                  <Badge className="text-xs h-5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {commentCount}
                  </Badge>
                )}
              >
                View Conversation
              </AppMenu.Item>
            )}
            {onDelete && (
              <AppMenu.Item
                leftSection={<IconTrash size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                color="red"
              >
                Delete
              </AppMenu.Item>
            )}
          </AppMenu.Dropdown>
        </AppMenu>
      </div>

      {/* Task number in the top-left corner */}
      <div className="task-card-corner-top-left" style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        zIndex: 25
      }}>
        <AppTooltip label={`Task #${localTask.taskNumber} - Click to copy`} position="top">
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--mantine-color-blue-6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              color: 'white',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
              transition: 'all 0.2s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(localTask.taskNumber.toString());
              // Apply temporary visual feedback
              const element = e.currentTarget as HTMLDivElement;
              element.style.opacity = '0.6';
              setTimeout(() => {
                element.style.opacity = '1';
              }, 150);
            }}
            onMouseEnter={(e) => {
              const element = e.currentTarget as HTMLDivElement;
              element.style.transform = 'scale(1.05)';
              element.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              const element = e.currentTarget as HTMLDivElement;
              element.style.transform = 'scale(1)';
              element.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.12)';
            }}
          >
            {localTask.taskNumber}
          </div>
        </AppTooltip>
      </div>

      {/* Task Content */}
      <div style={{ paddingTop: 48 }}>
        {/* Recurrence indicator */}
        {localTask.recurrence && (
          <Group gap={8} mb="xs" data-no-propagation="true" justify="flex-start">
            <AppTooltip label={getRecurrenceDescription(localTask.recurrence)} position="top">
              <span style={{ display: 'inline-block' }}>
                <ActionIcon size="xs" variant="subtle" color="blue">
                  <IconRepeat size={16} />
                </ActionIcon>
              </span>
            </AppTooltip>
          </Group>
        )}

        <EditableTitle
          value={localTask.title}
          onChange={handleTitleChange}
          onSave={handleSaveChanges}
        />
      </div>

      {/* Task metadata - simplified */}
      <Group justify="space-between" mt="xs" data-no-propagation="true">
        <Popover
          opened={priorityPopoverOpened}
          onChange={setPriorityPopoverOpened}
          position="bottom"
          withArrow
          shadow="md"
        >
          <Popover.Target>
            <Badge
              variant={localTask.priority === 'URGENT' ? 'destructive' : 'secondary'}
              className={localTask.priority === 'LOW' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                     localTask.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                     localTask.priority === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : ''}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                setPriorityPopoverOpened(true);
              }}
            >
              {localTask.priority.charAt(0).toUpperCase() + localTask.priority.slice(1)}
            </Badge>
          </Popover.Target>
          <Popover.Dropdown>
            <Stack gap="xs">
              {['low', 'medium', 'high', 'urgent'].map((priority) => (
                <Group
                  key={priority}
                  gap="xs"
                  onClick={() => {
                    handlePriorityChange(priority);
                  }}
                  style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
                  className="hover-highlight"
                >
                  <Badge 
                    variant={priority === 'urgent' ? 'destructive' : 'secondary'}
                    className={priority === 'low' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
                             priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                             priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' : ''}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Badge>
                  {localTask.priority === priority && <IconCheck size={14} />}
                </Group>
              ))}
            </Stack>
          </Popover.Dropdown>
        </Popover>

        {localTask.dueDate && (
          <Text size="xs" c="dimmed" className="task-card-secondary-text">
            Due: {new Date(localTask.dueDate).toLocaleDateString()}
          </Text>
        )}
      </Group>
      
      {/* Subtasks progress if available */}
      {subtaskCount > 0 && (
        <Popover position="bottom" withArrow shadow="md">
          <Popover.Target>
            <Box mt="xs" data-no-propagation="true" style={{ cursor: 'pointer' }} onClick={e => e.stopPropagation()}>
              <Group gap="xs" mb={2}>
                <IconSubtask size={12} />
                <Text size="xs" className="task-card-secondary-text">{completedSubtasks}/{subtaskCount} subtasks</Text>
              </Group>
              <Progress
                value={subtaskProgress}
                size="sm"
                color={subtaskProgress === 100 ? 'green' : 'blue'}
              />
            </Box>
          </Popover.Target>
          <Popover.Dropdown>
            <Stack gap="xs">
              <Text fw={500}>Subtasks</Text>
              <Divider />
              {localTask.subtasks?.map((subtask) => (
                <Group key={subtask.id} gap="xs" align="flex-start">
                  <AppCheckbox
                    checked={('completed' in subtask && Boolean(subtask.completed)) || false}
                    onChange={(e) => {
                      // Create a copy of subtasks with the updated one
                      const updatedSubtasks = localTask.subtasks?.map(st =>
                        st.id === subtask.id
                          ? { ...st, completed: e.currentTarget.checked }
                          : st
                      );

                      // Update local state
                      setLocalTask(prev => ({
                        ...prev,
                        subtasks: updatedSubtasks
                      }));

                      // Update in the backend
                      // @ts-expect-error - Subtask structure mismatch
                      updateTask(localTask.id, { subtasks: updatedSubtasks });
                    }}
                    style={{ marginTop: 3 }}
                  />
                  <Text size="sm" className="task-card-secondary-text" style={{
                    textDecoration: ('completed' in subtask && subtask.completed) ? 'line-through' : 'none',
                    opacity: ('completed' in subtask && subtask.completed) ? 0.7 : 1
                  }}>
                    {subtask.title}
                  </Text>
                </Group>
              ))}
              <Button
                size="sm"
                variant="secondary"
                className="h-6 text-xs"
                onClick={() => {
                  onEdit?.();
                }}
              >
                <IconSubtask size={14} className="mr-2 h-4 w-4" />
                Manage Subtasks
              </Button>
            </Stack>
          </Popover.Dropdown>
        </Popover>
      )}
      
      {/* Time tracking */}
      <Popover
        opened={timePopoverOpened}
        onChange={setTimePopoverOpened}
        position="bottom"
        withArrow
        shadow="md"
      >
        <Popover.Target>
          <Group
            gap="xs"
            mt="xs"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setTimePopoverOpened(true);
            }}
            data-no-propagation="true"
          >
            <IconClock size={12} />
            <Text size="xs" className="task-card-secondary-text">
              {localTask.actualHours ? `${localTask.actualHours}h spent` : ''}
              {localTask.actualHours && localTask.estimatedHours ? ' / ' : ''}
              {localTask.estimatedHours ? `${localTask.estimatedHours}h estimated` : ''}
              {!localTask.actualHours && !localTask.estimatedHours ? 'Set time tracking...' : ''}
            </Text>
            {isTimeTrackingActive && (
              <Badge variant="destructive" className="text-xs h-5">
                {formatTrackingTime(trackingTime)}
              </Badge>
            )}
          </Group>
        </Popover.Target>
        <Popover.Dropdown>
          <Stack gap="sm">
            <NumberInput
              label="Estimated Hours"
              placeholder="Enter estimated hours"
              value={localTask.estimatedHours}
              onChange={(value) => handleTimeChange('estimatedHours', value)}
              min={0}
              step={0.5}
              decimalScale={1}
              leftSection={<IconHourglass size={14} />}
            />

            <NumberInput
              label="Actual Hours Spent"
              placeholder="Enter actual hours spent"
              value={localTask.actualHours}
              onChange={(value) => handleTimeChange('actualHours', value)}
              min={0}
              step={0.5}
              decimalScale={1}
              leftSection={<IconClock size={14} />}
            />

            {/* Time tracking buttons */}
            <Group>
              <Button
                size="sm"
                variant={isTimeTrackingActive ? 'destructive' : 'secondary'}
                className="h-6 text-xs"
                onClick={() => {
                  handleToggleTimeTracking();
                }}
              >
                {isTimeTrackingActive ? <IconPlayerStop size={14} className="mr-2 h-4 w-4" /> : <IconPlayerPlay size={14} className="mr-2 h-4 w-4" />}
                {isTimeTrackingActive ? 'Stop Tracking' : 'Start Tracking'}
              </Button>

              {trackingTime > 0 && (
                <Text size="sm" fw={500}>
                  {formatTrackingTime(trackingTime)}
                </Text>
              )}
            </Group>

            <Group justify="flex-end">
              <ActionIcon
                variant="filled"
                color="blue"
                onClick={() => {
                  handleSaveTimeChanges();
                }}
              >
                <IconCheck size={16} />
              </ActionIcon>
            </Group>
          </Stack>
        </Popover.Dropdown>
      </Popover>
      
      {/* Comments indicator */}
      {commentCount > 0 && (
        <Group gap="xs" mt="xs" data-no-propagation="true" onClick={() => {
          onViewConversation?.();
        }} style={{ cursor: 'pointer' }}>
          <IconMessageCircle2 size={12} />
          <Text size="xs" className="task-card-secondary-text">{commentCount} comment{commentCount !== 1 ? 's' : ''}</Text>
        </Group>
      )}


      {/* Tags */}
      {localTask.tags && localTask.tags.length > 0 && (
        <Group mt="sm" gap="xs" data-no-propagation="true">
          {localTask.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-sm lowercase"
            >
              {tag}
            </Badge>
          ))}
        </Group>
      )}
    </div>
  );

  // Set background color based on task status - now handled by CSS
  const getCardBackgroundColor = () => {
    // Let CSS handle the background colors via data attributes
    return 'transparent';
  };

  // Create data attributes for CSS targeting
  const cardDataAttributes = {
    'data-blocked': 'false', // No BLOCKED status in shared types
    'data-done': localTask.status === 'DONE' ? 'true' : 'false'
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* This transparent overlay is what handles the click to open the editor */}
      <div
        className="task-card-clickable-overlay"
        onClick={onEdit}
      />

      {/* The actual card content, all with higher z-index for interactive elements */}
      {isTimeTrackingActive ? (
        <Indicator
          inline
          processing
          color="red"
          size={8}
          offset={8}
          position="top-end"
          withBorder
          label={formatTrackingTime(trackingTime)}
          zIndex={20}
        >
          {commentCount > 0 ? (
            <Indicator
              inline
              color="blue"
              size={20}
              offset={12}
              position="bottom-end"
              label={commentCount}
              zIndex={20}
              onClick={() => {
                onViewConversation?.();
              }}
              style={{ cursor: 'pointer' }}
            >
              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                {...cardDataAttributes}
                style={{
                  borderLeft: `4px solid ${getPriorityColor(localTask.priority)}`,
                  position: 'relative',
                  zIndex: 10,
                  backgroundColor: getCardBackgroundColor()
                }}
              >
                {renderCardContent()}
              </Card>
            </Indicator>
          ) : (
            <Card
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              {...cardDataAttributes}
              style={{
                borderLeft: `4px solid ${getPriorityColor(localTask.priority)}`,
                position: 'relative',
                zIndex: 10,
                backgroundColor: getCardBackgroundColor()
              }}
            >
              {renderCardContent()}
            </Card>
          )}
        </Indicator>
      ) : (
        commentCount > 0 ? (
          <Indicator
            inline
            color="blue"
            size={20}
            offset={12}
            position="bottom-end"
            label={commentCount}
            zIndex={20}
            onClick={() => {
              onViewConversation?.();
            }}
            style={{ cursor: 'pointer' }}
          >
            <Card
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              {...cardDataAttributes}
              style={{
                borderLeft: `4px solid ${getPriorityColor(localTask.priority)}`,
                position: 'relative',
                zIndex: 10,
                backgroundColor: getCardBackgroundColor()
              }}
            >
              {renderCardContent()}
            </Card>
          </Indicator>
        ) : (
          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{
              borderLeft: `4px solid ${getPriorityColor(localTask.priority)}`,
              position: 'relative',
              zIndex: 10
            }}
          >
            {renderCardContent()}
          </Card>
        )
      )}
    </div>
  );
}