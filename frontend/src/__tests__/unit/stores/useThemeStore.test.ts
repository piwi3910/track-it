import { renderHook, act } from '@testing-library/react';
import { useThemeStore } from '../../../stores/useThemeStore';
import { jest } from '@jest/globals';

// Mock document and localStorage
const mockSetProperty = jest.fn();
const mockSetAttribute = jest.fn();
const mockQuerySelector = jest.fn();

Object.defineProperty(document, 'documentElement', {
  value: {
    style: {
      setProperty: mockSetProperty,
    },
    setAttribute: mockSetAttribute,
  },
  writable: true,
});

Object.defineProperty(document, 'querySelector', {
  value: mockQuerySelector,
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useThemeStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetProperty.mockClear();
    mockSetAttribute.mockClear();
    mockQuerySelector.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('initial state', () => {
    it('should have light theme as default', () => {
      const { result } = renderHook(() => useThemeStore());
      
      expect(result.current.colorScheme).toBe('light');
      expect(result.current.isDark).toBe(false);
    });

    it('should have default colors for light theme', () => {
      const { result } = renderHook(() => useThemeStore());
      
      expect(result.current.colors.background).toBe('#ffffff');
      expect(result.current.colors.text).toBe('#212529');
      expect(result.current.colors.primary).toBe('#0d6efd');
    });

    it('should have spacing properties', () => {
      const { result } = renderHook(() => useThemeStore());
      
      expect(result.current.spacing).toEqual({
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      });
    });

    it('should have border radius properties', () => {
      const { result } = renderHook(() => useThemeStore());
      
      expect(result.current.borderRadius).toEqual({
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        round: '50%',
      });
    });

    it('should have typography properties', () => {
      const { result } = renderHook(() => useThemeStore());
      
      expect(result.current.typography.fontSizes.md).toBe('1rem');
      expect(result.current.typography.fontWeights.normal).toBe(400);
      expect(result.current.typography.lineHeights.normal).toBe(1.5);
    });
  });

  describe('setColorScheme', () => {
    it('should update color scheme to dark', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setColorScheme('dark');
      });
      
      expect(result.current.colorScheme).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });

    it('should update colors when switching to dark mode', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setColorScheme('dark');
      });
      
      expect(result.current.colors.background).toBe('#212529');
      expect(result.current.colors.text).toBe('#f8f9fa');
    });

    it('should update CSS variables when changing theme', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.setColorScheme('dark');
      });
      
      expect(mockSetProperty).toHaveBeenCalledWith('--color-background', '#212529');
      expect(mockSetProperty).toHaveBeenCalledWith('--color-text', '#f8f9fa');
      expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should update shadows when changing theme', () => {
      const { result } = renderHook(() => useThemeStore());
      
      const initialShadow = result.current.shadows.sm;
      
      act(() => {
        result.current.setColorScheme('dark');
      });
      
      expect(result.current.shadows.sm).not.toBe(initialShadow);
      expect(result.current.shadows.sm).toBe('0 1px 3px rgba(0, 0, 0, 0.3)');
    });
  });

  describe('toggleColorScheme', () => {
    it('should toggle from light to dark', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.toggleColorScheme();
      });
      
      expect(result.current.colorScheme).toBe('dark');
      expect(result.current.isDark).toBe(true);
    });

    it('should toggle from dark to light', () => {
      const { result } = renderHook(() => useThemeStore());
      
      // First set to dark
      act(() => {
        result.current.setColorScheme('dark');
      });
      
      // Then toggle
      act(() => {
        result.current.toggleColorScheme();
      });
      
      expect(result.current.colorScheme).toBe('light');
      expect(result.current.isDark).toBe(false);
    });

    it('should update HTML data attribute when toggling', () => {
      const mockHtmlElement = {
        setAttribute: jest.fn(),
      };
      mockQuerySelector.mockReturnValue(mockHtmlElement);
      
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.toggleColorScheme();
      });
      
      expect(mockQuerySelector).toHaveBeenCalledWith('html');
      expect(mockHtmlElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct color for each status', () => {
      const { result } = renderHook(() => useThemeStore());
      
      expect(result.current.getStatusColor('backlog')).toBe(result.current.colors.statusBacklog);
      expect(result.current.getStatusColor('todo')).toBe(result.current.colors.statusTodo);
      expect(result.current.getStatusColor('in_progress')).toBe(result.current.colors.statusInProgress);
      expect(result.current.getStatusColor('blocked')).toBe(result.current.colors.statusBlocked);
      expect(result.current.getStatusColor('in_review')).toBe(result.current.colors.statusInReview);
      expect(result.current.getStatusColor('done')).toBe(result.current.colors.statusDone);
    });

    it('should return default color for unknown status', () => {
      const { result } = renderHook(() => useThemeStore());
      
      expect(result.current.getStatusColor('unknown_status')).toBe(result.current.colors.statusTodo);
    });

    it('should handle case insensitive status', () => {
      const { result } = renderHook(() => useThemeStore());
      
      expect(result.current.getStatusColor('BACKLOG')).toBe(result.current.colors.statusBacklog);
      expect(result.current.getStatusColor('ToDo')).toBe(result.current.colors.statusTodo);
    });
  });

  describe('getPriorityColor', () => {
    it('should return correct color for each priority', () => {
      const { result } = renderHook(() => useThemeStore());
      
      expect(result.current.getPriorityColor('low')).toBe(result.current.colors.priorityLow);
      expect(result.current.getPriorityColor('medium')).toBe(result.current.colors.priorityMedium);
      expect(result.current.getPriorityColor('high')).toBe(result.current.colors.priorityHigh);
      expect(result.current.getPriorityColor('urgent')).toBe(result.current.colors.priorityUrgent);
    });

    it('should return default color for unknown priority', () => {
      const { result } = renderHook(() => useThemeStore());
      
      expect(result.current.getPriorityColor('unknown_priority')).toBe(result.current.colors.priorityMedium);
    });

    it('should handle case insensitive priority', () => {
      const { result } = renderHook(() => useThemeStore());
      
      expect(result.current.getPriorityColor('LOW')).toBe(result.current.colors.priorityLow);
      expect(result.current.getPriorityColor('High')).toBe(result.current.colors.priorityHigh);
    });
  });

  describe('updateColors', () => {
    it('should update colors to dark theme', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.updateColors(true);
      });
      
      expect(result.current.colors.background).toBe('#212529');
      expect(result.current.colors.cardBackground).toBe('#343a40');
      expect(result.current.colors.text).toBe('#f8f9fa');
    });

    it('should update colors to light theme', () => {
      const { result } = renderHook(() => useThemeStore());
      
      // First set to dark
      act(() => {
        result.current.updateColors(true);
      });
      
      // Then back to light
      act(() => {
        result.current.updateColors(false);
      });
      
      expect(result.current.colors.background).toBe('#ffffff');
      expect(result.current.colors.cardBackground).toBe('#f8f9fa');
      expect(result.current.colors.text).toBe('#212529');
    });
  });

  describe('updateShadows', () => {
    it('should update shadows for dark theme', () => {
      const { result } = renderHook(() => useThemeStore());
      
      act(() => {
        result.current.updateShadows(true);
      });
      
      expect(result.current.shadows.sm).toBe('0 1px 3px rgba(0, 0, 0, 0.3)');
      expect(result.current.shadows.md).toBe('0 4px 8px rgba(0, 0, 0, 0.4)');
    });

    it('should update shadows for light theme', () => {
      const { result } = renderHook(() => useThemeStore());
      
      // First set to dark
      act(() => {
        result.current.updateShadows(true);
      });
      
      // Then back to light
      act(() => {
        result.current.updateShadows(false);
      });
      
      expect(result.current.shadows.sm).toBe('0 1px 3px rgba(0, 0, 0, 0.12)');
      expect(result.current.shadows.md).toBe('0 4px 8px rgba(0, 0, 0, 0.1)');
    });
  });
});