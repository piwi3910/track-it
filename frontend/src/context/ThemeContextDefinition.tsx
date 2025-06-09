import { createContext } from 'react';

type ColorScheme = 'light' | 'dark';

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
  // Core theme values
  colorScheme: ColorScheme;
  toggleColorScheme: () => void;
  isDark: boolean;

  // Theme configuration
  colors: ThemeColors;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
  typography: ThemeTypography;

  // Utility functions
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);