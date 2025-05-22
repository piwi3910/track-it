import { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  TextInput,
  Textarea,
  Select,
  Group,
  Stack,
  TagsInput,
  Tabs,
  Paper,
  Checkbox,
  ActionIcon,
  NumberInput,
  Divider,
  Text,
  Avatar,
  Switch,
  Badge,
  Tooltip,
  Progress
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconPlus,
  IconTrash,
  IconClock,
  IconSubtask,
  IconRepeat,
  IconCalendarEvent,
  IconCalendar,
  IconMessageCircle2,
  IconCopy
} from '@tabler/icons-react';
import { TaskChat } from './TaskChat';
import { api } from '@/api';
import type { Task, TaskStatus, TaskPriority, Subtask, TaskRecurrence } from '@/types/task';

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

export default function TaskModal({ opened, onClose, onSubmit, task }: TaskModalProps) {
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
    status: 'todo',
    priority: 'medium',
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
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        dueDate: task.dueDate || null,
        startDate: task.startDate || null,
        endDate: task.endDate || null,
        isMultiDay: task.isMultiDay || false,
        tags: task.tags || [],
        assignee: task.assigneeId || '',
        subtasks: task.subtasks || [],
        estimatedHours: task.estimatedHours,
        actualHours: task.actualHours,
        recurrence: task.recurrence || null,
        isRecurring: !!task.recurrence,
      });

      // Fetch comment count when task changes
      const fetchCommentCount = async () => {
        try {
          const count = await api.comments.getCommentCount(task.id);
          setCommentCount(count);
        } catch (error) {
          console.error('Failed to fetch comment count:', error);
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
        status: 'todo',
        priority: 'medium',
        dueDate: null,
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
        const { data, error } = await api.admin.getAllUsers();
        if (data && !error) {
          setUsers(data);
        } else {
          console.error('Failed to fetch users:', error);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    console.log('TaskModal handleSubmit called with formData:', formData);

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

    console.log('TaskModal calling onSubmit with taskData:', taskData);
    onSubmit(taskData);
  };

  const handleChange = (field: string, value: string | string[] | TaskStatus | TaskPriority | null | Subtask[] | number | undefined) => {
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
    <Modal
      opened={opened}
      onClose={onClose}
      zIndex={200}
      overlayProps={{ backgroundOpacity: 0.3 }}
      lockScroll={false}
      title={
        <Group gap={8}>
          <Text>{task ? 'Edit Task' : 'Create New Task'}</Text>
          {task && task.id && (
            <Group gap={4}>
              <Badge size="sm" variant="outline" color="gray" style={{ cursor: 'pointer' }}
                onClick={() => {
                  navigator.clipboard.writeText(task.id);
                  alert('ID copied to clipboard!');
                }}
              >
                {task.id.replace('task', '')}
              </Badge>
              <Tooltip label="Copy ID to clipboard">
                <span style={{ display: 'inline-block' }}>
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    onClick={() => {
                      navigator.clipboard.writeText(task.id);
                      alert('ID copied to clipboard!');
                    }}
                  >
                    <IconCopy size={14} />
                  </ActionIcon>
                </span>
              </Tooltip>
            </Group>
          )}
        </Group>
      }
      size="xl"
    >
      <Group justify="space-between" mb="md">
        <Tabs value={activeTab} onChange={setActiveTab} style={{ flex: 1 }}>
          <Tabs.List>
            <Tabs.Tab value="details">Details</Tabs.Tab>
            <Tabs.Tab value="subtasks">
              <Group gap={4}>
                <IconSubtask size={16} />
                <Text>Subtasks {formData.subtasks.length > 0 ? `(${formData.subtasks.length})` : ''}</Text>
              </Group>
            </Tabs.Tab>
            <Tabs.Tab value="recurrence">
              <Group gap={4}>
                <IconRepeat size={16} />
                <Text>Recurrence {formData.isRecurring ? '(Active)' : ''}</Text>
              </Group>
            </Tabs.Tab>
            {task && task.id && (
              <>
                <Tabs.Tab value="time">Time Tracking</Tabs.Tab>
                <Tabs.Tab value="conversation">
                  <Group gap={4}>
                    <IconMessageCircle2 size={16} />
                    <Text>Conversation {commentCount > 0 && (
                      <Badge size="sm" variant="filled" color="blue" ml={5}>
                        {commentCount}
                      </Badge>
                    )}</Text>
                  </Group>
                </Tabs.Tab>
              </>
            )}
          </Tabs.List>
        </Tabs>

        {/* Template save button - DISABLED */}
        {/* {task && task.id && (
          <Popover
            opened={saveAsTemplateOpen}
            onChange={setSaveAsTemplateOpen}
            width={300}
            position="bottom-end"
          >
            <Popover.Target>
              <Button
                variant="light"
                leftSection={<IconTemplate size={16} />}
                onClick={() => {
                  setSaveAsTemplateOpen(true);
                  setTemplateName(task.title || '');
                }}
              >
                Save as Template
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              <Stack>
                <Text size="sm" weight={500}>Save Task as Template</Text>
                <TextInput
                  label="Template Name"
                  placeholder="Enter a name for this template"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  required
                />
                <Group justify="flex-end">
                  <Button
                    variant="subtle"
                    onClick={() => setSaveAsTemplateOpen(false)}
                    size="xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    leftSection={<IconDeviceFloppy size={14} />}
                    onClick={handleSaveAsTemplate}
                    disabled={!templateName.trim()}
                    size="xs"
                  >
                    Save
                  </Button>
                </Group>
              </Stack>
            </Popover.Dropdown>
          </Popover>
        )} */}
      </Group>

      {(!task || !task.id || activeTab === 'details') && (
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Title"
              placeholder="Task title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
            />

            <Textarea
              label="Description"
              placeholder="Task description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              minRows={3}
            />

            <Group grow>
              <Select
                label="Status"
                placeholder="Select status"
                value={formData.status}
                onChange={(value) => handleChange('status', value)}
                data={[
                  { value: 'backlog', label: 'Backlog' },
                  { value: 'todo', label: 'To Do' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'in_review', label: 'In Review' },
                  { value: 'done', label: 'Done' }
                ]}
                withinPortal
              />

              <Select
                label="Priority"
                placeholder="Select priority"
                value={formData.priority}
                onChange={(value) => handleChange('priority', value)}
                data={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' }
                ]}
                withinPortal
              />
            </Group>

            <Group align="flex-start">
              <Switch
                label="Multi-day task"
                checked={formData.isMultiDay}
                onChange={(event) => handleChange('isMultiDay', event.currentTarget.checked)}
              />
            </Group>

            {!formData.isMultiDay ? (
              <Group grow>
                <DatePickerInput
                  label="Due Date"
                  placeholder="Select due date"
                  value={formData.dueDate ? new Date(formData.dueDate) : null}
                  onChange={(date) => {
                    const dateStr = date ? date.toISOString().split('T')[0] : null;
                    handleChange('dueDate', dateStr);
                  }}
                  clearable
                  leftSection={<IconCalendarEvent size={16} />}
                  withinPortal
                  getDayProps={getTodayHighlightProps}
                />

                <div style={{ flex: 1 }}></div>
              </Group>
            ) : (
              <Group grow>
                <DatePickerInput
                  label="Start Date"
                  placeholder="Select start date"
                  value={formData.startDate ? new Date(formData.startDate) : null}
                  onChange={(date) => {
                    const dateStr = date ? date.toISOString().split('T')[0] : null;
                    handleChange('startDate', dateStr);

                    // If end date is not set or is before start date, set it to start date
                    if (dateStr && (!formData.endDate || new Date(dateStr) > new Date(formData.endDate))) {
                      handleChange('endDate', dateStr);
                    }
                  }}
                  clearable
                  leftSection={<IconCalendarEvent size={16} />}
                  withinPortal
                  getDayProps={getTodayHighlightProps}
                />

                <DatePickerInput
                  label="End Date"
                  placeholder="Select end date"
                  value={formData.endDate ? new Date(formData.endDate) : null}
                  onChange={(date) => {
                    const dateStr = date ? date.toISOString().split('T')[0] : null;
                    handleChange('endDate', dateStr);
                  }}
                  clearable
                  leftSection={<IconCalendarEvent size={16} />}
                  minDate={formData.startDate ? new Date(formData.startDate) : undefined}
                  withinPortal
                  getDayProps={getTodayHighlightProps}
                />
              </Group>
            )}

            <Group grow>
              <Select
                label="Assignee"
                placeholder="Select assignee"
                value={formData.assignee}
                onChange={(value) => handleChange('assignee', value)}
                data={users.map(user => ({
                  value: user.id,
                  label: `${user.name} (${user.role})`,
                  image: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
                }))}
                clearable
                searchable
                maxDropdownHeight={200}
                nothingFoundMessage="No matching user found"
                withinPortal
                renderOption={({ option }) => (
                  <Group gap="xs">
                    <Avatar src={option.image} size="sm" radius="xl" />
                    <div>
                      <Text size="sm">{option.label.split(' (')[0]}</Text>
                      <Text size="xs" c="dimmed">{option.label.match(/\((.*?)\)/)?.[1] || ''}</Text>
                    </div>
                  </Group>
                )}
              />
            </Group>

            <TagsInput
              label="Tags"
              placeholder="Enter tags"
              value={formData.tags}
              onChange={(tags) => handleChange('tags', tags)}
            />

            <Group justify="flex-end" mt="xl">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Task</Button>
            </Group>
          </Stack>
        </form>
      )}

      {activeTab === 'subtasks' && (
        <Stack>
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={500}>Subtasks</Text>
                <Text size="sm" c="dimmed">
                  {formData.subtasks.filter(s => s.completed).length}/{formData.subtasks.length} completed
                </Text>
              </Group>
              <Divider />

              {formData.subtasks.length === 0 ? (
                <Text c="dimmed" ta="center" py="md">
                  No subtasks yet. Add subtasks to break down this task into smaller steps.
                </Text>
              ) : (
                <>
                  {/* Display completed subtasks at the bottom */}
                  {[...formData.subtasks]
                    .sort((a, b) => {
                      if (a.completed === b.completed) return 0;
                      return a.completed ? 1 : -1;
                    })
                    .map((subtask) => (
                      <Group key={subtask.id} gap="md" align="flex-start">
                        <Checkbox
                          checked={subtask.completed}
                          onChange={(e) => handleSubtaskChange(subtask.id, 'completed', e.currentTarget.checked)}
                          style={{ marginTop: 8 }}
                        />
                        <TextInput
                          style={{
                            flex: 1,
                            textDecoration: subtask.completed ? 'line-through' : 'none',
                            opacity: subtask.completed ? 0.7 : 1
                          }}
                          placeholder="Subtask description"
                          value={subtask.title}
                          onChange={(e) => handleSubtaskChange(subtask.id, 'title', e.target.value)}
                        />
                        <ActionIcon color="red" onClick={() => handleRemoveSubtask(subtask.id)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    ))
                  }

                  {/* Show progress bar */}
                  {formData.subtasks.length > 0 && (
                    <Progress
                      value={(formData.subtasks.filter(s => s.completed).length / formData.subtasks.length) * 100}
                      size="sm"
                      color="green"
                    />
                  )}
                </>
              )}

              <Button
                leftSection={<IconPlus size={14} />}
                variant="outline"
                onClick={handleAddSubtask}
              >
                Add Subtask
              </Button>
            </Stack>
          </Paper>

          <Group justify="flex-end" mt="xl">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Task</Button>
          </Group>
        </Stack>
      )}

      {activeTab === 'recurrence' && (
        <Stack>
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={500}>Recurring Task</Text>
                <Switch
                  label="Enable recurrence"
                  checked={formData.isRecurring}
                  onChange={(e) => handleToggleRecurrence(e.currentTarget.checked)}
                />
              </Group>
              <Divider />

              {formData.isRecurring ? (
                <Stack gap="md">
                  <Select
                    label="Recurrence Pattern"
                    placeholder="Select pattern"
                    value={formData.recurrence?.pattern || 'weekly'}
                    onChange={(value) => handleRecurrenceChange('pattern', value)}
                    data={[
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'biweekly', label: 'Bi-weekly' },
                      { value: 'monthly', label: 'Monthly' },
                      { value: 'quarterly', label: 'Quarterly' },
                      { value: 'yearly', label: 'Yearly' }
                    ]}
                    leftSection={<IconRepeat size={16} />}
                    withinPortal
                  />

                  <NumberInput
                    label="Interval"
                    placeholder="Repeat every X"
                    description={`Repeat every ${formData.recurrence?.interval || 1} ${formData.recurrence?.pattern || 'week(s)'}`}
                    value={formData.recurrence?.interval || 1}
                    onChange={(value) => handleRecurrenceChange('interval', value)}
                    min={1}
                    max={99}
                  />

                  {formData.recurrence?.pattern === 'weekly' && (
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>Days of Week</Text>
                      <Group>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                          const isSelected = formData.recurrence?.daysOfWeek?.includes(index);
                          return (
                            <Badge
                              key={day}
                              variant={isSelected ? 'filled' : 'outline'}
                              color={isSelected ? 'blue' : 'gray'}
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
                      </Group>
                    </Stack>
                  )}

                  {formData.recurrence?.pattern === 'monthly' && (
                    <NumberInput
                      label="Day of Month"
                      placeholder="Day of month"
                      value={formData.recurrence?.dayOfMonth || 1}
                      onChange={(value) => handleRecurrenceChange('dayOfMonth', value)}
                      min={1}
                      max={31}
                    />
                  )}

                  <DatePickerInput
                    label="End Date (Optional)"
                    placeholder="When should recurrence end?"
                    value={formData.recurrence?.endDate ? new Date(formData.recurrence.endDate) : null}
                    onChange={(date) => {
                      const dateStr = date ? date.toISOString().split('T')[0] : null;
                      handleRecurrenceChange('endDate', dateStr);
                    }}
                    clearable
                    leftSection={<IconCalendar size={16} />}
                    withinPortal
                    getDayProps={getTodayHighlightProps}
                  />

                  <Paper p="xs" withBorder bg="blue.0">
                    <Group gap="xs">
                      <IconCalendarEvent size={16} />
                      <Text size="sm">
                        {getRecurrenceSummary(formData.recurrence)}
                      </Text>
                    </Group>
                  </Paper>
                </Stack>
              ) : (
                <Text c="dimmed" ta="center" py="md">
                  Enable recurrence to make this task repeat automatically.
                </Text>
              )}
            </Stack>
          </Paper>

          <Group justify="flex-end" mt="xl">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Task</Button>
          </Group>
        </Stack>
      )}

      {task && task.id && activeTab === 'time' && (
        <Stack>
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Text fw={500}>Time Tracking</Text>
              <Divider />

              <Group grow>
                <NumberInput
                  label="Estimated Hours"
                  placeholder="Enter estimated hours"
                  value={formData.estimatedHours}
                  onChange={(value) => handleChange('estimatedHours', value)}
                  min={0}
                  decimalScale={1}
                  step={0.5}
                  leftSection={<IconClock size={16} />}
                />

                <NumberInput
                  label="Actual Hours"
                  placeholder="Enter actual hours spent"
                  value={formData.actualHours}
                  onChange={(value) => handleChange('actualHours', value)}
                  min={0}
                  decimalScale={1}
                  step={0.5}
                  leftSection={<IconClock size={16} />}
                />
              </Group>

              {formData.estimatedHours && formData.actualHours ? (
                <Paper p="sm" withBorder bg={formData.actualHours > formData.estimatedHours ? 'red.0' : 'green.0'}>
                  <Text size="sm">
                    {formData.actualHours > formData.estimatedHours
                      ? `Over estimate by ${(formData.actualHours - formData.estimatedHours).toFixed(1)} hours`
                      : `Under estimate by ${(formData.estimatedHours - formData.actualHours).toFixed(1)} hours`}
                  </Text>
                </Paper>
              ) : null}
            </Stack>
          </Paper>

          <Group justify="flex-end" mt="xl">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Task</Button>
          </Group>
        </Stack>
      )}

      {task && task.id && activeTab === 'conversation' && (
        <Stack>
          <TaskChat
            taskId={task.id}
            onCommentCountChange={(count) => setCommentCount(count)}
          />

          <Group justify="flex-end" mt="xl">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}