import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useMantineColorScheme, MantineColorScheme } from '@mantine/core';
import { useEffect } from 'react';

// Theme types
interface ThemeColors {
  // Base colors
  background: string;
  cardBackground: string;
  text: string;
  subtle: string;
  highlight: string;
  border: string;

  // UI element colors
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;

  // Status colors for tasks
  statusBacklog: string;
  statusTodo: string;
  statusInProgress: string;
  statusBlocked: string;
  statusInReview: string;
  statusDone: string;

  // Priority colors
  priorityLow: string;
  priorityMedium: string;
  priorityHigh: string;
  priorityUrgent: string;

  // Component specific colors
  taskCardBorder: string;
  taskCardShadow: string;
  taskCardHoverShadow: string;
  badgeBackground: string;
  completionRing: string;
}

interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

interface ThemeBorderRadius {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  round: string;
}

interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  hover: string;
}

interface ThemeTypography {
  fontSizes: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
    statistic: string;
  };
  fontWeights: {
    normal: number;
    medium: number;
    bold: number;
    heavy: number;
  };
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

// Store types
interface ThemeState {
  // Theme controls
  colorScheme: MantineColorScheme;
  setColorScheme: (colorScheme: MantineColorScheme) => void;
  toggleColorScheme: () => void;
  isDark: boolean;

  // Theme properties
  colors: ThemeColors;
  updateColors: (isDark: boolean) => void;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
  updateShadows: (isDark: boolean) => void;
  typography: ThemeTypography;

  // Task status and priority mappings
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

// Create the store
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Default to light scheme (will be overridden by persisted value or system preference)
      colorScheme: 'light',
      isDark: false,
      
      // Action to update the color scheme
      setColorScheme: (colorScheme: MantineColorScheme) => {
        const isDark = colorScheme === 'dark';
        set({ colorScheme, isDark });
        
        // Update colors and shadows based on new theme
        get().updateColors(isDark);
        get().updateShadows(isDark);
        
        // Also update CSS variables
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      },
      
      // Toggle between light and dark mode
      toggleColorScheme: () => {
        const currentMode = get().colorScheme;
        const newMode = currentMode === 'dark' ? 'light' : 'dark';
        get().setColorScheme(newMode);
        
        // Also manually update Mantine - this is one-way from our store to Mantine
        const mantine = document.querySelector('html');
        if (mantine) {
          if (newMode === 'dark') {
            mantine.setAttribute('data-mantine-color-scheme', 'dark');
          } else {
            mantine.setAttribute('data-mantine-color-scheme', 'light');
          }
        }
      },
      
      // Initial colors (light theme)
      colors: {
        // Base colors
        background: '#ffffff',
        cardBackground: '#f8f9fa',
        text: '#212529',
        subtle: '#6c757d',
        highlight: '#0d6efd',
        border: '#dee2e6',

        // UI element colors
        primary: '#0d6efd',
        secondary: '#6f42c1',
        success: '#198754',
        warning: '#ffc107',
        error: '#dc3545',
        info: '#0dcaf0',

        // Status colors
        statusBacklog: '#6c757d',
        statusTodo: '#0d6efd',
        statusInProgress: '#0dcaf0',
        statusBlocked: '#dc3545',
        statusInReview: '#fd7e14',
        statusDone: '#198754',

        // Priority colors
        priorityLow: '#0d6efd',
        priorityMedium: '#ffc107',
        priorityHigh: '#fd7e14',
        priorityUrgent: '#dc3545',

        // Component specific
        taskCardBorder: '#dee2e6',
        taskCardShadow: 'rgba(0, 0, 0, 0.12)',
        taskCardHoverShadow: 'rgba(0, 0, 0, 0.15)',
        badgeBackground: 'rgba(0, 0, 0, 0.05)',
        completionRing: '#198754',
      },
      
      // Update colors based on theme
      updateColors: (isDark: boolean) => {
        set({
          colors: {
            // Base colors
            background: isDark ? '#212529' : '#ffffff',
            cardBackground: isDark ? '#343a40' : '#f8f9fa',
            text: isDark ? '#f8f9fa' : '#212529',
            subtle: isDark ? '#adb5bd' : '#6c757d',
            highlight: isDark ? '#3d8bfd' : '#0d6efd',
            border: isDark ? '#495057' : '#dee2e6',

            // UI element colors
            primary: isDark ? '#3d8bfd' : '#0d6efd',
            secondary: isDark ? '#8c68cd' : '#6f42c1',
            success: isDark ? '#28a745' : '#198754',
            warning: isDark ? '#ffc107' : '#ffc107',
            error: isDark ? '#dc3545' : '#dc3545',
            info: isDark ? '#39cff2' : '#0dcaf0',

            // Status colors
            statusBacklog: isDark ? '#adb5bd' : '#6c757d',
            statusTodo: isDark ? '#3d8bfd' : '#0d6efd',
            statusInProgress: isDark ? '#39cff2' : '#0dcaf0',
            statusBlocked: isDark ? '#e35d6a' : '#dc3545',
            statusInReview: isDark ? '#fd9241' : '#fd7e14',
            statusDone: isDark ? '#28a745' : '#198754',

            // Priority colors
            priorityLow: isDark ? '#3d8bfd' : '#0d6efd',
            priorityMedium: isDark ? '#ffc107' : '#ffc107',
            priorityHigh: isDark ? '#fd9241' : '#fd7e14',
            priorityUrgent: isDark ? '#e35d6a' : '#dc3545',

            // Component specific
            taskCardBorder: isDark ? '#495057' : '#dee2e6',
            taskCardShadow: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.12)',
            taskCardHoverShadow: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.15)',
            badgeBackground: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            completionRing: isDark ? '#28a745' : '#198754',
          }
        });
        
        // Update CSS variables to match colors
        const root = document.documentElement;
        const colors = get().colors;
        
        // Base colors
        root.style.setProperty('--color-background', colors.background);
        root.style.setProperty('--color-card-background', colors.cardBackground);
        root.style.setProperty('--color-text', colors.text);
        root.style.setProperty('--color-subtle', colors.subtle);
        root.style.setProperty('--color-highlight', colors.highlight);
        root.style.setProperty('--color-border', colors.border);
        
        // UI elements
        root.style.setProperty('--color-primary', colors.primary);
        root.style.setProperty('--color-secondary', colors.secondary);
        root.style.setProperty('--color-success', colors.success);
        root.style.setProperty('--color-warning', colors.warning);
        root.style.setProperty('--color-error', colors.error);
        root.style.setProperty('--color-info', colors.info);
        
        // Status colors
        root.style.setProperty('--color-status-backlog', colors.statusBacklog);
        root.style.setProperty('--color-status-todo', colors.statusTodo);
        root.style.setProperty('--color-status-in-progress', colors.statusInProgress);
        root.style.setProperty('--color-status-blocked', colors.statusBlocked);
        root.style.setProperty('--color-status-in-review', colors.statusInReview);
        root.style.setProperty('--color-status-done', colors.statusDone);
        
        // Priority colors
        root.style.setProperty('--color-priority-low', colors.priorityLow);
        root.style.setProperty('--color-priority-medium', colors.priorityMedium);
        root.style.setProperty('--color-priority-high', colors.priorityHigh);
        root.style.setProperty('--color-priority-urgent', colors.priorityUrgent);
        
        // Component specific
        root.style.setProperty('--color-task-card-border', colors.taskCardBorder);
        root.style.setProperty('--color-task-card-shadow', colors.taskCardShadow);
        root.style.setProperty('--color-task-card-hover-shadow', colors.taskCardHoverShadow);
        root.style.setProperty('--color-badge-background', colors.badgeBackground);
        root.style.setProperty('--color-completion-ring', colors.completionRing);
      },
      
      // Consistent spacing
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      
      // Border radius
      borderRadius: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        round: '50%',
      },
      
      // Initial shadows (light theme)
      shadows: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.12)',
        md: '0 4px 8px rgba(0, 0, 0, 0.1)',
        lg: '0 8px 16px rgba(0, 0, 0, 0.1)',
        hover: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      
      // Update shadows based on theme
      updateShadows: (isDark: boolean) => {
        set({
          shadows: {
            sm: isDark
              ? '0 1px 3px rgba(0, 0, 0, 0.3)'
              : '0 1px 3px rgba(0, 0, 0, 0.12)',
            md: isDark
              ? '0 4px 8px rgba(0, 0, 0, 0.4)'
              : '0 4px 8px rgba(0, 0, 0, 0.1)',
            lg: isDark
              ? '0 8px 16px rgba(0, 0, 0, 0.5)'
              : '0 8px 16px rgba(0, 0, 0, 0.1)',
            hover: isDark
              ? '0 4px 12px rgba(0, 0, 0, 0.5)'
              : '0 4px 12px rgba(0, 0, 0, 0.15)',
          }
        });
      },
      
      // Typography
      typography: {
        fontSizes: {
          xs: '0.65rem',
          sm: '0.8rem',
          md: '1rem',
          lg: '1.25rem',
          xl: '1.5rem',
          xxl: '2rem',
          statistic: '6rem',
        },
        fontWeights: {
          normal: 400,
          medium: 500,
          bold: 700,
          heavy: 900,
        },
        lineHeights: {
          tight: 1.1,
          normal: 1.5,
          relaxed: 1.8,
        },
      },
      
      // Helper function for getting status color
      getStatusColor: (status: string): string => {
        const colors = get().colors;
        switch (status.toLowerCase()) {
          case 'backlog': return colors.statusBacklog;
          case 'todo': return colors.statusTodo;
          case 'in_progress': return colors.statusInProgress;
          case 'blocked': return colors.statusBlocked;
          case 'in_review': return colors.statusInReview;
          case 'done': return colors.statusDone;
          default: return colors.statusTodo;
        }
      },
      
      // Helper function for getting priority color
      getPriorityColor: (priority: string): string => {
        const colors = get().colors;
        switch (priority.toLowerCase()) {
          case 'low': return colors.priorityLow;
          case 'medium': return colors.priorityMedium;
          case 'high': return colors.priorityHigh;
          case 'urgent': return colors.priorityUrgent;
          default: return colors.priorityMedium;
        }
      },
    }),
    {
      name: 'track-it-theme', // localStorage key
      version: 1, // version for migration
      partialize: (state) => ({ colorScheme: state.colorScheme }), // only persist colorScheme
    }
  )
);

/**
 * Hook to synchronize Mantine's color scheme with our theme store
 * But prevent infinite loops by using refs and sync flags
 */
export function useSyncMantineTheme() {
  const { setColorScheme } = useThemeStore();
  const { colorScheme, setColorScheme: setMantineColorScheme } = useMantineColorScheme();
  
  // Use a single direction sync to prevent loops
  useEffect(() => {
    // Only sync from Mantine to our store on initial load
    // This allows our store to be the source of truth after initialization
    const storedTheme = localStorage.getItem('track-it-theme');
    if (!storedTheme) {
      // Only set if we don't have a stored preference already
      setColorScheme(colorScheme);
    }
  }, []); // Empty dependency array to run only once on mount
  
  // Expose a manual sync function if needed elsewhere
  return {
    syncThemeToMantine: (scheme: MantineColorScheme) => {
      setMantineColorScheme(scheme);
    }
  };
}