/**
 * Central hook for accessing all stores
 * This provides a unified way to access all state in the app
 */

import {
  useThemeStore,
  useApiStore, 
  useAuthStore, 
  useTaskStore,
  useTemplateStore,
  useNotificationStore,
  useGoogleStore
} from '@/stores';

export function useStore() {
  // Theme
  const {
    colorScheme,
    toggleColorScheme,
    isDark,
    colors,
    spacing,
    borderRadius,
    shadows,
    typography,
    getStatusColor,
    getPriorityColor
  } = useThemeStore();
  
  // API Status
  const {
    apiAvailable,
    isApiLoading: isApiStatusLoading,
    apiError,
    isMockApi,
    useMockApi,
    checkApiAvailability,
    connectionAttempts,
    recentErrors,
    lastChecked,
    setApiAvailable,
    setApiError,
    clearErrors: clearApiErrors
  } = useApiStore();
  
  // Auth
  const {
    user,
    isLoading: isAuthLoading,
    error: authError,
    isAuthenticated,
    login,
    register,
    logout,
    loadUser,
    clearError: clearAuthError
  } = useAuthStore();
  
  // Tasks
  const {
    tasks,
    filteredTasks,
    selectedTask,
    isLoading: isTasksLoading,
    isCreating: isTaskCreating,
    isUpdating: isTaskUpdating,
    isDeleting: isTaskDeleting,
    error: taskError,
    filters,
    savedFilters,
    fetchTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    selectTask,
    updateTaskStatus,
    updateTaskAssignee,
    startTimeTracking,
    stopTimeTracking,
    saveAsTemplate,
    createFromTemplate,
    setFilters,
    resetFilters,
    saveFilter,
    applySavedFilter,
    clearError: clearTaskError
  } = useTaskStore();
  
  // Templates
  const {
    templates,
    categories,
    selectedTemplate,
    isLoading: isTemplatesLoading,
    error: templateError,
    fetchTemplates,
    fetchCategories,
    getTemplateById,
    getTemplatesByCategory,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    selectTemplate,
    clearError: clearTemplateError
  } = useTemplateStore();
  
  // Notifications
  const {
    notifications,
    unreadCount,
    isLoading: isNotificationsLoading,
    error: notificationError,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    clearError: clearNotificationError
  } = useNotificationStore();
  
  // Google Integration
  const {
    connected: googleConnected,
    connectedEmail: googleEmail,
    isLoading: isGoogleLoading,
    error: googleError,
    driveFiles,
    googleTasks,
    lastSyncTime,
    syncInProgress,
    getAccountStatus,
    linkAccount,
    unlinkAccount,
    fetchDriveFiles,
    importGoogleTasks,
    syncCalendar,
    clearError: clearGoogleError
  } = useGoogleStore();
  
  // Loading state
  const isLoading = 
    isAuthLoading || 
    isTasksLoading || 
    isTemplatesLoading || 
    isNotificationsLoading ||
    isGoogleLoading;
  
  // Error handling
  const clearAllErrors = () => {
    clearApiErrors();
    clearAuthError();
    clearTaskError();
    clearTemplateError();
    clearNotificationError();
    clearGoogleError();
  };
  
  return {
    // Theme
    theme: {
      colorScheme,
      toggleColorScheme,
      isDark,
      colors,
      spacing,
      borderRadius,
      shadows,
      typography,
      getStatusColor,
      getPriorityColor
    },
    
    // API
    api: {
      available: apiAvailable,
      isLoading: isApiStatusLoading,
      error: apiError,
      isMockApi,
      setUseMockApi: useMockApi,
      connectionAttempts,
      recentErrors,
      lastChecked,
      checkAvailability: checkApiAvailability,
      setAvailable: setApiAvailable,
      setError: setApiError,
      clearErrors: clearApiErrors
    },
    
    // Auth
    auth: {
      user,
      isLoading: isAuthLoading,
      error: authError,
      isAuthenticated,
      login,
      register,
      logout,
      loadUser,
      clearError: clearAuthError
    },
    
    // Tasks
    tasks: {
      all: tasks,
      filtered: filteredTasks,
      selected: selectedTask,
      isLoading: isTasksLoading,
      isCreating: isTaskCreating,
      isUpdating: isTaskUpdating,
      isDeleting: isTaskDeleting,
      error: taskError,
      filters,
      savedFilters,
      fetch: fetchTasks,
      getById: getTaskById,
      create: createTask,
      update: updateTask,
      delete: deleteTask,
      select: selectTask,
      updateStatus: updateTaskStatus,
      updateAssignee: updateTaskAssignee,
      startTimeTracking,
      stopTimeTracking,
      saveAsTemplate,
      createFromTemplate,
      setFilters,
      resetFilters,
      saveFilter,
      applySavedFilter,
      clearError: clearTaskError
    },
    
    // Templates
    templates: {
      all: templates,
      categories,
      selected: selectedTemplate,
      isLoading: isTemplatesLoading,
      error: templateError,
      fetch: fetchTemplates,
      fetchCategories,
      getById: getTemplateById,
      getByCategory: getTemplatesByCategory,
      create: createTemplate,
      update: updateTemplate,
      delete: deleteTemplate,
      select: selectTemplate,
      clearError: clearTemplateError
    },
    
    // Notifications
    notifications: {
      all: notifications,
      unreadCount,
      isLoading: isNotificationsLoading,
      error: notificationError,
      fetch: fetchNotifications,
      fetchUnreadCount,
      markAsRead,
      markAllAsRead,
      delete: deleteNotification,
      add: addNotification,
      clearError: clearNotificationError
    },
    
    // Google
    google: {
      connected: googleConnected,
      email: googleEmail,
      isLoading: isGoogleLoading,
      error: googleError,
      driveFiles,
      tasks: googleTasks,
      lastSyncTime,
      syncInProgress,
      getAccountStatus,
      link: linkAccount,
      unlink: unlinkAccount,
      fetchDriveFiles,
      importTasks: importGoogleTasks,
      syncCalendar,
      clearError: clearGoogleError
    },
    
    // Global state
    global: {
      isLoading,
      clearAllErrors
    }
  };
}