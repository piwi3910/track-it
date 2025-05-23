import { ReactNode, useEffect } from 'react';
import { useThemeStore, useSyncMantineTheme } from '@/stores/useThemeStore';
import { ThemeProvider as ThemeContextProvider } from '@/context/ThemeContext';

/**
 * Theme provider component that initializes Zustand theme store
 * and synchronizes with Mantine theme
 * 
 * Also includes the ThemeContext provider to ensure components using useTheme() have access
 * to the ThemeContext
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Sync with Mantine theme (one-way sync to avoid loops)
  useSyncMantineTheme();
  
  const { toggleColorScheme, isDark } = useThemeStore();
  
  // Set data-theme attribute for CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);
  
  // Expose theme toggle for development purposes
  useEffect(() => {
    // Adding global property for development
    const extendedWindow = window as Window & { __toggleTheme?: () => void };
    extendedWindow.__toggleTheme = () => {
      toggleColorScheme();
    };
    
    return () => {
      // Removing global property 
      delete extendedWindow.__toggleTheme;
    };
  }, [toggleColorScheme]);
  
  return (
    <ThemeContextProvider>
      {children}
    </ThemeContextProvider>
  );
}