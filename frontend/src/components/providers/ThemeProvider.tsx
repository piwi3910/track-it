import { ReactNode, useEffect } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { ThemeProvider as ThemeContextProvider } from '@/context/ThemeContext';

/**
 * Theme provider component that initializes Zustand theme store
 * and manages theme switching
 * 
 * Also includes the ThemeContext provider to ensure components using useTheme() have access
 * to the ThemeContext
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { toggleColorScheme, isDark } = useThemeStore();
  
  // Set dark class and data-theme attribute for CSS variables
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
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