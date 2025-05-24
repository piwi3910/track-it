// Properly typed Context for the Track-It application
import { useState, useCallback, useEffect, ReactNode } from 'react';
import { Task, User, TaskTemplate } from '@track-it/shared/types/trpc';
import { TaskFilter } from '@track-it/shared/types';
import { api } from '@/api';
import { authService } from '@/services/auth.service';
import { AppContext } from './AppContext.types';

export function AppProvider({ children }: { children: ReactNode }) {
  // User state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Templates state
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);

  // Filters state
  const [filters, setFilters] = useState<TaskFilter>({});
  const [savedFilters, setSavedFilters] = useState<{ id: string; name: string; filter: TaskFilter }[]>([]);
  
  // Fetch current user on mount or when token changes
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // Use auth service to get current user
        if (!authService.isAuthenticated()) {
          setCurrentUser(null);
          setUserLoading(false);
          return;
        }

        const { data, error } = await authService.getCurrentUser();
        if (data && !error) {
          setCurrentUser(data as User);
        } else {
          // If error, clear token and user
          authService.clearToken();
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        // Clear token on error
        authService.clearToken();
        setCurrentUser(null);
      } finally {
        setUserLoading(false);
      }
    };

    fetchCurrentUser();

    // Listen for storage events (e.g. if token is updated in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        fetchCurrentUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      // Use real tRPC API
      const { data, error } = await api.tasks.getAll();
      if (error) {
        console.error('Failed to fetch tasks:', error);
      } else if (data) {
        setTasks(data as unknown as Task[]);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      // Handle both mock API and real tRPC API patterns
      if (typeof api.templates.getAll === 'function') {
        // Mock API style
        const result = await api.templates.getAll();
        if (Array.isArray(result)) {
          setTemplates(result);
        }
      } else {
        console.error('Templates API not available');
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  // Fetch templates on mount only if authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      fetchTemplates();
    }
  }, [fetchTemplates]);

  // Fetch tasks on mount only if authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      fetchTasks();
    }
  }, [fetchTasks]);

  // Listen for auth state changes - separate effect after functions are defined
  useEffect(() => {
    const handleAuthStateChange = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.isAuthenticated) {
        // User just logged in, refetch data
        fetchTasks();
        fetchTemplates();
      } else if (event instanceof CustomEvent && event.detail?.isAuthenticated === false) {
        // User logged out, clear data
        setTasks([]);
        setTemplates([]);
      }
    };

    window.addEventListener('auth_state_change', handleAuthStateChange);

    return () => {
      window.removeEventListener('auth_state_change', handleAuthStateChange);
    };
  }, [fetchTasks, fetchTemplates]);
  
  // Get task by ID
  const getTaskById = useCallback(async (id: string) => {
    try {
      // Check if the task is already in our local state
      const localTask = tasks.find(task => task.id === id);
      if (localTask) return localTask;
      
      // Otherwise fetch from API
      const { data, error } = await api.tasks.getById(id);
      if (error) {
        console.error('Failed to get task by ID:', error);
        return null;
      }
      return data as unknown as Task;
    } catch (error) {
      console.error('Failed to get task:', error);
      return null;
    }
  }, [tasks]); // Depends on tasks for local lookup
  
  // Create a new task
  const createTask = useCallback(async (task: Omit<Task, 'id'>) => {
    try {
      const { data, error } = await api.tasks.create(task);
      if (error) {
        console.error('Failed to create task:', error);
        return null;
      }

      // Update local tasks state
      if (data) {
        setTasks(prev => [...prev, data as unknown as Task]);
      }
      return data as unknown as Task;
    } catch (error) {
      console.error('Failed to create task:', error);
      return null;
    }
  }, []);
  
  // Update an existing task
  const updateTask = useCallback(async (id: string, task: Partial<Task>) => {
    try {
      const { data, error } = await api.tasks.update(id, task);
      if (error) {
        console.error('Failed to update task:', error);
        return null;
      }

      // Update local tasks state
      if (data) {
        setTasks(prev => prev.map(t => t.id === id ? (data as unknown as Task) : t));

        // Update selectedTask if it's the one being edited
        if (selectedTask?.id === id) {
          setSelectedTask(data as unknown as Task);
        }
      }
      return data as unknown as Task;
    } catch (error) {
      console.error('Failed to update task:', error);
      return null;
    }
  }, [selectedTask]); // Depends on selectedTask for conditional update
  
  // Delete a task
  const deleteTask = useCallback(async (id: string) => {
    try {
      const { error } = await api.tasks.delete(id);
      if (error) {
        console.error('Failed to delete task:', error);
        return false;
      }

      // Update local tasks state
      setTasks(prev => prev.filter(t => t.id !== id));

      // Clear selectedTask if it's the one being deleted
      if (selectedTask?.id === id) {
        setSelectedTask(null);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete task:', error);
      return false;
    }
  }, [selectedTask]); // Depends on selectedTask for conditional nulling
  
  // Select a task
  const selectTask = useCallback((task: Task | null) => {
    setSelectedTask(task);
  }, []);
  
  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);
  
  // Save a filter
  const saveFilter = useCallback((name: string, filter: TaskFilter) => {
    setSavedFilters(prev => [
      ...prev,
      {
        id: `filter-${Date.now()}`,
        name,
        filter
      }
    ]);
  }, []);
  
  // Apply a saved filter
  const applySavedFilter = useCallback((id: string) => {
    const savedFilter = savedFilters.find(f => f.id === id);
    if (savedFilter) {
      setFilters(savedFilter.filter);
    }
  }, [savedFilters]); // Depends on savedFilters for lookup
  
  // Search tasks
  const searchTasks = useCallback(async (query: string) => {
    try {
      // Use the tRPC API search function
      const { data, error } = await api.tasks.search(query);
      if (error) {
        console.error('Search API error:', error);
        throw new Error(typeof error === 'string' ? error : (error as Error).message || 'Search failed');
      }
      return (data || []) as Task[];
    } catch (error) {
      console.error('Failed to search tasks:', error);
      
      // Fallback to filtering existing tasks in memory
      return tasks.filter(task => 
        task.title.toLowerCase().includes(query.toLowerCase()) || 
        (task.description && task.description.toLowerCase().includes(query.toLowerCase())) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
      );
    }
  }, [tasks]); // Depends on tasks for fallback local filtering
  
  // Get template by ID
  const getTemplateById = useCallback(async (id: string) => {
    try {
      const { data, error } = await api.templates.getById(id);
      if (error) return null;
      return data as unknown as TaskTemplate;
    } catch (error) {
      console.error('Failed to get template:', error);
      return null;
    }
  }, []);

  // Create a new template
  const createTemplate = useCallback(async (template: Omit<TaskTemplate, 'id' | 'createdAt' | 'usageCount'>) => {
    try {
      const { data, error } = await api.templates.create(template);
      if (error) throw new Error(error);

      // Update local templates state
      if (data) {
        setTemplates(prev => [...prev, data as unknown as TaskTemplate]);
      }
      return data as unknown as TaskTemplate;
    } catch (error) {
      console.error('Failed to create template:', error);
      return null;
    }
  }, []);

  // Update an existing template
  const updateTemplate = useCallback(async (id: string, template: Partial<TaskTemplate>) => {
    try {
      const { data, error } = await api.templates.update(id, template);
      if (error) throw new Error(error);

      // Update local templates state
      if (data) {
        setTemplates(prev => prev.map(t => t.id === id ? (data as unknown as TaskTemplate) : t));

        // Update selectedTemplate if it's the one being edited
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(data as unknown as TaskTemplate);
        }
      }
      return data as unknown as TaskTemplate;
    } catch (error) {
      console.error('Failed to update template:', error);
      return null;
    }
  }, [selectedTemplate]); // Depends on selectedTemplate for conditional updates

  // Delete a template
  const deleteTemplate = useCallback(async (id: string) => {
    try {
      const { error } = await api.templates.delete(id);
      if (error) throw new Error(error);

      // Update local templates state
      setTemplates(prev => prev.filter(t => t.id !== id));

      // Clear selectedTemplate if it's the one being deleted
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete template:', error);
      return false;
    }
  }, [selectedTemplate]); // Depends on selectedTemplate for conditional nulling

  // Select a template
  const selectTemplate = useCallback((template: TaskTemplate | null) => {
    setSelectedTemplate(template);
  }, []);

  // Save a task as a template
  const saveTaskAsTemplate = useCallback(async (taskId: string, templateName: string, isPublic = true) => {
    try {
      const { data, error } = await api.tasks.saveAsTemplate(taskId, templateName, isPublic);
      if (error) throw new Error(error);

      // Update local templates state
      if (data) {
        setTemplates(prev => [...prev, data as TaskTemplate]);
      }
      return data as TaskTemplate;
    } catch (error) {
      console.error('Failed to save task as template:', error);
      return null;
    }
  }, []);

  // Create a task from a template
  const createTaskFromTemplate = useCallback(async (templateId: string, taskData: Partial<Task>) => {
    try {
      const { data, error } = await api.tasks.createFromTemplate(templateId, taskData);
      if (error) throw new Error(error);

      // Update local tasks state
      if (data) {
        setTasks(prev => [...prev, data as unknown as Task]);
      }
      return data as unknown as Task;
    } catch (error) {
      console.error('Failed to create task from template:', error);
      return null;
    }
  }, []);

  // Search templates
  const searchTemplates = useCallback(async (query: string) => {
    try {
      // Handle both mock API and real tRPC API patterns
      if (typeof api.templates.search === 'function') {
        // Mock API style
        const result = await api.templates.search(query);
        return Array.isArray(result) ? result : [];
      } else if (api.templates.search && typeof (api.templates.search as { query?: (...args: unknown[]) => unknown }).query === 'function') {
        // Real tRPC API style
        const { data, error } = await (api.templates.search as { query: (q: string) => Promise<{ data?: unknown; error?: unknown }> }).query(query);
        if (error) throw new Error(typeof error === 'string' ? error : (error as Error).message || 'Search failed');
        return (data || []) as TaskTemplate[];
      } else {
        // Fallback to filtering existing templates in memory
        console.warn('Search API not available, filtering in-memory templates');
        return templates.filter(template => 
          template.name.toLowerCase().includes(query.toLowerCase()) || 
          (template.description && template.description.toLowerCase().includes(query.toLowerCase())) ||
          (template.category && template.category.toLowerCase().includes(query.toLowerCase()))
        );
      }
    } catch (error) {
      console.error('Failed to search templates:', error);
      return [];
    }
  }, [templates]); // Depends on templates for fallback filtering

  // Get all template categories
  const getTemplateCategories = useCallback(async () => {
    try {
      const { data, error } = await api.templates.getCategories();
      if (error) throw new Error(error);
      return (data || []) as string[];
    } catch (error) {
      console.error('Failed to get template categories:', error);
      return [];
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    // Use auth service to logout
    authService.logout();

    // Clear user state
    setCurrentUser(null);

    // Clear other state if needed
    setTasks([]);
    setTemplates([]);
    setSelectedTask(null);
    setSelectedTemplate(null);

    // Redirect to login (handled by protected route)
  }, []);

  const value = {
    currentUser,
    userLoading,
    tasks,
    tasksLoading,
    selectedTask,
    templates,
    templatesLoading,
    selectedTemplate,
    filters,
    savedFilters,
    fetchTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    selectTask,
    fetchTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    selectTemplate,
    saveTaskAsTemplate,
    createTaskFromTemplate,
    setFilters,
    resetFilters,
    saveFilter,
    applySavedFilter,
    searchTasks,
    searchTemplates,
    getTemplateCategories,
    logout
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Hook moved to /src/hooks/useApp.ts