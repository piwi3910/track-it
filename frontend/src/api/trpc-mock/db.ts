/**
 * Mock database for the mock tRPC API
 * This centralizes all our mock data in one place with proper access and update methods
 *
 * @ts-nocheck - Disable type checking for this file
 */
import { Task, User, Comment, Attachment, TaskTemplate } from '@/types/task';
import * as mockDataOrigin from '../mockData';

// Create a mutable copy of the mock data
export const db = {
  taskData: [...mockDataOrigin.mockTasks] as Task[],
  userData: [...mockDataOrigin.mockUsers] as User[],
  commentData: [...mockDataOrigin.mockComments] as Comment[],
  attachmentData: [...mockDataOrigin.mockAttachments] as Attachment[],
  templateData: [...mockDataOrigin.mockTemplates] as TaskTemplate[],

  // Data access methods - similar to ORM methods
  tasks: {
    findAll: () => db.taskData,
    findById: (id: string) => db.taskData.find(task => task.id === id) || null,
    findByStatus: (status: string) => db.taskData.filter(task => task.status === status),
    create: (task: Omit<Task, 'id'>) => {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...task
      };
      db.taskData.push(newTask);
      return newTask;
    },
    update: (id: string, data: Partial<Task>) => {
      const index = db.taskData.findIndex(task => task.id === id);
      if (index === -1) throw new Error(`Task with id ${id} not found`);

      const updatedTask = {
        ...db.taskData[index],
        ...data,
        updatedAt: new Date().toISOString()
      };

      db.taskData[index] = updatedTask;
      return updatedTask;
    },
    delete: (id: string) => {
      const index = db.taskData.findIndex(task => task.id === id);
      if (index !== -1) {
        db.taskData.splice(index, 1);
      }
    },
    search: (query: string) => {
      const lowercaseQuery = query.toLowerCase();
      return db.taskData.filter(
        task =>
          task.title.toLowerCase().includes(lowercaseQuery) ||
          (task.description?.toLowerCase() || '').includes(lowercaseQuery) ||
          (task.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) || false)
      );
    }
  },
  
  templates: {
    findAll: () => db.templateData,
    findById: (id: string) => db.templateData.find(template => template.id === id) || null,
    findByCategory: (category: string) => db.templateData.filter(template => template.category === category),
    getCategories: () => Array.from(new Set(db.templateData.map(template => template.category || 'General'))),
    create: (template: Omit<TaskTemplate, 'id' | 'createdAt' | 'usageCount'>) => {
      const newTemplate: TaskTemplate = {
        id: `template-${Date.now()}`,
        createdAt: new Date().toISOString(),
        usageCount: 0,
        ...template
      };
      db.templateData.push(newTemplate);
      return newTemplate;
    },
    update: (id: string, data: Partial<TaskTemplate>) => {
      const index = db.templateData.findIndex(template => template.id === id);
      if (index === -1) throw new Error(`Template with id ${id} not found`);

      const updatedTemplate = {
        ...db.templateData[index],
        ...data,
        updatedAt: new Date().toISOString()
      };

      db.templateData[index] = updatedTemplate;
      return updatedTemplate;
    },
    delete: (id: string) => {
      const index = db.templateData.findIndex(template => template.id === id);
      if (index !== -1) {
        db.templateData.splice(index, 1);
      }
    },
    search: (query: string) => {
      const lowercaseQuery = query.toLowerCase();
      return db.templateData.filter(
        template =>
          template.name.toLowerCase().includes(lowercaseQuery) ||
          (template.description?.toLowerCase() || '').includes(lowercaseQuery) ||
          (template.category?.toLowerCase() || '').includes(lowercaseQuery) ||
          (template.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) || false)
      );
    },
    incrementUsage: (id: string) => {
      const index = db.templateData.findIndex(template => template.id === id);
      if (index !== -1) {
        db.templateData[index] = {
          ...db.templateData[index],
          usageCount: (db.templateData[index].usageCount || 0) + 1
        };
      }
    }
  },
  
  users: {
    findAll: () => db.userData,
    findById: (id: string) => db.userData.find(user => user.id === id) || null,
    findByEmail: (email: string) => db.userData.find(user => user.email === email) || null,
    getCurrentUser: () => db.userData[0], // Assume first user is current user
    create: (userData: Partial<User>) => {
      const newUser = {
        id: `user-${Date.now()}`,
        email: userData.email || `user${Date.now()}@example.com`,
        name: userData.name || 'New User',
        role: userData.role || 'MEMBER',
        createdAt: new Date().toISOString(),
        avatarUrl: userData.avatarUrl || null
      };
      db.userData.push(newUser);
      return newUser;
    },
    update: (id: string, data: Partial<User>) => {
      const index = db.userData.findIndex(user => user.id === id);
      if (index === -1) throw new Error(`User with id ${id} not found`);

      const updatedUser = {
        ...db.userData[index],
        ...data,
        updatedAt: new Date().toISOString()
      };

      db.userData[index] = updatedUser;
      return updatedUser;
    }
  },
  
  comments: {
    findByTaskId: (taskId: string) => db.commentData.filter(comment => comment.taskId === taskId),
    countByTaskId: (taskId: string) => db.commentData.filter(comment => comment.taskId === taskId).length,
    create: (comment: Omit<Comment, 'id'>) => {
      const now = new Date().toISOString();
      const newComment: Comment = {
        id: `comment-${Date.now()}`,
        createdAt: now,
        ...comment
      };
      db.commentData.push(newComment);
      return newComment;
    },
    update: (id: string, text: string) => {
      const index = db.commentData.findIndex(comment => comment.id === id);
      if (index === -1) throw new Error(`Comment with id ${id} not found`);

      const updatedComment = {
        ...db.commentData[index],
        text,
        updatedAt: new Date().toISOString()
      };

      db.commentData[index] = updatedComment;
      return updatedComment;
    },
    delete: (id: string) => {
      const index = db.commentData.findIndex(comment => comment.id === id);
      if (index !== -1) {
        db.commentData.splice(index, 1);
      }
    }
  },
  
  attachments: {
    findByTaskId: (taskId: string) => db.attachmentData.filter(attachment => attachment.taskId === taskId),
    create: (taskId: string, file: { name: string, type: string, size: number }) => {
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
      db.attachmentData.push(newAttachment);
      return newAttachment;
    },
    delete: (id: string) => {
      const index = db.attachmentData.findIndex(attachment => attachment.id === id);
      if (index !== -1) {
        db.attachmentData.splice(index, 1);
      }
    }
  },
  
  analytics: {
    getTaskCompletionStats: (timeframe: 'week' | 'month' | 'year' = 'week') => {
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
    
    getUserWorkload: () => {
      // Count tasks by user
      const userWorkload: Record<string, number> = {};

      db.taskData.forEach(task => {
        if (task.assigneeId) {
          userWorkload[task.assigneeId] = (userWorkload[task.assigneeId] || 0) + 1;
        }
      });
      
      return Object.entries(userWorkload).map(([userId, taskCount]) => ({
        userId,
        taskCount
      }));
    },
    
    getTasksByPriority: () => {
      const priorities: Record<string, number> = {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0
      };
      
      db.taskData.forEach(task => {
        priorities[task.priority]++;
      });
      
      return Object.keys(priorities).map(priority => ({
        priority,
        count: priorities[priority]
      }));
    }
  },
  
  // Simulated Google integration
  googleIntegration: {
    syncCalendar: async () => true, // Mock successful sync
    
    importGoogleTasks: () => {
      // Return mock tasks that look like they came from Google
      return db.taskData.slice(0, 3).map(task => ({
        ...task,
        id: `google-${task.id}`,
        source: 'google'
      })) as Task[];
    },
    
    getGoogleDriveFiles: () => [
      { id: 'gdoc1', name: 'Project Brief.docx', url: 'https://example.com/gdoc1' },
      { id: 'gdoc2', name: 'Meeting Notes.docs', url: 'https://example.com/gdoc2' },
      { id: 'gsheet1', name: 'Budget.sheets', url: 'https://example.com/gsheet1' },
    ]
  },
  
  notifications: {
    getAll: () => [
      { id: 'notif1', message: 'John assigned a task to you', createdAt: new Date(Date.now() - 30000).toISOString(), read: false },
      { id: 'notif2', message: 'Task "Implement dashboard" is due tomorrow', createdAt: new Date(Date.now() - 3600000).toISOString(), read: false },
      { id: 'notif3', message: 'Jane commented on your task', createdAt: new Date(Date.now() - 86400000).toISOString(), read: true },
    ],
    
    markAsRead: (id: string) => {
      // In a real app, this would update the notification status
    }
  }
};

// Helper to simulate network delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));