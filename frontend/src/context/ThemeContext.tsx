import { ThemeContext, ThemeContextType } from './ThemeContextDefinition';
import { useThemeStore } from '@/stores/useThemeStore';
import '../styles/theme/index.css';

export { ThemeContext, type ThemeContextType } from './ThemeContextDefinition';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeStore = useThemeStore();

  // Map store values to context interface
  const value: ThemeContextType = {
    colorScheme: themeStore.colorScheme,
    toggleColorScheme: themeStore.toggleColorScheme,
    isDark: themeStore.isDark,
    colors: themeStore.colors,
    spacing: themeStore.spacing,
    borderRadius: themeStore.borderRadius,
    shadows: themeStore.shadows,
    typography: themeStore.typography,
    getStatusColor: themeStore.getStatusColor,
    getPriorityColor: themeStore.getPriorityColor,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}