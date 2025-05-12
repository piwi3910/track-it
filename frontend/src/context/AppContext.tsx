import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Task, User, TaskFilter, TaskTemplate } from '@track-it/shared';
import { api } from '@/api';

interface AppContextType {
  // User
  currentUser: User | null;
  userLoading: boolean;

  // Tasks
  tasks: Task[];
  tasksLoading: boolean;
  selectedTask: Task | null;

  // Filters
  filters: TaskFilter;
  savedFilters: { id: string; name: string; filter: TaskFilter }[];

  // Templates
  templates: TaskTemplate[];
  templatesLoading: boolean;
  selectedTemplate: TaskTemplate | null;

  // Task Actions
  fetchTasks: () => Promise<void>;
  getTaskById: (id: string) => Promise<Task | null>;
  createTask: (task: Omit<Task, 'id'>) => Promise<Task | null>;
  updateTask: (id: string, task: Partial<Task>) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  selectTask: (task: Task | null) => void;

  // Template Actions
  fetchTemplates: () => Promise<void>;
  getTemplateById: (id: string) => Promise<TaskTemplate | null>;
  createTemplate: (template: Omit<TaskTemplate, 'id' | 'createdAt' | 'usageCount'>) => Promise<TaskTemplate | null>;
  updateTemplate: (id: string, template: Partial<TaskTemplate>) => Promise<TaskTemplate | null>;
  deleteTemplate: (id: string) => Promise<boolean>;
  selectTemplate: (template: TaskTemplate | null) => void;
  saveTaskAsTemplate: (taskId: string, templateName: string, isPublic?: boolean) => Promise<TaskTemplate | null>;
  createTaskFromTemplate: (templateId: string, taskData: Partial<Task>) => Promise<Task | null>;

  // Filters
  setFilters: (filters: TaskFilter) => void;
  resetFilters: () => void;
  saveFilter: (name: string, filter: TaskFilter) => void;
  applySavedFilter: (id: string) => void;

  // Search
  searchTasks: (query: string) => Promise<Task[]>;
  searchTemplates: (query: string) => Promise<TaskTemplate[]>;
  getTemplateCategories: () => Promise<string[]>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

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
  
  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data, error } = await api.auth.getCurrentUser();
        if (data && !error) {
          setCurrentUser(data);
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
      } finally {
        setUserLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);
  
  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const { data, error } = await api.tasks.getAll();
      if (data && !error) {
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  }, []);
  
  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const { data, error } = await api.templates.getAll();
      if (data && !error) {
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);
  
  // Get task by ID
  const getTaskById = useCallback(async (id: string) => {
    try {
      const { data, error } = await api.tasks.getById(id);
      if (error) return null;
      return data;
    } catch (error) {
      console.error('Failed to get task:', error);
      return null;
    }
  }, []);
  
  // Create a new task
  const createTask = useCallback(async (task: Omit<Task, 'id'>) => {
    try {
      const { data, error } = await api.tasks.create(task);
      if (error) throw new Error(error);

      // Update local tasks state
      if (data) {
        setTasks(prev => [...prev, data]);
      }
      return data;
    } catch (error) {
      console.error('Failed to create task:', error);
      return null;
    }
  }, []);
  
  // Update an existing task
  const updateTask = useCallback(async (id: string, task: Partial<Task>) => {
    try {
      const { data, error } = await api.tasks.update(id, task);
      if (error) throw new Error(error);

      // Update local tasks state
      if (data) {
        setTasks(prev => prev.map(t => t.id === id ? data : t));

        // Update selectedTask if it's the one being edited
        if (selectedTask?.id === id) {
          setSelectedTask(data);
        }
      }
      return data;
    } catch (error) {
      console.error('Failed to update task:', error);
      return null;
    }
  }, [selectedTask]);
  
  // Delete a task
  const deleteTask = useCallback(async (id: string) => {
    try {
      const { error } = await api.tasks.delete(id);
      if (error) throw new Error(error);

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
  }, [selectedTask]);
  
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
  }, [savedFilters]);
  
  // Search tasks
  const searchTasks = useCallback(async (query: string) => {
    try {
      const { data, error } = await api.tasks.search(query);
      if (error) throw new Error(error);
      return data || [];
    } catch (error) {
      console.error('Failed to search tasks:', error);
      return [];
    }
  }, []);
  
  // Get template by ID
  const getTemplateById = useCallback(async (id: string) => {
    try {
      const { data, error } = await api.templates.getById(id);
      if (error) return null;
      return data;
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
        setTemplates(prev => [...prev, data]);
      }
      return data;
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
        setTemplates(prev => prev.map(t => t.id === id ? data : t));

        // Update selectedTemplate if it's the one being edited
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(data);
        }
      }
      return data;
    } catch (error) {
      console.error('Failed to update template:', error);
      return null;
    }
  }, [selectedTemplate]);

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
  }, [selectedTemplate]);

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
        setTemplates(prev => [...prev, data]);
      }
      return data;
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
        setTasks(prev => [...prev, data]);
      }
      return data;
    } catch (error) {
      console.error('Failed to create task from template:', error);
      return null;
    }
  }, []);

  // Search templates
  const searchTemplates = useCallback(async (query: string) => {
    try {
      const { data, error } = await api.templates.search(query);
      if (error) throw new Error(error);
      return data || [];
    } catch (error) {
      console.error('Failed to search templates:', error);
      return [];
    }
  }, []);

  // Get all template categories
  const getTemplateCategories = useCallback(async () => {
    try {
      const { data, error } = await api.templates.getCategories();
      if (error) throw new Error(error);
      return data || [];
    } catch (error) {
      console.error('Failed to get template categories:', error);
      return [];
    }
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
    getTemplateCategories
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Hook moved to /src/hooks/useApp.ts