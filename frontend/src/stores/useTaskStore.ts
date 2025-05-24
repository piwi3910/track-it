import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from '@/api';
import type { Task, TaskStatus } from '@track-it/shared';
import type { RouterInputs } from '@track-it/shared';

// Types
type CreateTaskInput = RouterInputs['tasks']['create'];
type UpdateTaskInput = RouterInputs['tasks']['update']['data'];

// Filter types
interface TaskFilter {
  status?: string[];
  priority?: string[];
  assigneeId?: string[];
  tags?: string[];
  search?: string;
  dueDate?: {
    from?: Date;
    to?: Date;
  };
}

// Store state
interface TaskState {
  // Tasks data
  tasks: Task[];
  filteredTasks: Task[];
  selectedTask: Task | null;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  
  // Filters
  filters: TaskFilter;
  savedFilters: Array<{
    id: string;
    name: string;
    filter: TaskFilter;
  }>;
  
  // Task actions
  fetchTasks: () => Promise<Task[]>;
  getTaskById: (id: string) => Promise<Task | null>;
  createTask: (task: CreateTaskInput) => Promise<Task | null>;
  updateTask: (id: string, task: UpdateTaskInput) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  selectTask: (task: Task | null) => void;
  search: (query: string) => Promise<Task[]>;
  
  // Status/assignment actions
  updateTaskStatus: (id: string, status: string) => Promise<Task | null>;
  updateTaskAssignee: (id: string, assigneeId: string | null) => Promise<Task | null>;
  
  // Time tracking
  startTimeTracking: (id: string) => Promise<Task | null>;
  stopTimeTracking: (id: string) => Promise<Task | null>;
  
  // Template actions
  saveAsTemplate: (taskId: string, templateName: string, isPublic?: boolean) => Promise<{ id: string; name: string; template: unknown } | null>;
  createFromTemplate: (templateId: string, taskData: Partial<Task>) => Promise<Task | null>;
  
  // Filter actions
  setFilters: (filters: TaskFilter) => void;
  resetFilters: () => void;
  saveFilter: (name: string, filter: TaskFilter) => void;
  applySavedFilter: (id: string) => void;
  applyFilterToTasks: () => void;
  
  // Error handling
  clearError: () => void;
}

export const useTaskStore = create<TaskState>()(
  devtools(
    (set, get) => ({
      // Initial state
      tasks: [],
      filteredTasks: [],
      selectedTask: null,
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,
      filters: {},
      savedFilters: [],
      
      // Fetch all tasks
      fetchTasks: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.tasks.getAll();
          
          if (response.error) {
            set({ isLoading: false, error: response.error });
            return [];
          }
          
          const tasks = (response.data as Task[]) || [];
          set({ tasks, filteredTasks: tasks, isLoading: false });
          
          // Apply filters if they exist
          if (Object.keys(get().filters).length > 0) {
            get().applyFilterToTasks();
          }
          
          return tasks;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks';
          set({ isLoading: false, error: errorMessage });
          return [];
        }
      },
      
      // Get task by ID
      getTaskById: async (id) => {
        set({ isLoading: true, error: null });
        
        try {
          // First check if we already have the task with full details
          const existingTask = get().selectedTask;
          if (existingTask && (existingTask as Task).id === id) {
            set({ isLoading: false });
            return existingTask;
          }
          
          const response = await api.tasks.getById(id);
          
          if (response.error) {
            set({ isLoading: false, error: response.error });
            return null;
          }
          
          const task = response.data as Task;
          set({ selectedTask: task, isLoading: false });
          return task;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to get task';
          set({ isLoading: false, error: errorMessage });
          return null;
        }
      },
      
      // Create a new task
      createTask: async (task) => {
        set({ isCreating: true, error: null });
        
        try {
          const response = await api.tasks.create(task);
          
          if (response.error) {
            set({ isCreating: false, error: response.error });
            return null;
          }
          
          const newTask = response.data as Task;
          set(state => ({
            tasks: [...state.tasks, newTask],
            isCreating: false
          }));
          
          // Apply filters to update filtered tasks
          get().applyFilterToTasks();
          
          return newTask;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
          set({ isCreating: false, error: errorMessage });
          return null;
        }
      },
      
      // Update an existing task
      updateTask: async (id, task) => {
        set({ isUpdating: true, error: null });
        
        try {
          const response = await api.tasks.update(id, task);
          
          if (response.error) {
            set({ isUpdating: false, error: response.error });
            return null;
          }
          
          const updatedTask = response.data as Task;
          set(state => ({
            tasks: state.tasks.map(t => (t as Task).id === id ? { ...t, ...updatedTask } : t),
            selectedTask: state.selectedTask && (state.selectedTask as Task).id === id ? { ...state.selectedTask, ...updatedTask } : state.selectedTask,
            isUpdating: false
          }));
          
          // Apply filters to update filtered tasks
          get().applyFilterToTasks();
          
          return updatedTask;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
          set({ isUpdating: false, error: errorMessage });
          return null;
        }
      },
      
      // Delete a task
      deleteTask: async (id) => {
        set({ isDeleting: true, error: null });
        
        try {
          const response = await api.tasks.delete(id);
          
          if (response.error) {
            set({ isDeleting: false, error: response.error });
            return false;
          }
          
          set(state => ({
            tasks: state.tasks.filter(t => t.id !== id),
            filteredTasks: state.filteredTasks.filter(t => t.id !== id),
            selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
            isDeleting: false
          }));
          
          return true;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
          set({ isDeleting: false, error: errorMessage });
          return false;
        }
      },
      
      // Set selected task
      selectTask: (task) => {
        set({ selectedTask: task });
      },
      
      // Search for tasks
      search: async (query) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.tasks.search(query);
          
          if (response.error) {
            set({ isLoading: false, error: response.error });
            return [];
          }
          
          const searchResults = response.data || [];
          set({ isLoading: false });
          return searchResults;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to search tasks';
          set({ isLoading: false, error: errorMessage });
          return [];
        }
      },
      
      // Update task status
      updateTaskStatus: async (id, status) => {
        set({ isUpdating: true, error: null });
        
        try {
          const response = await api.tasks.updateStatus(id, status);
          
          if (response.error) {
            set({ isUpdating: false, error: response.error });
            return null;
          }
          
          const updatedTask = response.data as Task;
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, status: status as TaskStatus, updatedAt: updatedTask.updatedAt || new Date().toISOString() } : t),
            selectedTask: state.selectedTask?.id === id ? { ...state.selectedTask, status: status as TaskStatus, updatedAt: updatedTask.updatedAt || new Date().toISOString() } : state.selectedTask,
            isUpdating: false
          }));
          
          // Apply filters to update filtered tasks
          get().applyFilterToTasks();
          
          return { ...updatedTask, status } as Task;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to update task status';
          set({ isUpdating: false, error: errorMessage });
          return null;
        }
      },
      
      // Update task assignee
      updateTaskAssignee: async (id, assigneeId) => {
        set({ isUpdating: true, error: null });
        
        try {
          const response = await api.tasks.updateAssignee(id, assigneeId);
          
          if (response.error) {
            set({ isUpdating: false, error: response.error });
            return null;
          }
          
          const updatedTask = response.data as Task;
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, assigneeId, updatedAt: updatedTask.updatedAt } : t),
            selectedTask: state.selectedTask?.id === id ? { ...state.selectedTask, assigneeId, updatedAt: updatedTask.updatedAt } : state.selectedTask,
            isUpdating: false
          }));
          
          // Apply filters to update filtered tasks
          get().applyFilterToTasks();
          
          return { ...updatedTask, assigneeId } as Task;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to update task assignee';
          set({ isUpdating: false, error: errorMessage });
          return null;
        }
      },
      
      // Start time tracking
      startTimeTracking: async (id) => {
        set({ isUpdating: true, error: null });
        
        try {
          const response = await api.tasks.startTimeTracking(id);
          
          if (response.error) {
            set({ isUpdating: false, error: response.error });
            return null;
          }
          
          const updatedTask = response.data as Task;
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { 
              ...t, 
              timeTrackingActive: true,
              trackingStartTime: (updatedTask as Task & { trackingStartTime?: string }).trackingStartTime 
            } : t),
            selectedTask: state.selectedTask?.id === id ? { 
              ...state.selectedTask, 
              timeTrackingActive: true,
              trackingStartTime: (updatedTask as Task & { trackingStartTime?: string }).trackingStartTime 
            } : state.selectedTask,
            isUpdating: false
          }));
          
          return updatedTask;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to start time tracking';
          set({ isUpdating: false, error: errorMessage });
          return null;
        }
      },
      
      // Stop time tracking
      stopTimeTracking: async (id) => {
        set({ isUpdating: true, error: null });
        
        try {
          const response = await api.tasks.stopTimeTracking(id);
          
          if (response.error) {
            set({ isUpdating: false, error: response.error });
            return null;
          }
          
          const updatedTask = response.data as Task;
          set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { 
              ...t, 
              timeTrackingActive: false,
              trackingStartTime: null,
              trackingTimeSeconds: (updatedTask as Task & { trackingTimeSeconds?: number }).trackingTimeSeconds
            } : t),
            selectedTask: state.selectedTask?.id === id ? { 
              ...state.selectedTask, 
              timeTrackingActive: false,
              trackingStartTime: null,
              trackingTimeSeconds: (updatedTask as Task & { trackingTimeSeconds?: number }).trackingTimeSeconds
            } : state.selectedTask,
            isUpdating: false
          }));
          
          return updatedTask;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to stop time tracking';
          set({ isUpdating: false, error: errorMessage });
          return null;
        }
      },
      
      // Save task as template
      saveAsTemplate: async (taskId, templateName, isPublic = true) => {
        set({ isUpdating: true, error: null });
        
        try {
          const response = await api.tasks.saveAsTemplate(taskId, templateName, isPublic);
          
          if (response.error) {
            set({ isUpdating: false, error: response.error });
            return null;
          }
          
          set({ isUpdating: false });
          return response.data;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to save as template';
          set({ isUpdating: false, error: errorMessage });
          return null;
        }
      },
      
      // Create task from template
      createFromTemplate: async (templateId, taskData) => {
        set({ isCreating: true, error: null });
        
        try {
          const response = await api.tasks.createFromTemplate(templateId, taskData);
          
          if (response.error) {
            set({ isCreating: false, error: response.error });
            return null;
          }
          
          const newTask = response.data as Task;
          set(state => ({
            tasks: [...state.tasks, newTask],
            isCreating: false
          }));
          
          // Apply filters to update filtered tasks
          get().applyFilterToTasks();
          
          return newTask;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to create from template';
          set({ isCreating: false, error: errorMessage });
          return null;
        }
      },
      
      // Set filters
      setFilters: (filters) => {
        set({ filters });
        get().applyFilterToTasks();
      },
      
      // Reset filters
      resetFilters: () => {
        set({ filters: {} });
        set(state => ({ filteredTasks: state.tasks }));
      },
      
      // Save filter preset
      saveFilter: (name, filter) => {
        set(state => ({
          savedFilters: [
            ...state.savedFilters,
            {
              id: `filter-${Date.now()}`,
              name,
              filter
            }
          ]
        }));
      },
      
      // Apply saved filter
      applySavedFilter: (id) => {
        const { savedFilters } = get();
        const savedFilter = savedFilters.find(f => f.id === id);
        
        if (savedFilter) {
          set({ filters: savedFilter.filter });
          get().applyFilterToTasks();
        }
      },
      
      // Apply current filters to tasks
      applyFilterToTasks: () => {
        const { tasks, filters } = get();
        
        if (Object.keys(filters).length === 0) {
          set({ filteredTasks: tasks });
          return;
        }
        
        const filtered = tasks.filter(task => {
          // Filter by status
          if (filters.status && filters.status.length > 0) {
            if (!task.status || !filters.status.includes(task.status)) {
              return false;
            }
          }
          
          // Filter by priority
          if (filters.priority && filters.priority.length > 0) {
            if (!task.priority || !filters.priority.includes(task.priority)) {
              return false;
            }
          }
          
          // Filter by assignee
          if (filters.assigneeId && filters.assigneeId.length > 0) {
            if (!task.assigneeId || !filters.assigneeId.includes(task.assigneeId)) {
              return false;
            }
          }
          
          // Filter by tags
          if (filters.tags && filters.tags.length > 0 && task.tags) {
            if (!task.tags || !task.tags.some(tag => filters.tags!.includes(tag))) {
              return false;
            }
          }
          
          // Filter by search text
          if (filters.search && filters.search.trim() !== '') {
            const searchLower = filters.search.toLowerCase();
            const titleMatch = task.title.toLowerCase().includes(searchLower);
            const descriptionMatch = task.description?.toLowerCase().includes(searchLower) || false;
            const tagMatch = task.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false;
            
            if (!titleMatch && !descriptionMatch && !tagMatch) {
              return false;
            }
          }
          
          // Filter by due date range
          if (filters.dueDate) {
            if (task.dueDate) {
              const taskDueDate = new Date(task.dueDate);
              
              // Check lower bound
              if (filters.dueDate.from && taskDueDate < filters.dueDate.from) {
                return false;
              }
              
              // Check upper bound
              if (filters.dueDate.to && taskDueDate > filters.dueDate.to) {
                return false;
              }
            } else if (filters.dueDate.from || filters.dueDate.to) {
              // If we're filtering by date and task has no due date, exclude it
              return false;
            }
          }
          
          // Task passed all filters
          return true;
        });
        
        set({ filteredTasks: filtered });
      },
      
      // Clear error
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'task-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

// Don't automatically initialize - let components decide when to fetch
// This prevents unauthorized API calls on app startup