import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/hooks/useApp';
import type { Task } from '@track-it/shared/types';

interface UseTaskTimeTrackingProps {
  task: Task;
}

/**
 * Custom hook for managing task time tracking functionality
 * Handles start/stop tracking, time calculations, and interval management
 */
export function useTaskTimeTracking({ task }: UseTaskTimeTrackingProps) {
  const { updateTask } = useApp();
  const [isTimeTrackingActive, setIsTimeTrackingActive] = useState(!!task.timeTrackingActive);
  const [trackingTime, setTrackingTime] = useState(task.trackingTimeSeconds || 0);
  const [trackingInterval, setTrackingInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Update tracking status when task changes
  useEffect(() => {
    setIsTimeTrackingActive(!!task.timeTrackingActive);
    setTrackingTime(task.trackingTimeSeconds || 0);
    
    // If task is actively being tracked, restart the timer
    if (task.timeTrackingActive && !trackingInterval) {
      const interval = setInterval(() => {
        setTrackingTime(prev => {
          // Save updated tracking time to task every 5 seconds
          if ((prev + 1) % 5 === 0) {
            updateTask(task.id, { 
              trackingTimeSeconds: prev + 1,
              timeTrackingActive: true
            });
          }
          return prev + 1;
        });
      }, 1000);
      
      setTrackingInterval(interval);
    }
  }, [task, trackingInterval, updateTask]);

  // Format tracking time for display (HH:MM:SS)
  const formatTrackingTime = useCallback((timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }, []);

  // Handle starting and stopping time tracking
  const handleToggleTimeTracking = useCallback(() => {
    if (isTimeTrackingActive) {
      // Stop tracking
      if (trackingInterval) {
        clearInterval(trackingInterval);
        setTrackingInterval(null);
      }

      // Convert tracking time to hours and add to actual hours
      const trackingHours = parseFloat((trackingTime / 3600).toFixed(1));
      const currentHours = task.actualHours || 0;
      const totalHours = parseFloat((currentHours + trackingHours).toFixed(1));

      // Update task with new actual hours and reset tracking status
      updateTask(task.id, { 
        actualHours: totalHours,
        timeTrackingActive: false,
        trackingTimeSeconds: 0
      });

      // Reset tracking time
      setTrackingTime(0);
    } else {
      // Start tracking
      const interval = setInterval(() => {
        setTrackingTime(prev => {
          // Save updated tracking time to task every 5 seconds
          if ((prev + 1) % 5 === 0) {
            updateTask(task.id, { 
              trackingTimeSeconds: prev + 1,
              timeTrackingActive: true
            });
          }
          return prev + 1;
        });
      }, 1000);

      // Update task immediately to mark it as being tracked
      updateTask(task.id, { 
        timeTrackingActive: true,
        trackingTimeSeconds: trackingTime
      });

      setTrackingInterval(interval);
    }

    setIsTimeTrackingActive(!isTimeTrackingActive);
  }, [isTimeTrackingActive, trackingInterval, trackingTime, task.id, task.actualHours, updateTask]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval);

        // If time tracking is active, save the current tracking time before unmounting
        if (isTimeTrackingActive) {
          updateTask(task.id, {
            trackingTimeSeconds: trackingTime,
            timeTrackingActive: true
          });
        }
      }
    };
  }, [trackingInterval, isTimeTrackingActive, trackingTime, task.id, updateTask]);

  return {
    isTimeTrackingActive,
    trackingTime,
    formatTrackingTime,
    handleToggleTimeTracking
  };
}