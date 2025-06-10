import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IconCalendar } from '@tabler/icons-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus, TaskPriority, User } from '@track-it/shared/types';

interface TaskDetailsTabProps {
  task: Partial<Task>;
  users: User[];
  onChange: (updates: Partial<Task>) => void;
}

export function TaskDetailsTab({ task, users, onChange }: TaskDetailsTabProps) {
  const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
  const statuses: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done', 'archived'];

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={task.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Task title"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={task.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Task description"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={task.priority || 'medium'}
            onValueChange={(value) => onChange({ priority: value as TaskPriority })}
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={task.status || 'todo'}
            onValueChange={(value) => onChange({ status: value as TaskStatus })}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="assignee">Assignee</Label>
          <Select
            value={task.assigneeId || ''}
            onValueChange={(value) => onChange({ assigneeId: value })}
          >
            <SelectTrigger id="assignee">
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="dueDate">Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="dueDate"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !task.dueDate && "text-muted-foreground"
                )}
              >
                <IconCalendar className="mr-2 h-4 w-4" />
                {task.dueDate ? format(new Date(task.dueDate), 'PPP') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={task.dueDate ? new Date(task.dueDate) : undefined}
                onSelect={(date) => onChange({ dueDate: date?.toISOString() || null })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}