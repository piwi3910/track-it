import { useState } from 'react';
// Using centralized theme system
import {
  Container,
  Title,
  Group,
  Card,
  Text,
  SimpleGrid,
  Stack,
  RingProgress,
  Button,
  ThemeIcon,
  Box,
  Badge,
  rem
} from '@mantine/core';
import {
  IconPlus,
  IconListCheck,
  IconCheckbox,
  IconClockHour4,
  IconCalendarEvent
} from '@tabler/icons-react';
import TaskModal from '@/components/TaskModal';
import QuickAddTask from '@/components/QuickAddTask';
import type { Task } from '@/types/task';
import { useApp } from '@/hooks/useApp';

export function DashboardPage() {
  const { tasks, currentUser } = useApp();
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Filter tasks for current user
  const myTasks = tasks.filter(task => task.assigneeId === currentUser?.id);

  // Task counts for stats
  const totalMyTasks = myTasks.length;
  const myCompletedTasks = myTasks.filter(task => task.status === 'done').length;
  const myInProgressTasks = myTasks.filter(task => task.status === 'in_progress').length;
  const myTodoTasks = myTasks.filter(task => task.status === 'todo').length;

  // Completion percentage (based on my tasks only)
  const completionPercentage = totalMyTasks > 0
    ? Math.round((myCompletedTasks / totalMyTasks) * 100)
    : 0;

  const handleAddTask = () => {
    setSelectedTask(null);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const handleTaskSubmit = (task: Partial<Task>) => {
    // In a real app, this would create/update the task
    console.log('Task submitted:', task);
    setTaskModalOpen(false);
  };

  return (
    <Container size="xl">
      <Group justify="space-between" align="center" mb="md">
        <Title>Dashboard</Title>
      </Group>

      <Box mb="xl">
        <QuickAddTask onTaskAdded={() => console.log('Task added from quick add')} />
      </Box>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
        <StatCard
          title="My Tasks"
          value={totalMyTasks.toString()}
          icon={<IconListCheck />}
          color="blue"
        />

        <StatCard
          title="My In Progress"
          value={myInProgressTasks.toString()}
          icon={<IconClockHour4 />}
          color="yellow"
        />

        <StatCard
          title="My To Do"
          value={myTodoTasks.toString()}
          icon={<IconCalendarEvent />}
          color="grape"
        />

        <Card p="xs" radius="md" withBorder h={180} pos="relative" className="dashboard-stat-card dashboard-completion-card">
          <Group gap="xs" position="center" mb={5}>
            <ThemeIcon size="sm" radius="sm" variant="light" color="green">
              <IconCheckbox style={{ width: rem(14), height: rem(14) }} />
            </ThemeIcon>
            <Text fw={700} size="sm">My Completion</Text>
          </Group>
          <div style={{ position: 'relative', height: '80%', width: '100%' }}>
            <RingProgress
              size={120}
              thickness={12}
              roundCaps
              sections={[{ value: completionPercentage, color: 'green' }]}
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            />
            <Text
              className="stat-card-value"
              c="green"
            >
              {completionPercentage}%
            </Text>
          </div>
        </Card>
      </SimpleGrid>

      {/* My Tasks Section */}
      <Stack mt="xl">
        <Title order={3}>My Tasks</Title>
        {myTasks.length === 0 ? (
          <Card p="md" radius="md" withBorder>
            <Text ta="center" c="dimmed">You don't have any assigned tasks yet.</Text>
          </Card>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            {myTasks.map(task => (
              <Card
                key={task.id}
                p="md"
                radius="md"
                withBorder
                className="hover-card"
                onClick={() => handleEditTask(task)}
              >
                <Group justify="space-between" mb="xs">
                  <Text fw={500}>{task.title}</Text>
                  <Badge color={
                    task.status === 'in_progress' ? 'yellow' :
                    task.status === 'done' ? 'green' : 'blue'
                  }>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </Group>
                {task.dueDate && (
                  <Text size="sm" c="dimmed">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </Text>
                )}
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>

      {/* My In Progress Tasks */}
      <Stack mt="xl">
        <Title order={3}>My In Progress Tasks</Title>
        {myInProgressTasks <= 0 ? (
          <Card p="md" radius="md" withBorder>
            <Text ta="center" c="dimmed">You don't have any tasks in progress.</Text>
          </Card>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            {myTasks
              .filter(task => task.status === 'in_progress')
              .map(task => (
                <Card
                  key={task.id}
                  p="md"
                  radius="md"
                  withBorder
                  className="hover-card"
                  onClick={() => handleEditTask(task)}
                >
                  <Text fw={500}>{task.title}</Text>
                  {task.dueDate && (
                    <Text size="sm" c="dimmed" mt="xs">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </Text>
                  )}
                </Card>
              ))}
          </SimpleGrid>
        )}
      </Stack>

      {/* My Todo Tasks */}
      <Stack mt="xl">
        <Title order={3}>My Todo Tasks</Title>
        {myTodoTasks <= 0 ? (
          <Card p="md" radius="md" withBorder>
            <Text ta="center" c="dimmed">You don't have any tasks in your todo list.</Text>
          </Card>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            {myTasks
              .filter(task => task.status === 'todo')
              .map(task => (
                <Card
                  key={task.id}
                  p="md"
                  radius="md"
                  withBorder
                  className="hover-card"
                  onClick={() => handleEditTask(task)}
                >
                  <Text fw={500}>{task.title}</Text>
                  {task.dueDate && (
                    <Text size="sm" c="dimmed" mt="xs">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </Text>
                  )}
                </Card>
              ))}
          </SimpleGrid>
        )}
      </Stack>

      <TaskModal
        opened={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        task={selectedTask}
        onSubmit={handleTaskSubmit}
      />
    </Container>
  );
}

// Helper component for stat cards
function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <Card p="xs" radius="md" withBorder h={180} pos="relative" className="dashboard-stat-card">
      <Group gap="xs" position="center" mb={5}>
        <ThemeIcon size="sm" radius="sm" variant="light" color={color}>
          {icon}
        </ThemeIcon>
        <Text fw={700} size="sm">{title}</Text>
      </Group>
      <Text className="stat-card-value" c={color}>
        {value}
      </Text>
    </Card>
  );
}