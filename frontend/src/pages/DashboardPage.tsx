import { useState } from 'react';
import {
  IconListCheck,
  IconCheckbox,
  IconClockHour4,
  IconCalendarEvent
} from '@tabler/icons-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TaskModal from '@/components/TaskModal';
import QuickAddTask from '@/components/QuickAddTask';
import type { Task } from '@/types/task';
import { useApp } from '@/hooks/useApp';

export function DashboardPage() {
  const { tasks: appTasks, currentUser, updateTask, createTask } = useApp();
  
  // Cast tasks to our frontend Task type which includes taskNumber
  const tasks = appTasks as unknown as Task[];
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Filter tasks for current user
  const myTasks = tasks.filter(task => task.assigneeId === currentUser?.id);

  // Task counts for stats
  const totalMyTasks = myTasks.length;
  const myCompletedTasks = myTasks.filter(task => task.status === 'DONE').length;
  const myInProgressTasks = myTasks.filter(task => task.status === 'IN_PROGRESS').length;
  const myTodoTasks = myTasks.filter(task => task.status === 'TODO').length;

  // Completion percentage (based on my tasks only)
  const completionPercentage = totalMyTasks > 0
    ? Math.round((myCompletedTasks / totalMyTasks) * 100)
    : 0;


  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const handleTaskSubmit = async (task: Partial<Task>) => {
    console.log('DashboardPage handleTaskSubmit called with:', task);
    try {
      if (task.id) {
        // Update existing task
        // Extract id and pass the rest as data
        const { id, ...data } = task;
        console.log('Updating task with ID:', id);
        // @ts-expect-error - Type conversion between shared types
        await updateTask(id, data);
      } else {
        // Create new task
        console.log('Creating new task');
        // @ts-expect-error - Type conversion between shared types
        await createTask(task as unknown as Omit<Task, 'id'>);
      }
      setTaskModalOpen(false);
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="mb-8">
        <QuickAddTask onTaskAdded={() => console.log('Task added from quick add')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
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
          color="orange"
        />

        <StatCard
          title="Completion"
          value={`${completionPercentage}%`}
          icon={<IconCheckbox />}
          color="green"
          showProgress
          progress={completionPercentage}
        />
      </div>

      <div className="space-y-8 mt-8">
        {/* My In Progress Tasks */}
        {myInProgressTasks > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">My In Progress Tasks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myTasks
                .filter(task => task.status === 'IN_PROGRESS')
                .map(task => (
                  <Card
                    key={task.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleEditTask(task)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base line-clamp-2">{task.title}</CardTitle>
                        <Badge 
                          variant={
                            task.priority === 'URGENT' ? 'destructive' :
                            task.priority === 'HIGH' ? 'destructive' :
                            'default'
                          }
                          className={
                            task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            task.priority === 'LOW' ? 'bg-blue-100 text-blue-800' : ''
                          }
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        )}

        {/* My To Do Tasks */}
        {myTodoTasks > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">My To Do Tasks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myTasks
                .filter(task => task.status === 'TODO')
                .slice(0, 4)
                .map(task => (
                  <Card
                    key={task.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleEditTask(task)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base line-clamp-2">{task.title}</CardTitle>
                        <Badge 
                          variant={
                            task.priority === 'URGENT' ? 'destructive' :
                            task.priority === 'HIGH' ? 'destructive' :
                            'default'
                          }
                          className={
                            task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            task.priority === 'LOW' ? 'bg-blue-100 text-blue-800' : ''
                          }
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        )}

        {/* Recently Completed Tasks */}
        {myCompletedTasks > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Recently Completed</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myTasks
                .filter(task => task.status === 'DONE')
                .slice(0, 4)
                .map(task => (
                  <Card
                    key={task.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow opacity-75"
                    onClick={() => handleEditTask(task)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base line-clamp-2 line-through">{task.title}</CardTitle>
                        <Badge variant="secondary">DONE</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        )}
      </div>

      <TaskModal
        opened={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        task={selectedTask}
        onSubmit={handleTaskSubmit}
      />
    </div>
  );
}

// Helper component for stat cards
function StatCard({ 
  title, 
  value, 
  icon, 
  color, 
  showProgress = false, 
  progress = 0 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  color: string;
  showProgress?: boolean;
  progress?: number;
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200',
    yellow: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200',
    orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200',
    green: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200',
  }[color] || 'text-gray-600 bg-gray-100';

  const textColorClass = {
    blue: 'text-blue-600 dark:text-blue-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    orange: 'text-orange-600 dark:text-orange-400',
    green: 'text-green-600 dark:text-green-400',
  }[color] || 'text-gray-600';

  return (
    <Card className="h-44 relative">
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded flex items-center justify-center ${colorClasses}`}>
            {icon}
          </div>
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          {showProgress ? (
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
                  className={textColorClass}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${textColorClass}`}>{value}</span>
              </div>
            </div>
          ) : (
            <span className={`text-5xl font-bold ${textColorClass}`}>{value}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}