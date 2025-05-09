import { createContext, useContext } from 'react';
import { useMantineColorScheme, useMantineTheme, MantineColorScheme } from '@mantine/core';

export interface ThemeContextType {
  colorScheme: MantineColorScheme;
  toggleColorScheme: () => void;
  isDark: boolean;
  colors: {
    background: string;
    cardBackground: string;
    text: string;
    subtle: string;
    highlight: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  
  const isDark = colorScheme === 'dark';
  
  const toggleColorScheme = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };
  
  // Define consistent colors based on the current theme
  const colors = {
    background: isDark ? theme.colors.dark[7] : theme.white,
    cardBackground: isDark ? theme.colors.dark[6] : theme.colors.gray[0],
    text: isDark ? theme.colors.dark[0] : theme.colors.dark[9],
    subtle: isDark ? theme.colors.dark[3] : theme.colors.gray[6],
    highlight: theme.colors[theme.primaryColor][isDark ? 7 : 5],
  };
  
  const value = {
    colorScheme,
    toggleColorScheme,
    isDark,
    colors,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}