import { createContext, useEffect } from 'react';
import { useMantineColorScheme, useMantineTheme, MantineColorScheme } from '@mantine/core';
import '../styles/theme/index.css';

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

export interface ThemeContextType {
  // Theme controls
  colorScheme: MantineColorScheme;
  toggleColorScheme: () => void;
  isDark: boolean;

  // Theme properties
  colors: ThemeColors;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
  typography: ThemeTypography;

  // Task status and priority mappings
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const mantineTheme = useMantineTheme();

  const isDark = colorScheme === 'dark';

  const toggleColorScheme = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };

  // Update CSS variables when theme changes
  useEffect(() => {
    // Set data attribute for dark mode
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

    // Update CSS variables to match current theme
    const root = document.documentElement;

    // Base colors
    root.style.setProperty('--color-background', isDark ? mantineTheme.colors.dark[7] : mantineTheme.white);
    root.style.setProperty('--color-card-background', isDark ? mantineTheme.colors.dark[6] : mantineTheme.colors.gray[0]);
    root.style.setProperty('--color-text', isDark ? mantineTheme.colors.dark[0] : mantineTheme.colors.dark[9]);
    root.style.setProperty('--color-subtle', isDark ? mantineTheme.colors.dark[3] : mantineTheme.colors.gray[6]);
    root.style.setProperty('--color-highlight', mantineTheme.colors[mantineTheme.primaryColor][isDark ? 7 : 5]);
    root.style.setProperty('--color-border', isDark ? mantineTheme.colors.dark[4] : mantineTheme.colors.gray[3]);

    // UI elements
    root.style.setProperty('--color-primary', mantineTheme.colors.blue[isDark ? 7 : 6]);
    root.style.setProperty('--color-secondary', mantineTheme.colors.violet[isDark ? 7 : 6]);
    root.style.setProperty('--color-success', mantineTheme.colors.green[isDark ? 7 : 6]);
    root.style.setProperty('--color-warning', mantineTheme.colors.yellow[isDark ? 7 : 6]);
    root.style.setProperty('--color-error', mantineTheme.colors.red[isDark ? 7 : 6]);
    root.style.setProperty('--color-info', mantineTheme.colors.cyan[isDark ? 7 : 6]);

    // Status colors
    root.style.setProperty('--color-status-backlog', isDark ? mantineTheme.colors.dark[3] : mantineTheme.colors.gray[6]);
    root.style.setProperty('--color-status-todo', mantineTheme.colors.blue[isDark ? 7 : 6]);
    root.style.setProperty('--color-status-in-progress', mantineTheme.colors.cyan[isDark ? 7 : 6]);
    root.style.setProperty('--color-status-blocked', mantineTheme.colors.red[isDark ? 7 : 6]);
    root.style.setProperty('--color-status-in-review', mantineTheme.colors.orange[isDark ? 7 : 6]);
    root.style.setProperty('--color-status-done', mantineTheme.colors.green[isDark ? 7 : 6]);

    // Priority colors
    root.style.setProperty('--color-priority-low', mantineTheme.colors.blue[isDark ? 7 : 6]);
    root.style.setProperty('--color-priority-medium', mantineTheme.colors.yellow[isDark ? 7 : 6]);
    root.style.setProperty('--color-priority-high', mantineTheme.colors.orange[isDark ? 7 : 6]);
    root.style.setProperty('--color-priority-urgent', mantineTheme.colors.red[isDark ? 7 : 6]);

    // Component specific
    root.style.setProperty('--color-task-card-border', isDark ? mantineTheme.colors.dark[4] : mantineTheme.colors.gray[3]);
    root.style.setProperty('--color-task-card-shadow', isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.12)');
    root.style.setProperty('--color-task-card-hover-shadow', isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.15)');
    root.style.setProperty('--color-badge-background', isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)');
    root.style.setProperty('--color-completion-ring', mantineTheme.colors.green[isDark ? 7 : 6]);
  }, [isDark, mantineTheme]);

  // Define consistent colors based on the current theme
  const colors: ThemeColors = {
    // Base colors
    background: isDark ? mantineTheme.colors.dark[7] : mantineTheme.white,
    cardBackground: isDark ? mantineTheme.colors.dark[6] : mantineTheme.colors.gray[0],
    text: isDark ? mantineTheme.colors.dark[0] : mantineTheme.colors.dark[9],
    subtle: isDark ? mantineTheme.colors.dark[3] : mantineTheme.colors.gray[6],
    highlight: mantineTheme.colors[mantineTheme.primaryColor][isDark ? 7 : 5],
    border: isDark ? mantineTheme.colors.dark[4] : mantineTheme.colors.gray[3],

    // UI element colors - consistent across the app
    primary: mantineTheme.colors.blue[isDark ? 7 : 6],
    secondary: mantineTheme.colors.violet[isDark ? 7 : 6],
    success: mantineTheme.colors.green[isDark ? 7 : 6],
    warning: mantineTheme.colors.yellow[isDark ? 7 : 6],
    error: mantineTheme.colors.red[isDark ? 7 : 6],
    info: mantineTheme.colors.cyan[isDark ? 7 : 6],

    // Status colors - used for task status indicators
    statusBacklog: isDark ? mantineTheme.colors.dark[3] : mantineTheme.colors.gray[6], // #5c636a
    statusTodo: mantineTheme.colors.blue[isDark ? 7 : 6], // #0d6efd
    statusInProgress: mantineTheme.colors.cyan[isDark ? 7 : 6], // #0dcaf0
    statusBlocked: mantineTheme.colors.red[isDark ? 7 : 6], // #dc3545
    statusInReview: mantineTheme.colors.orange[isDark ? 7 : 6], // #fd7e14
    statusDone: mantineTheme.colors.green[isDark ? 7 : 6], // #198754

    // Priority colors - used for task priority indicators
    priorityLow: mantineTheme.colors.blue[isDark ? 7 : 6],
    priorityMedium: mantineTheme.colors.yellow[isDark ? 7 : 6],
    priorityHigh: mantineTheme.colors.orange[isDark ? 7 : 6],
    priorityUrgent: mantineTheme.colors.red[isDark ? 7 : 6],

    // Component specific colors
    taskCardBorder: isDark ? mantineTheme.colors.dark[4] : mantineTheme.colors.gray[3],
    taskCardShadow: isDark
      ? 'rgba(0, 0, 0, 0.3)'
      : 'rgba(0, 0, 0, 0.12)',
    taskCardHoverShadow: isDark
      ? 'rgba(0, 0, 0, 0.4)'
      : 'rgba(0, 0, 0, 0.15)',
    badgeBackground: isDark
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.05)',
    completionRing: mantineTheme.colors.green[isDark ? 7 : 6],
  };

  // Consistent spacing
  const spacing: ThemeSpacing = {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  };

  // Border radius
  const borderRadius: ThemeBorderRadius = {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '16px',
    round: '50%',
  };

  // Shadows
  const shadows: ThemeShadows = {
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
  };

  // Typography
  const typography: ThemeTypography = {
    fontSizes: {
      xs: '0.65rem',
      sm: '0.8rem',
      md: '1rem',
      lg: '1.25rem',
      xl: '1.5rem',
      xxl: '2rem',
      statistic: '6rem',  // Updated to match the new size in variables.css
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
  };

  // Helper functions for getting colors based on status and priority
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'backlog': return colors.statusBacklog;
      case 'todo': return colors.statusTodo;
      case 'in_progress': return colors.statusInProgress;
      case 'blocked': return colors.statusBlocked;
      case 'in_review': return colors.statusInReview;
      case 'done': return colors.statusDone;
      default: return colors.statusTodo;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'low': return colors.priorityLow;
      case 'medium': return colors.priorityMedium;
      case 'high': return colors.priorityHigh;
      case 'urgent': return colors.priorityUrgent;
      default: return colors.priorityMedium;
    }
  };

  const value: ThemeContextType = {
    colorScheme,
    toggleColorScheme,
    isDark,
    colors,
    spacing,
    borderRadius,
    shadows,
    typography,
    getStatusColor,
    getPriorityColor,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}