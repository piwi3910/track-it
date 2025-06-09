import { useState, useEffect } from 'react';
import { api } from '@/api';

interface UseCommentCountProps {
  taskId: string;
}

/**
 * Custom hook for fetching and managing comment count for a task
 * Handles loading state and error handling
 */
export function useCommentCount({ taskId }: UseCommentCountProps) {
  const [commentCount, setCommentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommentCount = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await api.comments.getCountByTaskId(taskId);
        if (typeof result === 'number') {
          setCommentCount(result);
        }
      } catch (error) {
        console.error('Failed to fetch comment count:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch comment count');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommentCount();
  }, [taskId]);

  return {
    commentCount,
    isLoading,
    error
  };
}