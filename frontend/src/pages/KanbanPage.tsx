import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TaskModal from '@/components/TaskModal';
import TaskCard from '@/components/TaskCard';
import QuickAddTask from '@/components/QuickAddTask';
import type { Task, TaskStatus } from '@/types/task';
import { useApp } from '@/hooks/useApp';

// Column definitions
const columns: { id: TaskStatus; title: string }[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'review', title: 'In Review' },
  { id: 'done', title: 'Done' }
];

// Status mapping no longer needed - using lowercase everywhere

export function KanbanPage() {
  const { tasks: appTasks, updateTask, createTask, deleteTask } = useApp();
  
  // Cast tasks to our frontend Task type which includes taskNumber
  const tasks = appTasks as unknown as Task[];
  const [selectedColumn, setSelectedColumn] = useState<TaskStatus | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Group tasks by status
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  // State to track which column is being dragged over
  const [, setDragOverColumn] = useState<string | null>(null);

  
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
    (task as Task & { openConversation?: boolean }).openConversation = true;
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };
  
  const handleTaskSubmit = async (taskData: Partial<Task>) => {
    try {
      if (taskData.id) {
        // Update existing task using AppContext
        // Extract id and pass the rest as data
        const { id, ...data } = taskData;
        // @ts-expect-error - Type conversion between shared types
        await updateTask(id, data);
      } else {
        // Create new task (AppContext will handle ID generation)
        // @ts-expect-error - Type conversion between shared types
        await createTask(taskData as unknown as Omit<Task, 'id'>);
      }
      setTaskModalOpen(false);
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };
  
  const handleDragEnd = (result: { destination?: { droppableId: string; index: number }; source: { droppableId: string; index: number }; draggableId: string }) => {
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
      // @ts-expect-error - Type conversion between shared types
      status: destination.droppableId as TaskStatus
    });

    // Track which column we last dragged to
    setSelectedColumn(destination.droppableId as TaskStatus);
  };
  
  return (
    <div className="kanban-board">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kanban Board</h1>
      </div>

      <div className="mb-8">
        <QuickAddTask
          defaultStatus={selectedColumn || 'todo'}
          onTaskAdded={() => {
            // Task will be automatically added to the store
          }}
        />
      </div>

      <DragDropContext
        onDragEnd={handleDragEnd}
        onDragStart={() => document.body.style.cursor = 'grabbing'}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {columns.map(column => {
            const columnTasks = getTasksByStatus(column.id);
            const columnColor = column.id === 'review' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                               column.id === 'done' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                               'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';

            return (
              <Card
                key={column.id}
                className="h-[calc(100vh-12rem)] flex flex-col p-3"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{column.title}</h3>
                    <Badge className={`text-xs ${columnColor}`}>
                      {columnTasks.length}
                    </Badge>
                  </div>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      className={`flex-1 overflow-y-auto px-1 ${
                        snapshot.isDraggingOver ? 'bg-accent/50 rounded-md transition-colors' : ''
                      }`}
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      onDragEnter={() => setDragOverColumn(column.id)}
                      onDragLeave={() => setDragOverColumn(null)}
                    >
                      <div className="space-y-2 pb-2">
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
                      </div>
                    </div>
                  )}
                </Droppable>
              </Card>
            );
          })}
        </div>
      </DragDropContext>
      
      <TaskModal
        opened={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        task={selectedTask}
        onSubmit={handleTaskSubmit}
      />
    </div>
  );
}