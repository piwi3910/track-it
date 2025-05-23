/**
 * This file contains the types for the tRPC router.
 * It's shared between the frontend and backend to ensure type safety.
 */

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

// Define AppRouter type placeholder
// The actual AppRouter from backend will be used at runtime
export type AppRouter = any;

// For backward compatibility, we'll keep the manual type definition
// but it should match the actual backend router structure
export type AppRouterManual = {
  // Cache Admin
  cacheAdmin: {
    getMetrics: {
      _def: {
        query: () => {
          totalKeys: number;
          keysByPrefix: Record<string, number>;
          memoryUsage: {
            used: string;
            peak: string;
            total: string;
          };
          hitRate?: number;
          missRate?: number;
          keyspace?: {
            hits: number;
            misses: number;
            hitRate: number;
          };
        };
      };
    };
    flushAll: {
      _def: {
        mutation: () => {
          success: boolean;
          message: string;
        };
      };
    };
    clearByPattern: {
      _def: {
        input: [{ pattern: string }];
        mutation: () => {
          success: boolean;
          keysRemoved: number;
          message: string;
        };
      };
    };
    clearResourceCache: {
      _def: {
        input: [{ resourceType: string }];
        mutation: () => {
          success: boolean;
          keysRemoved: number;
          message: string;
        };
      };
    };
  };

  // Tasks
  tasks: {
    getAll: {
      _def: {
        query: () => {
          id: string;
          title: string;
          description?: string | null;
          status: string;
          priority: string;
          createdAt: string;
          updatedAt?: string | null;
          dueDate?: string | null;
          creatorId: string;
          assigneeId?: string | null;
          tags?: string[] | null;
          estimatedHours?: number | null;
          actualHours?: number | null;
          trackingTimeSeconds?: number | null;
          timeTrackingActive?: boolean;
          trackingStartTime?: string | null;
          creator?: {
            id: string;
            name: string;
            avatarUrl?: string | null;
          };
          assignee?: {
            id: string;
            name: string;
            avatarUrl?: string | null;
          } | null;
          _count?: {
            subtasks: number;
            comments: number;
            attachments: number;
          };
          subtasks?: Array<{
            id: string;
            title: string;
            completed: boolean;
            assigneeId?: string | null;
          }>;
        }[];
      };
    };
    getById: {
      _def: {
        input: [{ id: string }];
        query: () => {
          id: string;
          title: string;
          description?: string | null;
          status: string;
          priority: string;
          createdAt: string;
          updatedAt?: string | null;
          dueDate?: string | null;
          creatorId: string;
          assigneeId?: string | null;
          tags?: string[] | null;
          estimatedHours?: number | null;
          actualHours?: number | null;
          trackingTimeSeconds?: number | null;
          timeTrackingActive?: boolean;
          trackingStartTime?: string | null;
          creator?: {
            id: string;
            name: string;
            email: string;
            avatarUrl?: string | null;
          };
          assignee?: {
            id: string;
            name: string;
            email: string;
            avatarUrl?: string | null;
          } | null;
          subtasks?: Array<{
            id: string;
            title: string;
            completed: boolean;
            assigneeId?: string | null;
            assignee?: {
              id: string;
              name: string;
              avatarUrl?: string | null;
            } | null;
          }>;
          _count?: {
            comments: number;
            attachments: number;
          };
        } | null;
      };
    };
    getByStatus: {
      _def: {
        input: [{ status: string }];
        query: () => {
          id: string;
          title: string;
          description?: string | null;
          status: string;
          priority: string;
          createdAt: string;
          updatedAt?: string | null;
          dueDate?: string | null;
          creatorId: string;
          assigneeId?: string | null;
          tags?: string[] | null;
          estimatedHours?: number | null;
          actualHours?: number | null;
          trackingTimeSeconds?: number | null;
          timeTrackingActive?: boolean;
          trackingStartTime?: string | null;
          creator?: {
            id: string;
            name: string;
            avatarUrl?: string | null;
          };
          assignee?: {
            id: string;
            name: string;
            avatarUrl?: string | null;
          } | null;
          _count?: {
            subtasks: number;
            comments: number;
            attachments: number;
          };
        }[];
      };
    };
    search: {
      _def: {
        input: [{ query: string }];
        query: () => {
          id: string;
          title: string;
          description?: string | null;
          status: string;
          priority: string;
          createdAt: string;
          updatedAt?: string | null;
          tags?: string[] | null;
          _count?: {
            subtasks: number;
            comments: number;
            attachments: number;
          };
        }[];
      };
    };
    create: {
      _def: {
        input: [{
          title: string;
          description?: string;
          status?: string;
          priority: string;
          dueDate?: string | null;
          assigneeId?: string | null;
          tags?: string[];
          estimatedHours?: number;
          creatorId: string;
          subtasks?: Array<{
            title: string;
            completed?: boolean;
            assigneeId?: string | null;
          }>;
        }];
        mutation: () => {
          id: string;
          title: string;
          description?: string | null;
          status: string;
          priority: string;
          createdAt: string;
          updatedAt?: string | null;
          dueDate?: string | null;
          creatorId: string;
          assigneeId?: string | null;
          tags?: string[] | null;
          estimatedHours?: number | null;
          creator?: {
            id: string;
            name: string;
            avatarUrl?: string | null;
          };
          assignee?: {
            id: string;
            name: string;
            avatarUrl?: string | null;
          } | null;
          subtasks?: Array<{
            id: string;
            title: string;
            completed: boolean;
            assigneeId?: string | null;
          }>;
        };
      };
    };
    update: {
      _def: {
        input: [{
          id: string;
          data: {
            title?: string;
            description?: string | null;
            status?: string;
            priority?: string;
            dueDate?: string | null;
            assigneeId?: string | null;
            tags?: string[];
            estimatedHours?: number;
            actualHours?: number;
            trackingTimeSeconds?: number;
            timeTrackingActive?: boolean;
            subtasks?: Array<{
              id?: string;
              title: string;
              completed: boolean;
              assigneeId?: string | null;
            }>;
          };
        }];
        mutation: () => {
          id: string;
          title: string;
          description?: string | null;
          status: string;
          priority: string;
          updatedAt: string;
          creatorId: string;
          assigneeId?: string | null;
          tags?: string[] | null;
          creator?: {
            id: string;
            name: string;
            avatarUrl?: string | null;
          };
          assignee?: {
            id: string;
            name: string;
            avatarUrl?: string | null;
          } | null;
        };
      };
    };
    delete: {
      _def: {
        input: [{ id: string }];
        mutation: () => {
          id: string;
          title: string;
        };
      };
    };
    updateStatus: {
      _def: {
        input: [{ id: string; status: string }];
        mutation: () => {
          id: string;
          status: string;
          updatedAt: string;
        };
      };
    };
    updateAssignee: {
      _def: {
        input: [{ id: string; assigneeId: string | null }];
        mutation: () => {
          id: string;
          assigneeId: string | null;
          updatedAt: string;
        };
      };
    };
    startTimeTracking: {
      _def: {
        input: [{ id: string }];
        mutation: () => {
          id: string;
          timeTrackingActive: boolean;
          trackingStartTime: string;
        };
      };
    };
    stopTimeTracking: {
      _def: {
        input: [{ id: string }];
        mutation: () => {
          id: string;
          timeTrackingActive: boolean;
          trackingStartTime: null;
          trackingTimeSeconds: number;
        };
      };
    };
    // Added endpoints that match the mock API
    saveAsTemplate: {
      _def: {
        input: [{
          taskId: string;
          templateName: string;
          isPublic?: boolean;
        }];
        mutation: () => {
          id: string;
          name: string;
          description?: string;
          priority: string;
          tags?: string[];
          estimatedHours?: number;
          subtasks?: { id: string; title: string; completed: boolean }[];
          category: string;
          createdAt: string;
          createdBy?: string;
          isPublic: boolean;
          usageCount: number;
        };
      };
    };
    createFromTemplate: {
      _def: {
        input: [{
          templateId: string;
          taskData: {
            title?: string;
            description?: string;
            status?: string;
            priority?: string;
            dueDate?: string | null;
            assigneeId?: string | null;
          };
        }];
        mutation: () => {
          id: string;
          title: string;
          description?: string | null;
          status: string;
          priority: string;
          createdAt: string;
          updatedAt?: string | null;
          dueDate?: string | null;
          creatorId: string;
          assigneeId?: string | null;
          tags?: string[] | null;
          estimatedHours?: number | null;
          creator?: {
            id: string;
            name: string;
            avatarUrl?: string | null;
          };
          assignee?: {
            id: string;
            name: string;
            avatarUrl?: string | null;
          } | null;
          subtasks?: Array<{
            id: string;
            title: string;
            completed: boolean;
            assigneeId?: string | null;
          }>;
        };
      };
    };
  };
  
  // Templates
  templates: {
    getAll: {
      _def: {
        query: () => {
          id: string;
          name: string;
          description?: string | null;
          priority: string;
          tags?: string[] | null;
          estimatedHours?: number | null;
          subtasks?: Array<{
            id: string;
            title: string;
            completed: boolean;
            assigneeId?: string | null;
          }>;
          category?: string | null;
          createdAt: string;
          createdById: string;
          createdBy?: {
            id: string;
            name: string;
            avatarUrl?: string | null;
          };
          isPublic: boolean;
          usageCount: number;
        }[];
      };
    };
    getById: {
      _def: {
        input: [{ id: string }];
        query: () => {
          id: string;
          name: string;
          description?: string | null;
          priority: string;
          tags?: string[] | null;
          estimatedHours?: number | null;
          subtasks?: Array<{
            id: string;
            title: string;
            completed: boolean;
            assigneeId?: string | null;
          }>;
          category?: string | null;
          createdAt: string;
          createdById: string;
          createdBy?: {
            id: string;
            name: string;
            avatarUrl?: string | null;
          };
          isPublic: boolean;
          usageCount: number;
        } | null;
      };
    };
    getByCategory: {
      _def: {
        input: [{ category: string }];
        query: () => {
          id: string;
          name: string;
          description?: string | null;
          priority: string;
          tags?: string[] | null;
          category?: string | null;
          createdAt: string;
          createdById: string;
          isPublic: boolean;
          usageCount: number;
        }[];
      };
    };
    getCategories: {
      _def: {
        query: () => string[];
      };
    };
    create: {
      _def: {
        input: [{
          name: string;
          description?: string;
          priority: string;
          tags?: string[];
          estimatedHours?: number;
          subtasks?: Array<{
            title: string;
            completed?: boolean;
          }>;
          category?: string;
          isPublic?: boolean;
          createdById: string;
        }];
        mutation: () => {
          id: string;
          name: string;
          description?: string | null;
          priority: string;
          tags?: string[] | null;
          estimatedHours?: number | null;
          subtasks?: Array<{
            id: string;
            title: string;
            completed: boolean;
          }>;
          category?: string | null;
          createdAt: string;
          createdById: string;
          isPublic: boolean;
          usageCount: number;
        };
      };
    };
    update: {
      _def: {
        input: [{
          id: string;
          data: {
            name?: string;
            description?: string | null;
            priority?: string;
            tags?: string[];
            estimatedHours?: number;
            subtasks?: Array<{
              id?: string;
              title: string;
              completed: boolean;
            }>;
            category?: string;
            isPublic?: boolean;
          };
        }];
        mutation: () => {
          id: string;
          name: string;
          description?: string | null;
          priority: string;
          tags?: string[] | null;
          subtasks?: Array<{
            id: string;
            title: string;
            completed: boolean;
          }>;
          category?: string | null;
          updatedAt: string;
          isPublic: boolean;
        };
      };
    };
    delete: {
      _def: {
        input: [{ id: string }];
        mutation: () => {
          id: string;
          name: string;
        };
      };
    };
    search: {
      _def: {
        input: [{ query: string }];
        query: () => {
          id: string;
          name: string;
          description?: string | null;
          tags?: string[] | null;
          category?: string | null;
          usageCount: number;
        }[];
      };
    };
  };
  
  // Users
  users: {
    login: {
      _def: {
        input: [{
          email: string;
          password: string;
        }];
        mutation: () => {
          id: string;
          name: string;
          email: string;
          role: string;
          avatarUrl?: string | null;
          token: string;
        };
      };
    };
    register: {
      _def: {
        input: [{
          name: string;
          email: string;
          password: string;
          passwordConfirm: string;
        }];
        mutation: () => {
          id: string;
          name: string;
          email: string;
          role: string;
          token: string;
        };
      };
    };
    getCurrentUser: {
      _def: {
        query: () => {
          id: string;
          name: string;
          email: string;
          role: string;
          avatarUrl?: string | null;
          preferences?: {
            theme?: string;
            defaultView?: string;
            notifications?: {
              email?: boolean;
              inApp?: boolean;
            };
          } | null;
        };
      };
    };
    getAllUsers: {
      _def: {
        query: () => {
          id: string;
          name: string;
          email: string;
          role: string;
          avatarUrl?: string | null;
        }[];
      };
    };
    updateProfile: {
      _def: {
        input: [{
          name?: string;
          avatarUrl?: string;
          preferences?: {
            theme?: 'light' | 'dark' | 'auto';
            defaultView?: 'dashboard' | 'kanban' | 'calendar' | 'backlog';
            notifications?: {
              email?: boolean;
              inApp?: boolean;
            };
          };
        }];
        mutation: () => {
          id: string;
          name: string;
          email: string;
          avatarUrl?: string | null;
          preferences?: {
            theme?: string;
            defaultView?: string;
            notifications?: {
              email?: boolean;
              inApp?: boolean;
            };
          } | null;
        };
      };
    };
    updateAvatar: {
      _def: {
        input: [{
          avatarUrl: string | null;
        }];
        mutation: () => {
          id: string;
          name: string;
          email: string;
          role: string;
          avatarUrl?: string | null;
          preferences?: {
            theme?: string;
            defaultView?: string;
            notifications?: {
              email?: boolean;
              inApp?: boolean;
            };
          } | null;
          googleConnected?: boolean;
          googleEmail?: string | null;
        };
      };
    };
    updateUserRole: {
      _def: {
        input: [{
          userId: string;
          role: 'admin' | 'member' | 'guest';
        }];
        mutation: () => {
          id: string;
          name: string;
          role: string;
        };
      };
    };
    updateGoogleIntegration: {
      _def: {
        input: [{
          googleRefreshToken?: string | null;
          googleEnabled: boolean;
        }];
        mutation: () => {
          id: string;
          name: string;
          googleIntegration: {
            enabled: boolean;
            connected: boolean;
          };
        };
      };
    };
    // Admin endpoints
    getUserDeletionStats: {
      _def: {
        input: [{
          userId: string;
        }];
        query: () => {
          user: {
            id: string;
            name: string;
            email: string;
          };
          stats: {
            createdTasks: number;
            assignedTasks: number;
            comments: number;
            notifications: number;
          };
          consequences: {
            willDelete: string[];
            willUpdate: string[];
          };
        };
      };
    };
    createUser: {
      _def: {
        input: [{
          name: string;
          email: string;
          password: string;
          role?: 'admin' | 'member' | 'guest';
        }];
        mutation: () => {
          id: string;
          name: string;
          email: string;
          role: string;
          avatarUrl?: string | null;
        };
      };
    };
    updateUser: {
      _def: {
        input: [{
          userId: string;
          name?: string;
          email?: string;
          role?: 'admin' | 'member' | 'guest';
        }];
        mutation: () => {
          id: string;
          name: string;
          email: string;
          role: string;
          avatarUrl?: string | null;
        };
      };
    };
    deleteUser: {
      _def: {
        input: [{
          userId: string;
        }];
        mutation: () => {
          id: string;
          deleted: boolean;
        };
      };
    };
    resetUserPassword: {
      _def: {
        input: [{
          userId: string;
          newPassword: string;
        }];
        mutation: () => {
          id: string;
          message: string;
        };
      };
    };
  };
  
  // Comments
  comments: {
    getByTaskId: {
      _def: {
        input: [{ taskId: string }];
        query: () => {
          id: string;
          taskId: string;
          text: string;
          createdAt: string;
          updatedAt?: string | null;
          authorId: string;
          author?: {
            id: string;
            name: string;
            avatarUrl?: string | null;
          };
          parentId?: string | null;
          replies?: {
            id: string;
            text: string;
            createdAt: string;
            updatedAt?: string | null;
            authorId: string;
            author?: {
              id: string;
              name: string;
              avatarUrl?: string | null;
            };
          }[];
        }[];
      };
    };
    getCommentCount: {
      _def: {
        input: [{ taskId: string }];
        query: () => number;
      };
    };
    create: {
      _def: {
        input: [{
          taskId: string;
          text: string;
          parentId?: string;
        }];
        mutation: () => {
          id: string;
          taskId: string;
          text: string;
          createdAt: string;
          authorId: string;
          author?: {
            id: string;
            name: string;
            avatarUrl?: string | null;
          };
          parentId?: string | null;
        };
      };
    };
    update: {
      _def: {
        input: [{
          id: string;
          text: string;
        }];
        mutation: () => {
          id: string;
          text: string;
          updatedAt: string;
        };
      };
    };
    delete: {
      _def: {
        input: [{ id: string }];
        mutation: () => {
          success: boolean;
        };
      };
    };
  };
  
  // Attachments
  attachments: {
    getByTaskId: {
      _def: {
        input: [{ taskId: string }];
        query: () => {
          id: string;
          taskId: string;
          name: string;
          fileType: string;
          size: number;
          url: string;
          createdAt: string;
          uploaderId?: string;
          uploader?: {
            id: string;
            name: string;
            avatarUrl?: string | null;
          };
        }[];
      };
    };
    upload: {
      _def: {
        input: [{
          taskId: string;
          file: {
            name: string;
            type: string;
            size: number;
            data?: string;
          };
        }];
        mutation: () => {
          id: string;
          taskId: string;
          name: string;
          fileType: string;
          size: number;
          url: string;
          createdAt: string;
          uploaderId?: string;
        };
      };
    };
    delete: {
      _def: {
        input: [{ id: string }];
        mutation: () => {
          success: boolean;
        };
      };
    };
  };
  
  // Analytics
  analytics: {
    getTasksCompletionStats: {
      _def: {
        input: [{ timeframe: 'week' | 'month' | 'year' }];
        query: () => {
          date: string;
          completed: number;
        }[];
      };
    };
    getUserWorkload: {
      _def: {
        query: () => {
          userId: string;
          userName: string;
          taskCount: number;
          avatarUrl?: string | null;
        }[];
      };
    };
    getTasksByPriority: {
      _def: {
        query: () => {
          priority: string;
          count: number;
        }[];
      };
    };
    getTasksByStatus: {
      _def: {
        query: () => {
          status: string;
          count: number;
        }[];
      };
    };
    getTaskCompletionRate: {
      _def: {
        input: [{ period: 'week' | 'month' | 'quarter' }];
        query: () => {
          completed: number;
          total: number;
          rate: number;
        };
      };
    };
  };
  
  // Google Integration
  googleIntegration: {
    syncCalendar: {
      _def: {
        mutation: () => {
          success: boolean;
          syncedEvents: number;
        };
      };
    };
    importGoogleTasks: {
      _def: {
        query: () => {
          id: string;
          title: string;
          status: string;
          priority: string;
          dueDate?: string | null;
          source: 'google_tasks';
        }[];
      };
    };
    getGoogleDriveFiles: {
      _def: {
        query: () => {
          id: string;
          name: string;
          url: string;
          iconUrl?: string;
          mimeType: string;
          createdAt: string;
        }[];
      };
    };
    linkGoogleAccount: {
      _def: {
        input: [{ authCode: string }];
        mutation: () => {
          success: boolean;
          message: string;
        };
      };
    };
    unlinkGoogleAccount: {
      _def: {
        mutation: () => {
          success: boolean;
          message: string;
        };
      };
    };
    getGoogleAccountStatus: {
      _def: {
        query: () => {
          connected: boolean;
          email?: string;
          scopes?: string[];
        };
      };
    };
  };
  
  // Notifications
  notifications: {
    getAll: {
      _def: {
        query: () => {
          id: string;
          userId: string;
          type: string;
          title: string;
          message: string;
          read: boolean;
          data?: {
            taskId?: string;
            commentId?: string;
            userId?: string;
            url?: string;
          } | null;
          createdAt: string;
        }[];
      };
    };
    getUnreadCount: {
      _def: {
        query: () => number;
      };
    };
    markAsRead: {
      _def: {
        input: [{ id: string }];
        mutation: () => {
          success: boolean;
          id: string;
        };
      };
    };
    markAllAsRead: {
      _def: {
        mutation: () => {
          success: boolean;
          count: number;
        };
      };
    };
    delete: {
      _def: {
        input: [{ id: string }];
        mutation: () => {
          success: boolean;
        };
      };
    };
    updatePreferences: {
      _def: {
        input: [{
          email: boolean;
          inApp: boolean;
          desktop: boolean;
        }];
        mutation: () => {
          success: boolean;
          preferences: {
            email: boolean;
            inApp: boolean;
            desktop: boolean;
          };
        };
      };
    };
  };
  
  // Cached versions of the tasks router
  cachedTasks: {
    // All the same endpoints as the tasks router, but with caching
    getAll: {
      _def: {
        query: () => {
          id: string;
          title: string;
          description?: string | null;
          status: string;
          priority: string;
          createdAt: string;
          updatedAt?: string | null;
          dueDate?: string | null;
          creatorId: string;
          assigneeId?: string | null;
          tags?: string[] | null;
          estimatedHours?: number | null;
          actualHours?: number | null;
          trackingTimeSeconds?: number | null;
          timeTrackingActive?: boolean;
          trackingStartTime?: string | null;
          creator?: {
            id: string;
            name: string;
            avatarUrl?: string | null;
          };
          assignee?: {
            id: string;
            name: string;
            avatarUrl?: string | null;
          } | null;
          _count?: {
            subtasks: number;
            comments: number;
            attachments: number;
          };
          subtasks?: Array<{
            id: string;
            title: string;
            completed: boolean;
            assigneeId?: string | null;
          }>;
        }[];
      };
    };
    getById: {
      _def: {
        input: [{ id: string }];
        query: () => {
          id: string;
          title: string;
          description?: string | null;
          status: string;
          priority: string;
          createdAt: string;
          updatedAt?: string | null;
          dueDate?: string | null;
          creatorId: string;
          assigneeId?: string | null;
          tags?: string[] | null;
          estimatedHours?: number | null;
          actualHours?: number | null;
          trackingTimeSeconds?: number | null;
          timeTrackingActive?: boolean;
          trackingStartTime?: string | null;
          creator?: {
            id: string;
            name: string;
            email: string;
            avatarUrl?: string | null;
          };
          assignee?: {
            id: string;
            name: string;
            email: string;
            avatarUrl?: string | null;
          } | null;
          subtasks?: Array<{
            id: string;
            title: string;
            completed: boolean;
            assigneeId?: string | null;
            assignee?: {
              id: string;
              name: string;
              avatarUrl?: string | null;
            } | null;
          }>;
          _count?: {
            comments: number;
            attachments: number;
          };
        } | null;
      };
    };
    getByStatus: {
      _def: {
        input: [{ status: string }];
        query: () => {
          id: string;
          title: string;
          description?: string | null;
          status: string;
          priority: string;
          createdAt: string;
          updatedAt?: string | null;
          dueDate?: string | null;
          creatorId: string;
          assigneeId?: string | null;
          tags?: string[] | null;
          estimatedHours?: number | null;
          actualHours?: number | null;
          trackingTimeSeconds?: number | null;
          timeTrackingActive?: boolean;
          trackingStartTime?: string | null;
          creator?: {
            id: string;
            name: string;
            avatarUrl?: string | null;
          };
          assignee?: {
            id: string;
            name: string;
            avatarUrl?: string | null;
          } | null;
          _count?: {
            subtasks: number;
            comments: number;
            attachments: number;
          };
        }[];
      };
    };
    // Other endpoints the same as tasks router
  };
};

// Helper type to get output types
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// Helper type to get input types
export type RouterInputs = inferRouterInputs<AppRouter>;

// Re-export types
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type UserRole = 'admin' | 'member' | 'guest';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  weight?: number;
  tags?: string[];
  dueDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isMultiDay?: boolean;
  createdAt?: string;
  updatedAt?: string;
  assigneeId?: string | null;
  reporterId?: string | null;
  estimatedHours?: number;
  actualHours?: number;
  timeTrackingActive?: boolean;
  trackingTimeSeconds?: number;
  subtasks?: Subtask[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: UserRole;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  priority: TaskPriority;
  tags?: string[];
  estimatedHours?: number;
  subtasks?: Subtask[];
  category?: string;
  createdAt: string;
  createdBy?: string;
  isPublic?: boolean;
  usageCount?: number;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  text: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface Attachment {
  id: string;
  taskId: string;
  name: string;
  fileType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface RegisterResponse {
  id: string;
  name: string;
  email: string;
}