import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/hooks/useApp';
import type { Task, TaskPriority } from '@track-it/shared/types';

interface UseTaskStateProps {
  task: Task;
}

/**
 * Custom hook for managing local task state and updates
 * Handles title changes, priority changes, time tracking, and subtask management
 */
export function useTaskState({ task }: UseTaskStateProps) {
  const { updateTask } = useApp();
  const [localTask, setLocalTask] = useState<Task>(task);
  const [titleChanged, setTitleChanged] = useState(false);

  // Update local task when prop changes
  useEffect(() => {
    setLocalTask(task);
  }, [task]);

  // Handle title change
  const handleTitleChange = useCallback((title: string) => {
    setLocalTask(prev => ({ ...prev, title }));
    setTitleChanged(true);
  }, []);

  // Handle save title changes
  const handleSaveTitleChanges = useCallback(() => {
    if (titleChanged) {
      updateTask(localTask.id, { title: localTask.title });
      setTitleChanged(false);
    }
  }, [titleChanged, localTask.id, localTask.title, updateTask]);

  // Handle priority change
  const handlePriorityChange = useCallback((priority: string) => {
    const taskPriority = priority as TaskPriority;
    setLocalTask(prev => ({ ...prev, priority: taskPriority }));
    updateTask(localTask.id, { priority: taskPriority });
  }, [localTask.id, updateTask]);

  // Handle time change
  const handleTimeChange = useCallback((field: 'estimatedHours' | 'actualHours', value: number) => {
    setLocalTask(prev => ({ ...prev, [field]: value }));
    updateTask(localTask.id, { [field]: value });
  }, [localTask.id, updateTask]);

  // Handle assignee change
  const handleAssigneeChange = useCallback((assigneeId: string | null) => {
    setLocalTask(prev => ({ ...prev, assigneeId }));
    updateTask(localTask.id, { assigneeId });
  }, [localTask.id, updateTask]);

  // Handle subtask toggle
  const handleSubtaskToggle = useCallback((subtaskId: string, completed: boolean) => {
    const updatedSubtasks = localTask.subtasks?.map(st =>
      st.id === subtaskId ? { ...st, completed } : st
    );

    setLocalTask(prev => ({ ...prev, subtasks: updatedSubtasks }));
    // @ts-expect-error - Subtask structure mismatch
    updateTask(localTask.id, { subtasks: updatedSubtasks });
  }, [localTask.id, localTask.subtasks, updateTask]);

  // Add new subtask
  const handleAddSubtask = useCallback((onEdit?: () => void) => {
    const updatedSubtasks = [
      ...(localTask.subtasks || []),
      { id: `subtask-${Date.now()}`, title: '', completed: false }
    ];

    updateTask(localTask.id, { subtasks: updatedSubtasks as Task[] });
    setLocalTask(prev => ({ ...prev, subtasks: updatedSubtasks }));

    // Open the edit modal if provided
    if (onEdit) {
      onEdit();
    }
  }, [localTask.id, localTask.subtasks, updateTask]);

  // Calculate subtask progress
  const subtaskCount = localTask.subtasks?.length || 0;
  const completedSubtasks = localTask.subtasks?.filter(subtask => 'completed' in subtask && subtask.completed).length || 0;
  const subtaskProgress = subtaskCount > 0 ? (completedSubtasks / subtaskCount) * 100 : 0;

  return {
    localTask,
    titleChanged,
    handleTitleChange,
    handleSaveTitleChanges,
    handlePriorityChange,
    handleTimeChange,
    handleAssigneeChange,
    handleSubtaskToggle,
    handleAddSubtask,
    subtaskCount,
    completedSubtasks,
    subtaskProgress
  };
}