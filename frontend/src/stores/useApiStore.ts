import { create } from 'zustand';
import { isApiAvailable } from '@/utils/api-utils';
import { env } from '@/utils/env';

// Track API errors
interface ApiError {
  message: string;
  code?: string;
  timestamp: string;
}

interface ApiState {
  // Status
  apiAvailable: boolean;
  isApiLoading: boolean;
  apiError: string | null;
  lastChecked: string | null;
  
  // Error tracking
  recentErrors: ApiError[];
  connectionAttempts: number;
  
  // Mock API functionality
  isMockApi: boolean;
  useMockApi: (useMock: boolean) => void;
  
  // Actions
  setApiAvailable: (available: boolean) => void;
  setApiLoading: (loading: boolean) => void;
  setApiError: (error: string | null) => void;
  checkApiAvailability: () => Promise<boolean>;
  addApiError: (error: ApiError) => void;
  clearErrors: () => void;
}

export const useApiStore = create<ApiState>((set, get) => ({
  // Initial state
  apiAvailable: false,
  isApiLoading: true,
  apiError: null,
  lastChecked: null,
  recentErrors: [],
  connectionAttempts: 0,
  isMockApi: false,
  
  // Mock API toggle
  useMockApi: (useMock) => set({ 
    isMockApi: useMock,
    // Clear errors when switching to mock mode
    ...(useMock ? { apiError: null, apiAvailable: true } : {})
  }),
  
  // Actions to update state
  setApiAvailable: (available) => set({ 
    apiAvailable: available,
    // Reset connection attempts when API becomes available
    ...(available ? { connectionAttempts: 0 } : {})
  }),
  
  setApiLoading: (loading) => set({ isApiLoading: loading }),
  
  setApiError: (error) => set({ apiError: error }),
  
  // Track API errors
  addApiError: (error) => set(state => ({ 
    recentErrors: [error, ...state.recentErrors].slice(0, 10) // Keep last 10 errors
  })),
  
  clearErrors: () => set({ recentErrors: [], apiError: null }),
  
  // Function to check API availability
  checkApiAvailability: async (): Promise<boolean> => {
    try {
      const { isMockApi, connectionAttempts } = get();
      
      // If using mock API, always return available
      if (isMockApi) {
        set({ 
          apiAvailable: true, 
          apiError: null,
          lastChecked: new Date().toISOString()
        });
        return true;
      }
      
      set({ 
        isApiLoading: true,
        connectionAttempts: connectionAttempts + 1
      });
      
      console.log(`Checking API availability (attempt ${connectionAttempts + 1})...`);
      const available = await isApiAvailable();
      set({ 
        apiAvailable: available,
        lastChecked: new Date().toISOString()
      });
      
      if (!available) {
        // Different messages based on number of attempts
        let errorMessage = 'API is not available.';
        
        if (connectionAttempts >= 3) {
          errorMessage = 'Cannot connect to the backend server. Please ensure it is running.';
        }
        
        set({ apiError: errorMessage });
        console.warn(`API is not available (attempt ${connectionAttempts + 1}).`);
        
        // Add to error history
        get().addApiError({
          message: errorMessage,
          code: 'CONNECTION_ERROR',
          timestamp: new Date().toISOString()
        });
      } else {
        set({ apiError: null });
        console.log('API is available!');
      }
      
      return available;
    } catch (error) {
      const errorMessage = 'Failed to check API availability';
      
      set({ 
        apiAvailable: false,
        apiError: errorMessage,
        connectionAttempts: get().connectionAttempts + 1
      });
      
      console.error('Failed to check API availability:', error);
      
      // Add to error history
      get().addApiError({
        message: errorMessage,
        code: 'CHECK_ERROR',
        timestamp: new Date().toISOString()
      });
      
      return false;
    } finally {
      set({ isApiLoading: false });
    }
  }
}));

// Automatically initialize API status check
if (typeof window !== 'undefined') {
  // Run on next tick to avoid SSR issues
  setTimeout(() => {
    useApiStore.getState().checkApiAvailability();
  }, 0);
  
  // Add event listeners for API errors and checks
  window.addEventListener('api_error', (event: CustomEvent) => {
    const { error, timestamp } = event.detail;
    const store = useApiStore.getState();
    
    // Add error to recent errors list
    store.addApiError({
      message: error instanceof Error ? error.message : 'Unknown API error',
      timestamp: timestamp || new Date().toISOString()
    });
    
    // If connection error, check API availability
    if (error instanceof Error && 
        (error.message.includes('fetch') || 
         error.message.includes('Unable to transform response'))) {
      store.checkApiAvailability();
    }
  });
  
  // Listen for manual API check requests
  window.addEventListener('check_api_availability', () => {
    useApiStore.getState().checkApiAvailability();
  });
}