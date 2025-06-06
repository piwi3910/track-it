import { useState, useEffect } from 'react';
import {
  TextInput,
  Group,
  ActionIcon,
  Paper,
  Select,
  Popover,
  TagsInput,
} from '@mantine/core';
import { Button } from '@/components/ui/button';
import { AppTooltip } from '@/components/ui/AppTooltip';
import { notifications } from '@/components/ui/notifications';
import { DatePickerInput } from '@mantine/dates';
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
import type { Task, User } from '@track-it/shared/types/trpc';
import type { FrontendTaskStatus, FrontendTaskPriority } from '@/types/frontend-enums';

interface QuickAddTaskProps {
  defaultStatus?: FrontendTaskStatus;
  defaultDueDate?: Date | null;
  onTaskAdded?: (task?: Task) => void;
  hideStatus?: boolean;
}

export default function QuickAddTask({
  defaultStatus = 'todo',
  defaultDueDate = null,
  onTaskAdded,
  hideStatus = false,
}: QuickAddTaskProps) {
  const { createTask } = useApp();
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<FrontendTaskStatus>(defaultStatus);
  const [dueDate, setDueDate] = useState<Date | null>(defaultDueDate);
  const [priority, setPriority] = useState<FrontendTaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState<number | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);

  // Helper function to highlight today's date
  const getTodayHighlightProps = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    return isToday ? {
      style: {
        backgroundColor: 'var(--mantine-color-blue-1)',
        borderRadius: '50%',
        fontWeight: 'bold'
      }
    } : {};
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
          position: 'top-right',
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
          position: 'top-right',
        });
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred while creating the task.',
        color: 'red',
        position: 'top-right',
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
    <Paper p="md" shadow="xs" withBorder>
      <Group align="flex-start">
        <TextInput
          placeholder="Add a new task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ flex: 1 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        
        <Popover 
          width={300} 
          position="bottom-end" 
          withArrow 
          shadow="md"
          opened={detailsOpen}
          onChange={setDetailsOpen}
        >
          <Popover.Target>
            <AppTooltip label="More details" withArrow position="top">
              <span style={{ display: 'inline-block' }}>
                <ActionIcon
                  color="gray"
                  variant="subtle"
                  onClick={() => setDetailsOpen((o) => !o)}
                >
                  <IconPlus size={16} />
                </ActionIcon>
              </span>
            </AppTooltip>
          </Popover.Target>
          <Popover.Dropdown>
            <Group mb="xs" grow>
              {!hideStatus && (
                <Select
                  data={statusOptions}
                  label="Status"
                  value={status}
                  onChange={(value) => setStatus(value as FrontendTaskStatus)}
                  leftSection={<IconCheck size={16} />}
                  allowDeselect={false}
                />
              )}
              <Select
                data={priorityOptions}
                label="Priority"
                value={priority}
                onChange={(value) => setPriority(value as FrontendTaskPriority)}
                leftSection={<IconFlag size={16} />}
                allowDeselect={false}
              />
            </Group>
            
            <Group mb="xs" grow>
              <DatePickerInput
                label="Due Date"
                placeholder="Select date"
                value={dueDate}
                onChange={setDueDate}
                leftSection={<IconCalendarEvent size={16} />}
                clearable
                getDayProps={getTodayHighlightProps}
              />
              <TextInput
                label="Estimated Hours"
                placeholder="e.g. 2.5"
                value={estimatedHours?.toString() || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setEstimatedHours(isNaN(value) ? undefined : value);
                }}
                leftSection={<IconAlarm size={16} />}
              />
            </Group>
            
            <Group mb="xs" grow>
              <Select
                data={users.map(user => ({
                  value: user.id,
                  label: `${user.name} (${user.role})`
                }))}
                label="Assign To"
                placeholder="Select user"
                value={assigneeId}
                onChange={setAssigneeId}
                leftSection={<IconUser size={16} />}
                clearable
              />
            </Group>
            
            <TagsInput
              label="Tags"
              placeholder="Add tags..."
              leftSection={<IconTag size={16} />}
              value={tags}
              onChange={setTags}
              clearable
            />
          </Popover.Dropdown>
        </Popover>
        
        <Button onClick={handleSubmit}>Add Task</Button>
      </Group>
    </Paper>
  );
}