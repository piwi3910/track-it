import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { Progress } from '@/components/ui/progress';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskSubtasksTabProps {
  subtasks: Subtask[];
  onChange: (subtasks: Subtask[]) => void;
}

export function TaskSubtasksTab({ subtasks, onChange }: TaskSubtasksTabProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const addSubtask = () => {
    if (newSubtaskTitle.trim()) {
      const newSubtask: Subtask = {
        id: `subtask-${Date.now()}`,
        title: newSubtaskTitle.trim(),
        completed: false
      };
      onChange([...subtasks, newSubtask]);
      setNewSubtaskTitle('');
    }
  };

  const toggleSubtask = (id: string) => {
    onChange(
      subtasks.map(subtask =>
        subtask.id === id
          ? { ...subtask, completed: !subtask.completed }
          : subtask
      )
    );
  };

  const deleteSubtask = (id: string) => {
    onChange(subtasks.filter(subtask => subtask.id !== id));
  };

  const completedCount = subtasks.filter(s => s.completed).length;
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  return (
    <div className="space-y-4">
      {subtasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{completedCount} of {subtasks.length} completed</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <Card key={subtask.id}>
            <CardContent className="flex items-center gap-3 p-3">
              <Checkbox
                checked={subtask.completed}
                onCheckedChange={() => toggleSubtask(subtask.id)}
              />
              <span
                className={`flex-1 ${
                  subtask.completed ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {subtask.title}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteSubtask(subtask.id)}
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add a subtask..."
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSubtask();
            }
          }}
        />
        <Button onClick={addSubtask} size="icon">
          <IconPlus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}