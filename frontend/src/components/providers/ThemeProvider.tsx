import { ReactNode, useEffect } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import { useThemeStore, useSyncMantineTheme } from '@/stores/useThemeStore';

/**
 * Theme provider component that initializes Zustand theme store
 * and synchronizes with Mantine theme
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Sync with Mantine theme
  useSyncMantineTheme();
  
  const { colorScheme } = useMantineColorScheme();
  const { setColorScheme, isDark } = useThemeStore();
  
  // Initialize theme on mount
  useEffect(() => {
    setColorScheme(colorScheme);
  }, [colorScheme, setColorScheme]);
  
  // Set data-theme attribute for CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);
  
  return <>{children}</>;
}