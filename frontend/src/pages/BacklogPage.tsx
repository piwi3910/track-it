import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { notifications } from '@/components/ui/notifications';
import {
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
import type { Task } from '@/types/task';
import { useApp } from '@/hooks/useApp';
import { PRIORITY_ORDER } from '@track-it/shared';


export function BacklogPage() {
  const { tasks, updateTask, createTask, deleteTask } = useApp();
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Load tasks from API
  // Filter tasks to only show backlog tasks
  const backlogTasks = tasks.filter(task => task.status === 'backlog');
  
  // Filter and sort tasks
  const filteredAndSortedTasks = backlogTasks
    .filter(task => 
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
        return sortDirection === 'asc'
          ? (PRIORITY_ORDER[a.priority] || 0) - (PRIORITY_ORDER[b.priority] || 0)
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
  
  
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };
  
  const handleDeleteTask = async (taskId: string) => {
    try {
      const success = await deleteTask(taskId);
      if (!success) {
        // Check if it's a permission error
        if (error.includes('permission') || error.includes('forbidden') || error.includes('403')) {
          notifications.show({
            title: 'Permission Denied',
            message: 'You can only delete tasks that you created. Contact an admin to delete this task.',
            color: 'orange',
            });
        } else {
          notifications.show({
            title: 'Delete Failed',
            message: `Failed to delete task: ${error}`,
            color: 'red',
            });
        }
        return;
      }
      
      // On success, show success message
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
      const result = await updateTask(taskId, { status: 'todo' });
      if (!result) {
        notifications.show({
          title: 'Move Failed',
          message: 'Failed to move task. You may not have permission.',
          color: 'red',
        });
        return;
      }
      
      // On success, show success message
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
  
  const handleTaskSubmit = async (taskData: Partial<Task> & { id?: string }) => {
    try {
      if (taskData.id) {
        // Update existing task
        // Extract id and pass the rest as data
        const { id, ...data } = taskData;
        // @ts-expect-error - Type conversion between shared types
        await updateTask(id, data);
      } else {
        // Create new task with backlog status
        const newTaskData = {
          ...taskData,
          status: 'backlog' as const,
        };
        // @ts-expect-error - Type conversion between shared types
        await createTask(newTaskData as unknown as Omit<Task, 'id'>);
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
    <div className="container max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Backlog</h1>
      </div>

      <div className="mb-8">
        <QuickAddTask 
          defaultStatus="backlog" 
          onTaskAdded={() => {
            // Task will be automatically added to the store
          }} 
        />
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
        {loading ? (
          <div className="flex flex-col items-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-muted-foreground mt-2">Loading tasks...</p>
          </div>
        ) : error ? (
          <p className="text-red-600 text-center p-4">
            {error}
          </p>
        ) : (
        <>
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={priorityFilter || undefined} onValueChange={(value) => setPriorityFilter(value || null)}>
            <SelectTrigger className="w-48">
              <div className="flex items-center gap-2">
                <IconFilter size={16} />
                <SelectValue placeholder="Filter by priority" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {sortDirection === 'asc' ? <IconSortAscending size={16} className="mr-2 h-4 w-4" /> : <IconSortDescending size={16} className="mr-2 h-4 w-4" />}
                Sort By
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => { setSortBy('title'); toggleSortDirection(); }}
              >
                Title
                {sortBy === 'title' && (
                  sortDirection === 'asc'
                    ? <IconSortAscending size={14} className="ml-auto h-4 w-4" />
                    : <IconSortDescending size={14} className="ml-auto h-4 w-4" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setSortBy('priority'); toggleSortDirection(); }}
              >
                Priority
                {sortBy === 'priority' && (
                  sortDirection === 'asc'
                    ? <IconSortAscending size={14} className="ml-auto h-4 w-4" />
                    : <IconSortDescending size={14} className="ml-auto h-4 w-4" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { setSortBy('dueDate'); toggleSortDirection(); }}
              >
                Due Date
                {sortBy === 'dueDate' && (
                  sortDirection === 'asc'
                    ? <IconSortAscending size={14} className="ml-auto h-4 w-4" />
                    : <IconSortDescending size={14} className="ml-auto h-4 w-4" />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <p className="text-center text-sm py-8 text-muted-foreground">
                      No tasks found in the backlog.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedTasks.map(task => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{task.title}</p>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={task.priority === 'LOW' ? 'secondary' :
                               task.priority === 'HIGH' || task.priority === 'URGENT' ? 'destructive' : 'default'}
                        className={task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : ''}
                      >
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.dueDate 
                        ? new Date(task.dueDate).toLocaleDateString() 
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {task.tags?.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <IconDotsVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleEditTask(task as unknown as Task)}
                          >
                            <IconPencil size={14} className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <IconTrash size={14} className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleMoveToTodo(task.id)}
                          >
                            <IconArrowRight size={14} className="mr-2 h-4 w-4" />
                            Move to Todo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        </>
        )}
        </CardContent>
      </Card>
      
      <TaskModal
        opened={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        task={selectedTask}
        onSubmit={handleTaskSubmit}
      />
    </div>
  );
}