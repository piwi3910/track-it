// @ts-nocheck - Temporarily disable type checking in this file
import { useState } from 'react';
// Using centralized theme system
import {
  Container,
  Title,
  Group,
  Paper,
  Text,
  Button,
  Stack,
  ScrollArea,
  Box,
  Badge
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
// Import drag and drop library
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import TaskModal from '@/components/TaskModal';
import TaskCard from '@/components/TaskCard';
import QuickAddTask from '@/components/QuickAddTask';
import type { Task, TaskStatus } from '@/types/task';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/hooks/useApp';

// Column definitions
const columns: { id: TaskStatus; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'blocked', title: 'Blocked' },
  { id: 'in_review', title: 'In Review' },
  { id: 'done', title: 'Done' }
];

export function KanbanPage() {
  const { colors } = useTheme();
  const { tasks, updateTask, createTask, deleteTask } = useApp();
  const [selectedColumn, setSelectedColumn] = useState<TaskStatus | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Group tasks by status
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  // State to track which column is being dragged over
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleAddTask = () => {
    setSelectedTask(null);
    setTaskModalOpen(true);
  };
  
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  // Handle opening conversation tab directly
  const handleViewConversation = (task: Task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
    // The conversation tab will be shown by setting a flag in TaskModal
    // We're passing the parameter through selectedTask
    (task as any).openConversation = true;
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };
  
  const handleTaskSubmit = async (taskData: any) => {
    if (taskData.id) {
      // Update existing task using AppContext
      updateTask(taskData.id, taskData);
    } else {
      // Create new task (AppContext will handle ID generation)
      await createTask(taskData);
    }
    setTaskModalOpen(false);
  };
  
  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    // Reset drag over column state
    setDragOverColumn(null);

    // Dropped outside a valid drop area
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    // Find the task that was dragged
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Update the task status using AppContext
    updateTask(draggableId, {
      status: destination.droppableId as TaskStatus
    });

    // Track which column we last dragged to
    setSelectedColumn(destination.droppableId as TaskStatus);
  };
  
  return (
    <Container size="xl" fluid className="kanban-board">
      <Group justify="space-between" align="center" mb="md">
        <Title>Kanban Board</Title>
      </Group>

      <Box mb="xl">
        <QuickAddTask
          defaultStatus={selectedColumn || 'todo'}
          onTaskAdded={() => console.log('Task added from quick add')}
        />
      </Box>

      <DragDropContext
        onDragEnd={handleDragEnd}
        onDragStart={() => document.body.style.cursor = 'grabbing'}>
        <Group align="flex-start" grow>
          {columns.map(column => {
            const columnTasks = getTasksByStatus(column.id);
            const columnColor = column.id === 'blocked' ? 'red' :
                               column.id === 'in_progress' ? 'blue' :
                               column.id === 'done' ? 'green' : 'gray';

            return (
              <Paper
                key={column.id}
                p="6px" /* Reduced padding to maximize usable space */
                radius="md"
                style={{
                  backgroundColor: colors.cardBackground,
                  height: 'calc(100vh - 160px)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                withBorder
              >
                <Group
                  justify="space-between"
                  className={`column-header column-header-${column.id}`}
                  bg={colors.cardBackground}
                >
                  <Group gap={8}>
                    <Text fw={700}>{column.title}</Text>
                    <Badge color={columnColor} className="column-task-count">
                      {columnTasks.length}
                    </Badge>
                  </Group>
                </Group>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <ScrollArea
                      className={`kanban-column-scroll ${snapshot.isDraggingOver ? 'kanban-column-highlight' : ''}`}
                      style={{ height: '100%' }}
                      {...provided.droppableProps}
                      viewportRef={provided.innerRef}
                      onDragEnter={() => setDragOverColumn(column.id)}
                      onDragLeave={() => setDragOverColumn(null)}
                    >
                      <Stack gap="xs" p="4px 2px">
                        {columnTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="compact-card"
                              >
                                <TaskCard
                                  task={task}
                                  onEdit={() => handleEditTask(task)}
                                  onDelete={() => handleDeleteTask(task.id)}
                                  onViewConversation={() => handleViewConversation(task)}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Stack>
                    </ScrollArea>
                  )}
                </Droppable>
              </Paper>
            );
          })}
        </Group>
      </DragDropContext>
      
      <TaskModal
        opened={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        task={selectedTask}
        onSubmit={handleTaskSubmit}
      />
    </Container>
  );
}