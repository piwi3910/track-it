import { useAppStore } from './useAppStore';

export function useApp() {
  // Use the Zustand store directly
  // This maintains the same API surface as the original context-based implementation
  const store = useAppStore();
  
  // Return the store state in the same shape as the original AppContext
  return {
    // User
    currentUser: store.currentUser,
    userLoading: store.userLoading,
    
    // Tasks
    tasks: store.tasks,
    tasksLoading: store.tasksLoading,
    selectedTask: store.selectedTask,
    
    // Templates
    templates: store.templates,
    templatesLoading: store.templatesLoading,
    selectedTemplate: store.selectedTemplate,
    
    // Filters
    filters: store.filters,
    savedFilters: store.savedFilters,
    
    // Task Actions
    fetchTasks: store.fetchTasks,
    getTaskById: store.getTaskById,
    createTask: store.createTask,
    updateTask: store.updateTask,
    deleteTask: store.deleteTask,
    selectTask: store.selectTask,
    
    // Template Actions
    fetchTemplates: store.fetchTemplates,
    getTemplateById: store.getTemplateById,
    createTemplate: store.createTemplate,
    updateTemplate: store.updateTemplate,
    deleteTemplate: store.deleteTemplate,
    selectTemplate: store.selectTemplate,
    saveTaskAsTemplate: store.saveTaskAsTemplate,
    createTaskFromTemplate: store.createTaskFromTemplate,
    
    // Filter Actions
    setFilters: store.setFilters,
    resetFilters: store.resetFilters,
    saveFilter: store.saveFilter,
    applySavedFilter: store.applySavedFilter,
    
    // Search Actions
    searchTasks: store.searchTasks,
    searchTemplates: store.searchTemplates,
    getTemplateCategories: store.getTemplateCategories,
    
    // Auth Actions
    logout: store.logout
  };
}