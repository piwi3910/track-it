import { createContext } from 'react';
import { Task, User, TaskTemplate } from '@track-it/shared';
import { TaskFilter } from '@track-it/shared/types';

export interface AppContextType {
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

export const AppContext = createContext<AppContextType & { logout: () => void } | undefined>(undefined);