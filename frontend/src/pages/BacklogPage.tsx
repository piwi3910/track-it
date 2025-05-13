import { useState } from 'react';
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
} from '@mantine/core';
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

// Mock data for demonstration
const mockTasks = [
  { 
    id: '1', 
    title: 'Implement dashboard', 
    description: 'Create the dashboard view with stats', 
    status: 'backlog', 
    priority: 'high', 
    tags: ['frontend'],
    dueDate: '2023-07-15'
  },
  { 
    id: '2', 
    title: 'Create task form', 
    description: 'Implement form for creating new tasks', 
    status: 'backlog', 
    priority: 'medium', 
    tags: ['frontend', 'forms'],
    dueDate: '2023-07-10'
  },
  { 
    id: '3', 
    title: 'Design UI components', 
    description: 'Create reusable UI components', 
    status: 'backlog', 
    priority: 'low', 
    tags: ['design', 'ui'],
    dueDate: '2023-07-20'
  },
  { 
    id: '4', 
    title: 'Connect to API', 
    description: 'Set up API integration', 
    status: 'backlog', 
    priority: 'urgent', 
    tags: ['backend'],
    dueDate: '2023-07-05'
  },
];

// Map priority to color
const priorityColorMap: Record<TaskPriority, string> = {
  low: 'blue',
  medium: 'yellow',
  high: 'orange',
  urgent: 'red',
};

export function BacklogPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks as Task[]);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Filter and sort tasks
  const filteredAndSortedTasks = tasks
    .filter(task => 
      task.status === 'backlog' &&
      (searchQuery === '' || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
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
  
  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };
  
  const handleMoveToTodo = (taskId: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, status: 'todo' } : task
      )
    );
  };
  
  const handleTaskSubmit = (taskData: any) => {
    if (taskData.id) {
      // Update existing task
      setTasks(prev => 
        prev.map(task => task.id === taskData.id ? { ...task, ...taskData } : task)
      );
    } else {
      // Create new task
      const newTask = {
        ...taskData,
        id: `task-${Date.now()}`, // Generate a unique ID
        status: 'backlog', // Force the status to be backlog
      };
      setTasks(prev => [...prev, newTask]);
    }
    setTaskModalOpen(false);
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
        <QuickAddTask defaultStatus="backlog" onTaskAdded={() => console.log('Task added from quick add')} />
      </Box>

      <Paper withBorder p="md" mb="xl">
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
                      <Text fw={500}>{task.title}</Text>
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