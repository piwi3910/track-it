import { create } from 'zustand';
import { api } from '@/api';
import type { RouterOutputs, RouterInputs } from '@track-it/shared';

// Types
type Template = RouterOutputs['templates']['getAll'][0];
type CreateTemplateInput = RouterInputs['templates']['create'][0];
type UpdateTemplateInput = RouterInputs['templates']['update'][0]['data'];

interface TemplateState {
  // Templates data
  templates: Template[];
  categories: string[];
  selectedTemplate: Template | null;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  
  // Template actions
  fetchTemplates: () => Promise<Template[]>;
  fetchCategories: () => Promise<string[]>;
  getTemplateById: (id: string) => Promise<Template | null>;
  getTemplatesByCategory: (category: string) => Promise<Template[]>;
  createTemplate: (template: CreateTemplateInput) => Promise<Template | null>;
  updateTemplate: (id: string, template: UpdateTemplateInput) => Promise<Template | null>;
  deleteTemplate: (id: string) => Promise<boolean>;
  selectTemplate: (template: Template | null) => void;
  search: (query: string) => Promise<Template[]>;
  
  // Error handling
  clearError: () => void;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  // Initial state
  templates: [],
  categories: [],
  selectedTemplate: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  
  // Fetch all templates
  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.templates.getAll();
      
      if (response.error) {
        set({ isLoading: false, error: response.error });
        return [];
      }
      
      const templates = response.data || [];
      set({ templates, isLoading: false });
      
      return templates;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch templates';
      set({ isLoading: false, error: errorMessage });
      return [];
    }
  },
  
  // Fetch all template categories
  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.templates.getCategories();
      
      if (response.error) {
        set({ isLoading: false, error: response.error });
        return [];
      }
      
      const categories = response.data || [];
      set({ categories, isLoading: false });
      
      return categories;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch template categories';
      set({ isLoading: false, error: errorMessage });
      return [];
    }
  },
  
  // Get template by ID
  getTemplateById: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      // First check if we already have the template in state
      const existingTemplate = get().selectedTemplate;
      if (existingTemplate && existingTemplate.id === id) {
        set({ isLoading: false });
        return existingTemplate;
      }
      
      const response = await api.templates.getById(id);
      
      if (response.error) {
        set({ isLoading: false, error: response.error });
        return null;
      }
      
      const template = response.data;
      set({ selectedTemplate: template, isLoading: false });
      return template;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get template';
      set({ isLoading: false, error: errorMessage });
      return null;
    }
  },
  
  // Get templates by category
  getTemplatesByCategory: async (category) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.templates.getByCategory(category);
      
      if (response.error) {
        set({ isLoading: false, error: response.error });
        return [];
      }
      
      set({ isLoading: false });
      return response.data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get templates by category';
      set({ isLoading: false, error: errorMessage });
      return [];
    }
  },
  
  // Create a new template
  createTemplate: async (template) => {
    set({ isCreating: true, error: null });
    
    try {
      const response = await api.templates.create(template);
      
      if (response.error) {
        set({ isCreating: false, error: response.error });
        return null;
      }
      
      const newTemplate = response.data as Template;
      set(state => ({
        templates: [...state.templates, newTemplate],
        isCreating: false
      }));
      
      // Add new category if it doesn't exist yet
      if (template.category && !get().categories.includes(template.category)) {
        set(state => ({
          categories: [...state.categories, template.category!]
        }));
      }
      
      return newTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template';
      set({ isCreating: false, error: errorMessage });
      return null;
    }
  },
  
  // Update an existing template
  updateTemplate: async (id, template) => {
    set({ isUpdating: true, error: null });
    
    try {
      const response = await api.templates.update(id, template);
      
      if (response.error) {
        set({ isUpdating: false, error: response.error });
        return null;
      }
      
      const updatedTemplate = response.data as Template;
      set(state => ({
        templates: state.templates.map(t => t.id === id ? { ...t, ...updatedTemplate } : t),
        selectedTemplate: state.selectedTemplate?.id === id ? { ...state.selectedTemplate, ...updatedTemplate } : state.selectedTemplate,
        isUpdating: false
      }));
      
      // Add new category if it doesn't exist yet
      if (template.category && !get().categories.includes(template.category)) {
        set(state => ({
          categories: [...state.categories, template.category!]
        }));
      }
      
      return updatedTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update template';
      set({ isUpdating: false, error: errorMessage });
      return null;
    }
  },
  
  // Delete a template
  deleteTemplate: async (id) => {
    set({ isDeleting: true, error: null });
    
    try {
      const response = await api.templates.delete(id);
      
      if (response.error) {
        set({ isDeleting: false, error: response.error });
        return false;
      }
      
      set(state => ({
        templates: state.templates.filter(t => t.id !== id),
        selectedTemplate: state.selectedTemplate?.id === id ? null : state.selectedTemplate,
        isDeleting: false
      }));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template';
      set({ isDeleting: false, error: errorMessage });
      return false;
    }
  },
  
  // Set selected template
  selectTemplate: (template) => {
    set({ selectedTemplate: template });
  },
  
  // Search for templates
  search: async (query) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await api.templates.search(query);
      
      if (response.error) {
        set({ isLoading: false, error: response.error });
        return [];
      }
      
      set({ isLoading: false });
      return response.data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search templates';
      set({ isLoading: false, error: errorMessage });
      return [];
    }
  },
  
  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));

// Initialize templates when the store is first created
if (typeof window !== 'undefined') {
  // Run after auth is loaded
  setTimeout(() => {
    const store = useTemplateStore.getState();
    Promise.all([
      store.fetchTemplates(),
      store.fetchCategories()
    ]).catch(console.error);
  }, 600);
}