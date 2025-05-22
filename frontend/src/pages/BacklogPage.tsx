import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Group,
  Button,
  Table,
  Text,
  Badge,
  Menu,
  ActionIcon,
  TextInput,
  Select,
  Stack,
  Paper,
  Box,
  Loader,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconArrowRight
} from '@tabler/icons-react';
import TaskModal from '@/components/TaskModal';
import QuickAddTask from '@/components/QuickAddTask';
import type { Task, TaskPriority } from '@/types/task';
import { api } from '@/api';

// Map priority to color
const priorityColorMap: Record<TaskPriority, string> = {
  low: 'blue',
  medium: 'yellow',
  high: 'orange',
  urgent: 'red',
};

export function BacklogPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Load tasks from API
  useEffect(() => {
    const fetchBacklogTasks = async () => {
      setLoading(true);
      try {
        // First try to get tasks by status
        const { data, error } = await api.tasks.getByStatus('backlog');
        
        if (error) {
          throw new Error(error);
        }
        
        if (data) {
          setTasks(data);
        } else {
          // Fallback to getting all tasks and filtering locally
          const allTasksResult = await api.tasks.getAll();
          if (allTasksResult.error) {
            throw new Error(allTasksResult.error);
          }
          
          if (allTasksResult.data) {
            // Filter tasks with 'backlog' status
            const backlogTasks = allTasksResult.data.filter(task => task.status === 'backlog');
            setTasks(backlogTasks);
          }
        }
      } catch (err) {
        console.error('Failed to load backlog tasks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBacklogTasks();
  }, []);
  
  // Filter and sort tasks
  const filteredAndSortedTasks = tasks
    .filter(task => 
      task.status === 'backlog' &&
      (searchQuery === '' || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        task.taskNumber.toString().includes(searchQuery)
      ) &&
      (priorityFilter === null || task.priority === priorityFilter)
    )
    .sort((a, b) => {
      if (sortBy === 'title') {
        return sortDirection === 'asc' 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      }
      
      if (sortBy === 'priority') {
        const priorityOrder = { urgent: 3, high: 2, medium: 1, low: 0 };
        return sortDirection === 'asc'
          ? (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0)
          : (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      }
      
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return sortDirection === 'asc' ? -1 : 1;
        if (!b.dueDate) return sortDirection === 'asc' ? 1 : -1;
        
        return sortDirection === 'asc'
          ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }
      
      return 0;
    });
  
  const handleAddTask = () => {
    setSelectedTask(null);
    setTaskModalOpen(true);
  };
  
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };
  
  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await api.tasks.delete(taskId);
      if (error) {
        // Check if it's a permission error
        if (error.includes('permission') || error.includes('forbidden') || error.includes('403')) {
          notifications.show({
            title: 'Permission Denied',
            message: 'You can only delete tasks that you created. Contact an admin to delete this task.',
            color: 'orange',
            position: 'top-right',
          });
        } else {
          notifications.show({
            title: 'Delete Failed',
            message: `Failed to delete task: ${error}`,
            color: 'red',
            position: 'top-right',
          });
        }
        return;
      }
      
      // On success, update the local state and show success message
      setTasks(prev => prev.filter(task => task.id !== taskId));
      notifications.show({
        title: 'Task Deleted',
        message: 'Task has been successfully deleted.',
        color: 'green',
        position: 'top-right',
      });
    } catch (err) {
      console.error('Failed to delete task:', err);
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred while deleting the task.',
        color: 'red',
        position: 'top-right',
      });
    }
  };
  
  const handleMoveToTodo = async (taskId: string) => {
    try {
      const { error } = await api.tasks.updateStatus(taskId, 'todo');
      if (error) {
        // Check if it's a permission error
        if (error.includes('permission') || error.includes('forbidden') || error.includes('403')) {
          notifications.show({
            title: 'Permission Denied',
            message: 'You do not have permission to move this task.',
            color: 'orange',
            position: 'top-right',
          });
        } else {
          notifications.show({
            title: 'Move Failed',
            message: `Failed to move task: ${error}`,
            color: 'red',
            position: 'top-right',
          });
        }
        return;
      }
      
      // On success, update the local state and show success message
      setTasks(prev => prev.filter(task => task.id !== taskId));
      notifications.show({
        title: 'Task Moved',
        message: 'Task has been moved to Todo.',
        color: 'green',
        position: 'top-right',
      });
    } catch (err) {
      console.error('Failed to move task to todo:', err);
      notifications.show({
        title: 'Error',
        message: 'An unexpected error occurred while moving the task.',
        color: 'red',
        position: 'top-right',
      });
    }
  };
  
  const handleTaskSubmit = async (taskData: any) => {
    try {
      if (taskData.id) {
        // Update existing task
        const { data, error } = await api.tasks.update(taskData.id, taskData);
        if (error) {
          throw new Error(error);
        }
        
        if (data) {
          // Update local state
          setTasks(prev => 
            prev.map(task => task.id === taskData.id ? data : task)
          );
        }
      } else {
        // Create new task with backlog status
        const newTaskData = {
          ...taskData,
          status: 'backlog',
        };
        
        const { data, error } = await api.tasks.create(newTaskData);
        if (error) {
          throw new Error(error);
        }
        
        if (data) {
          // Add to local state
          setTasks(prev => [...prev, data]);
        }
      }
    } catch (err) {
      console.error('Failed to save task:', err);
      // Show error to user
    } finally {
      setTaskModalOpen(false);
    }
  };
  
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  return (
    <Container size="xl">
      <Group justify="space-between" align="center" mb="md">
        <Title>Backlog</Title>
      </Group>

      <Box mb="xl">
        <QuickAddTask 
          defaultStatus="backlog" 
          onTaskAdded={(task) => {
            if (task) {
              setTasks(prev => [...prev, task]);
            }
          }} 
        />
      </Box>

      <Paper withBorder p="md" mb="xl">
        {loading ? (
          <Stack align="center" p="xl">
            <Loader size="md" />
            <Text c="dimmed">Loading tasks...</Text>
          </Stack>
        ) : error ? (
          <Text c="red" p="md" ta="center">
            {error}
          </Text>
        ) : (
        <>
        <Group mb="md">
          <TextInput
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
            leftSection={<IconSearch size={16} />}
          />
          
          <Select
            placeholder="Filter by priority"
            value={priorityFilter}
            onChange={setPriorityFilter}
            data={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
            clearable
            leftSection={<IconFilter size={16} />}
          />
          
          <Menu position="bottom-end">
            <Menu.Target>
              <Button variant="outline" leftSection={
                sortDirection === 'asc'
                  ? <IconSortAscending size={16} />
                  : <IconSortDescending size={16} />
              }>
                Sort By
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                onClick={() => { setSortBy('title'); toggleSortDirection(); }}
                rightSection={sortBy === 'title' ? (
                  sortDirection === 'asc'
                    ? <IconSortAscending size={14} />
                    : <IconSortDescending size={14} />
                ) : null}
              >
                Title
              </Menu.Item>
              <Menu.Item
                onClick={() => { setSortBy('priority'); toggleSortDirection(); }}
                rightSection={sortBy === 'priority' ? (
                  sortDirection === 'asc'
                    ? <IconSortAscending size={14} />
                    : <IconSortDescending size={14} />
                ) : null}
              >
                Priority
              </Menu.Item>
              <Menu.Item
                onClick={() => { setSortBy('dueDate'); toggleSortDirection(); }}
                rightSection={sortBy === 'dueDate' ? (
                  sortDirection === 'asc'
                    ? <IconSortAscending size={14} />
                    : <IconSortDescending size={14} />
                ) : null}
              >
                Due Date
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
        
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Priority</Table.Th>
              <Table.Th>Due Date</Table.Th>
              <Table.Th>Tags</Table.Th>
              <Table.Th style={{ width: 100 }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredAndSortedTasks.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text ta="center" fz="sm" p="xl" c="dimmed">
                    No tasks found in the backlog.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              filteredAndSortedTasks.map(task => (
                <Table.Tr key={task.id}>
                  <Table.Td>
                    <Stack gap={5}>
                      <Group gap={8}>
                        <Badge size="xs" variant="filled" color="blue" style={{ borderRadius: '50%', minWidth: '18px' }}>
                          {task.taskNumber}
                        </Badge>
                        <Text fw={500}>{task.title}</Text>
                      </Group>
                      {task.description && (
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {task.description}
                        </Text>
                      )}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={priorityColorMap[task.priority]}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {task.dueDate 
                      ? new Date(task.dueDate).toLocaleDateString() 
                      : '—'}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={5}>
                      {task.tags?.map(tag => (
                        <Badge key={tag} size="xs" variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={5}>
                      <Menu position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="subtle">
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item 
                            leftSection={<IconPencil size={14} />}
                            onClick={() => handleEditTask(task)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item 
                            leftSection={<IconTrash size={14} />}
                            onClick={() => handleDeleteTask(task.id)}
                            color="red"
                          >
                            Delete
                          </Menu.Item>
                          <Menu.Item 
                            leftSection={<IconArrowRight size={14} />}
                            onClick={() => handleMoveToTodo(task.id)}
                          >
                            Move to Todo
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
        </>
        )}
      </Paper>
      
      <TaskModal
        opened={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        task={selectedTask}
        onSubmit={handleTaskSubmit}
      />
    </Container>
  );
}