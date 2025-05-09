// This file defines a mock API client that resembles trpc structure
// but uses mock data. Later, this can be replaced with a real trpc client.

import {
  Task,
  User,
  Comment,
  TaskStatus,
  TaskPriority,
  Attachment,
  TaskTemplate
} from '@/types/task';
import { mockTasks, mockUsers, mockComments, mockAttachments, mockTemplates } from './mockData';

/**
 * Mock implementation of a trpc-like client.
 * Each "procedure" returns a function that simulates an API call.
 */
export const api = {
  tasks: {
    getAll: async (): Promise<Task[]> => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return [...mockTasks];
    },

    getById: async (id: string): Promise<Task | null> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockTasks.find(task => task.id === id) || null;
    },

    getByStatus: async (status: TaskStatus): Promise<Task[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockTasks.filter(task => task.status === status);
    },

    create: async (taskData: Omit<Task, 'id'>): Promise<Task> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newTask: Task = {
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...taskData
      };
      mockTasks.push(newTask);
      return newTask;
    },

    createFromTemplate: async (templateId: string, taskData: Partial<Task>): Promise<Task> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      // Find the template
      const template = mockTemplates.find(t => t.id === templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Increment usage count
      const templateIndex = mockTemplates.findIndex(t => t.id === templateId);
      if (templateIndex !== -1) {
        mockTemplates[templateIndex] = {
          ...mockTemplates[templateIndex],
          usageCount: (mockTemplates[templateIndex].usageCount || 0) + 1
        };
      }

      // Create a new task based on the template and provided data
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: taskData.title || template.name,
        description: taskData.description || template.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || template.priority,
        tags: taskData.tags || template.tags || [],
        dueDate: taskData.dueDate || null,
        createdAt: new Date().toISOString(),
        estimatedHours: taskData.estimatedHours || template.estimatedHours,
        subtasks: template.subtasks ? [...template.subtasks] : [],
        assigneeId: taskData.assigneeId || null,
        ...taskData // Override with any additional task data
      };

      mockTasks.push(newTask);
      return newTask;
    },

    update: async (id: string, taskData: Partial<Task>): Promise<Task> => {
      await new Promise(resolve => setTimeout(resolve, 400));
      const taskIndex = mockTasks.findIndex(task => task.id === id);
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      const updatedTask = {
        ...mockTasks[taskIndex],
        ...taskData,
        updatedAt: new Date().toISOString()
      };

      mockTasks[taskIndex] = updatedTask;
      return updatedTask;
    },

    delete: async (id: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 400));
      const taskIndex = mockTasks.findIndex(task => task.id === id);
      if (taskIndex !== -1) {
        mockTasks.splice(taskIndex, 1);
      }
    },

    search: async (query: string): Promise<Task[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const lowercaseQuery = query.toLowerCase();
      return mockTasks.filter(
        task =>
          task.title.toLowerCase().includes(lowercaseQuery) ||
          (task.description?.toLowerCase() || '').includes(lowercaseQuery) ||
          (task.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) || false)
      );
    },

    saveAsTemplate: async (taskId: string, templateName: string, isPublic: boolean = true): Promise<TaskTemplate> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const task = mockTasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Create a new template from the task
      const newTemplate: TaskTemplate = {
        id: `template-${Date.now()}`,
        name: templateName,
        description: task.description,
        priority: task.priority,
        tags: task.tags,
        estimatedHours: task.estimatedHours,
        subtasks: task.subtasks ? [...task.subtasks] : [],
        category: task.tags?.[0] || 'General',
        createdAt: new Date().toISOString(),
        createdBy: task.assigneeId || task.reporterId || 'user1', // Default to current user
        isPublic: isPublic,
        usageCount: 0
      };

      mockTemplates.push(newTemplate);
      return newTemplate;
    }
  },

  templates: {
    getAll: async (): Promise<TaskTemplate[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return [...mockTemplates];
    },

    getById: async (id: string): Promise<TaskTemplate | null> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockTemplates.find(template => template.id === id) || null;
    },

    create: async (templateData: Omit<TaskTemplate, 'id' | 'createdAt' | 'usageCount'>): Promise<TaskTemplate> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newTemplate: TaskTemplate = {
        id: `template-${Date.now()}`,
        createdAt: new Date().toISOString(),
        usageCount: 0,
        ...templateData
      };
      mockTemplates.push(newTemplate);
      return newTemplate;
    },

    update: async (id: string, templateData: Partial<TaskTemplate>): Promise<TaskTemplate> => {
      await new Promise(resolve => setTimeout(resolve, 400));
      const templateIndex = mockTemplates.findIndex(template => template.id === id);
      if (templateIndex === -1) {
        throw new Error('Template not found');
      }

      const updatedTemplate = {
        ...mockTemplates[templateIndex],
        ...templateData,
        updatedAt: new Date().toISOString()
      };

      mockTemplates[templateIndex] = updatedTemplate;
      return updatedTemplate;
    },

    delete: async (id: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 400));
      const templateIndex = mockTemplates.findIndex(template => template.id === id);
      if (templateIndex !== -1) {
        mockTemplates.splice(templateIndex, 1);
      }
    },

    search: async (query: string): Promise<TaskTemplate[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const lowercaseQuery = query.toLowerCase();
      return mockTemplates.filter(
        template =>
          template.name.toLowerCase().includes(lowercaseQuery) ||
          (template.description?.toLowerCase() || '').includes(lowercaseQuery) ||
          (template.category?.toLowerCase() || '').includes(lowercaseQuery) ||
          (template.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) || false)
      );
    },

    getByCategory: async (category: string): Promise<TaskTemplate[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockTemplates.filter(template => template.category === category);
    },

    getCategories: async (): Promise<string[]> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return Array.from(new Set(mockTemplates.map(template => template.category || 'General')));
    }
  },
  
  users: {
    getAll: async (): Promise<User[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return [...mockUsers];
    },
    
    getById: async (id: string): Promise<User | null> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockUsers.find(user => user.id === id) || null;
    },
    
    getCurrentUser: async (): Promise<User> => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return mockUsers[0]; // Assume first user is current user
    }
  },
  
  comments: {
    getByTaskId: async (taskId: string): Promise<Comment[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockComments.filter(comment => comment.taskId === taskId);
    },

    getCommentCount: async (taskId: string): Promise<number> => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return mockComments.filter(comment => comment.taskId === taskId).length;
    },
    
    create: async (commentData: Omit<Comment, 'id'>): Promise<Comment> => {
      await new Promise(resolve => setTimeout(resolve, 400));
      const now = new Date().toISOString();
      // Use destructuring to avoid createdAt collision with spread
      const { createdAt, ...rest } = commentData;
      const newComment: Comment = {
        id: `comment-${Date.now()}`,
        createdAt: now,
        ...rest
      };
      mockComments.push(newComment);
      return newComment;
    },
    
    update: async (id: string, text: string): Promise<Comment> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const commentIndex = mockComments.findIndex(comment => comment.id === id);
      if (commentIndex === -1) {
        throw new Error('Comment not found');
      }
      
      const updatedComment = {
        ...mockComments[commentIndex],
        text,
        updatedAt: new Date().toISOString()
      };
      
      mockComments[commentIndex] = updatedComment;
      return updatedComment;
    },
    
    delete: async (id: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const commentIndex = mockComments.findIndex(comment => comment.id === id);
      if (commentIndex !== -1) {
        mockComments.splice(commentIndex, 1);
      }
    }
  },
  
  attachments: {
    getByTaskId: async (taskId: string): Promise<Attachment[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockAttachments.filter(attachment => attachment.taskId === taskId);
    },
    
    upload: async (file: { name: string, type: string, size: number }, taskId: string): Promise<Attachment> => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Longer delay to simulate upload
      const timestamp = new Date().toISOString();
      const newAttachment: Attachment = {
        id: `attachment-${Date.now()}`,
        taskId,
        name: file.name,
        fileType: file.type,
        size: file.size,
        url: `https://mock-cdn.example.com/files/${taskId}/${file.name}`,
        createdAt: timestamp
      };
      mockAttachments.push(newAttachment);
      return newAttachment;
    },
    
    delete: async (id: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 400));
      const attachmentIndex = mockAttachments.findIndex(attachment => attachment.id === id);
      if (attachmentIndex !== -1) {
        mockAttachments.splice(attachmentIndex, 1);
      }
    }
  },
  
  googleIntegration: {
    syncCalendar: async (): Promise<boolean> => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true; // Mock successful sync
    },
    
    importGoogleTasks: async (): Promise<Task[]> => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      // Return mock tasks that look like they came from Google
      return mockTasks.slice(0, 3).map(task => ({
        ...task,
        id: `google-${task.id}`,
        source: 'google'
      })) as Task[];
    },
    
    getGoogleDriveFiles: async (): Promise<{ id: string, name: string, url: string }[]> => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return [
        { id: 'gdoc1', name: 'Project Brief.docx', url: 'https://example.com/gdoc1' },
        { id: 'gdoc2', name: 'Meeting Notes.docs', url: 'https://example.com/gdoc2' },
        { id: 'gsheet1', name: 'Budget.sheets', url: 'https://example.com/gsheet1' },
      ];
    }
  },
  
  analytics: {
    getTasksCompletionStats: async (timeframe: 'week' | 'month' | 'year' = 'week'): Promise<{ date: string, completed: number }[]> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate random completion data
      const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365;
      const result = [];
      const now = new Date();
      
      for (let i = 0; i < days; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        result.push({
          date: date.toISOString().split('T')[0],
          completed: Math.floor(Math.random() * 5) // Random number of completed tasks
        });
      }
      
      return result.reverse();
    },
    
    getUserWorkload: async (): Promise<{ userId: string, taskCount: number }[]> => {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Count tasks by user
      const userWorkload: Record<string, number> = {};
      
      mockTasks.forEach(task => {
        if (task.assigneeId) {
          userWorkload[task.assigneeId] = (userWorkload[task.assigneeId] || 0) + 1;
        }
      });
      
      return Object.entries(userWorkload).map(([userId, taskCount]) => ({
        userId,
        taskCount
      }));
    },

    getTasksByPriority: async (): Promise<{ priority: TaskPriority, count: number }[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));

      const priorities: Record<TaskPriority, number> = {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0
      };

      mockTasks.forEach(task => {
        priorities[task.priority]++;
      });

      return Object.keys(priorities).map(priority => ({
        priority: priority as TaskPriority,
        count: priorities[priority as TaskPriority]
      }));
    }
  },
  
  notifications: {
    getAll: async (): Promise<{ id: string, message: string, createdAt: string, read: boolean }[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        { id: 'notif1', message: 'John assigned a task to you', createdAt: new Date(Date.now() - 30000).toISOString(), read: false },
        { id: 'notif2', message: 'Task "Implement dashboard" is due tomorrow', createdAt: new Date(Date.now() - 3600000).toISOString(), read: false },
        { id: 'notif3', message: 'Jane commented on your task', createdAt: new Date(Date.now() - 86400000).toISOString(), read: true },
      ];
    },
    
    markAsRead: async (_: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      // In a real app, this would update the notification status
    }
  }
};

// Error handling wrapper
export const apiHandler = async <T>(apiCall: () => Promise<T>): Promise<{ data: T | null, error: string | null }> => {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (err) {
    console.error('API Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage };
  }
};

// Hooks to use the API client (can be replaced with actual trpc hooks later)
export const useQuery = <T>(queryFn: () => Promise<T>) => {
  return {
    queryFn,
    // Add more properties to simulate a react-query/trpc hook if needed
  };
};