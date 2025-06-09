import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { api } from '@/api';
import type { Task, User, TaskTemplate, TaskStatus, TaskPriority } from '@track-it/shared/types';

interface TaskFilter {
  status?: TaskStatus;
  assigneeId?: string;
  priority?: TaskPriority;
  search?: string;
}

interface AppState {
  // User state
  currentUser: User | null;
  userLoading: boolean;
  userError: string | null;
  
  // Task state
  tasks: Task[];
  selectedTask: Task | null;
  taskFilters: TaskFilter;
  tasksLoading: boolean;
  tasksError: string | null;
  
  // Template state
  templates: TaskTemplate[];
  selectedTemplate: TaskTemplate | null;
  templatesLoading: boolean;
  templatesError: string | null;
  
  // Actions
  // User actions
  setCurrentUser: (user: User | null) => void;
  fetchCurrentUser: () => Promise<void>;
  logout: () => Promise<void>;
  
  // Task actions
  fetchTasks: () => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<Task | undefined>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setSelectedTask: (task: Task | null) => void;
  setTaskFilters: (filters: TaskFilter) => void;
  getFilteredTasks: () => Task[];
  
  // Template actions
  fetchTemplates: () => Promise<void>;
  createTemplate: (template: Partial<TaskTemplate>) => Promise<TaskTemplate | undefined>;
  updateTemplate: (id: string, updates: Partial<TaskTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  setSelectedTemplate: (template: TaskTemplate | null) => void;
  
  // Initialize
  initialize: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      currentUser: null,
      userLoading: false,
      userError: null,
      
      tasks: [],
      selectedTask: null,
      taskFilters: {},
      tasksLoading: false,
      tasksError: null,
      
      templates: [],
      selectedTemplate: null,
      templatesLoading: false,
      templatesError: null,
      
      // User actions
      setCurrentUser: (user) => set({ currentUser: user }),
      
      fetchCurrentUser: async () => {
        set({ userLoading: true, userError: null });
        try {
          const user = await api.auth.getCurrentUser();
          set({ currentUser: user, userLoading: false });
        } catch (error) {
          set({ 
            userError: error instanceof Error ? error.message : 'Failed to fetch user',
            userLoading: false 
          });
        }
      },
      
      logout: async () => {
        try {
          await api.auth.logout();
          set({ 
            currentUser: null,
            tasks: [],
            templates: [],
            selectedTask: null,
            selectedTemplate: null
          });
        } catch (error) {
          console.error('Logout failed:', error);
        }
      },
      
      // Task actions
      fetchTasks: async () => {
        set({ tasksLoading: true, tasksError: null });
        try {
          const tasks = await api.tasks.getAll();
          set({ tasks, tasksLoading: false });
        } catch (error) {
          set({ 
            tasksError: error instanceof Error ? error.message : 'Failed to fetch tasks',
            tasksLoading: false 
          });
        }
      },
      
      createTask: async (taskData) => {
        try {
          const newTask = await api.tasks.create(taskData);
          set((state) => ({ tasks: [...state.tasks, newTask] }));
          return newTask;
        } catch (error) {
          console.error('Failed to create task:', error);
          return undefined;
        }
      },
      
      updateTask: async (id, updates) => {
        try {
          const updatedTask = await api.tasks.update(id, updates);
          set((state) => ({
            tasks: state.tasks.map((t) => t.id === id ? updatedTask : t),
            selectedTask: state.selectedTask?.id === id ? updatedTask : state.selectedTask
          }));
        } catch (error) {
          console.error('Failed to update task:', error);
        }
      },
      
      deleteTask: async (id) => {
        try {
          await api.tasks.delete(id);
          set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== id),
            selectedTask: state.selectedTask?.id === id ? null : state.selectedTask
          }));
        } catch (error) {
          console.error('Failed to delete task:', error);
        }
      },
      
      setSelectedTask: (task) => set({ selectedTask: task }),
      
      setTaskFilters: (filters) => set({ taskFilters: filters }),
      
      getFilteredTasks: () => {
        const { tasks, taskFilters } = get();
        
        return tasks.filter((task) => {
          if (taskFilters.status && task.status !== taskFilters.status) {
            return false;
          }
          if (taskFilters.assigneeId && task.assigneeId !== taskFilters.assigneeId) {
            return false;
          }
          if (taskFilters.priority && task.priority !== taskFilters.priority) {
            return false;
          }
          if (taskFilters.search) {
            const searchLower = taskFilters.search.toLowerCase();
            return (
              task.title.toLowerCase().includes(searchLower) ||
              task.description?.toLowerCase().includes(searchLower) ||
              task.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
          }
          return true;
        });
      },
      
      // Template actions
      fetchTemplates: async () => {
        set({ templatesLoading: true, templatesError: null });
        try {
          const templates = await api.templates.getAll();
          set({ templates, templatesLoading: false });
        } catch (error) {
          set({ 
            templatesError: error instanceof Error ? error.message : 'Failed to fetch templates',
            templatesLoading: false 
          });
        }
      },
      
      createTemplate: async (templateData) => {
        try {
          const newTemplate = await api.templates.create(templateData);
          set((state) => ({ templates: [...state.templates, newTemplate] }));
          return newTemplate;
        } catch (error) {
          console.error('Failed to create template:', error);
          return undefined;
        }
      },
      
      updateTemplate: async (id, updates) => {
        try {
          const updatedTemplate = await api.templates.update(id, updates);
          set((state) => ({
            templates: state.templates.map((t) => t.id === id ? updatedTemplate : t),
            selectedTemplate: state.selectedTemplate?.id === id ? updatedTemplate : state.selectedTemplate
          }));
        } catch (error) {
          console.error('Failed to update template:', error);
        }
      },
      
      deleteTemplate: async (id) => {
        try {
          await api.templates.delete(id);
          set((state) => ({
            templates: state.templates.filter((t) => t.id !== id),
            selectedTemplate: state.selectedTemplate?.id === id ? null : state.selectedTemplate
          }));
        } catch (error) {
          console.error('Failed to delete template:', error);
        }
      },
      
      setSelectedTemplate: (template) => set({ selectedTemplate: template }),
      
      // Initialize
      initialize: async () => {
        const promises = [];
        
        // Fetch user if not already loaded
        if (!get().currentUser && !get().userLoading) {
          promises.push(get().fetchCurrentUser());
        }
        
        // Fetch tasks if not already loaded
        if (get().tasks.length === 0 && !get().tasksLoading) {
          promises.push(get().fetchTasks());
        }
        
        // Fetch templates if not already loaded
        if (get().templates.length === 0 && !get().templatesLoading) {
          promises.push(get().fetchTemplates());
        }
        
        await Promise.all(promises);
      }
    })),
    {
      name: 'app-store',
    }
  )
);

// Subscribe to auth changes to clear data when user logs out
useAppStore.subscribe(
  (state) => state.currentUser,
  (currentUser) => {
    if (!currentUser) {
      // Clear user-specific data when logged out
      useAppStore.setState({
        tasks: [],
        templates: [],
        selectedTask: null,
        selectedTemplate: null,
        taskFilters: {}
      });
    }
  }
);