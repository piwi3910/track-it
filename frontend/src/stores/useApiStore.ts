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
  maxConnectionAttempts: number;
  
  // Backoff strategy
  lastAttemptTime: number | null;
  backoffInterval: number;
  nextScheduledCheck: number | null;
  
  // Mock API functionality
  isMockApi: boolean;
  useMockApi: (useMock: boolean) => void;
  
  // Actions
  setApiAvailable: (available: boolean) => void;
  setApiLoading: (loading: boolean) => void;
  setApiError: (error: string | null) => void;
  checkApiAvailability: (force?: boolean) => Promise<boolean>;
  addApiError: (error: ApiError) => void;
  clearErrors: () => void;
  resetConnectionAttempts: () => void;
}

export const useApiStore = create<ApiState>((set, get) => ({
  // Initial state
  apiAvailable: false,
  isApiLoading: true,
  apiError: null,
  lastChecked: null,
  recentErrors: [],
  connectionAttempts: 0,
  maxConnectionAttempts: 5, // Maximum attempts before giving up
  lastAttemptTime: null,
  backoffInterval: 1000, // Start with 1 second, will increase exponentially
  nextScheduledCheck: null,
  isMockApi: false,
  
  // Mock API toggle
  useMockApi: (useMock) => set({ 
    isMockApi: useMock,
    // Clear errors when switching to mock mode
    ...(useMock ? { 
      apiError: null, 
      apiAvailable: true,
      connectionAttempts: 0, 
      backoffInterval: 1000,
      nextScheduledCheck: null 
    } : {})
  }),
  
  // Actions to update state
  setApiAvailable: (available) => set({ 
    apiAvailable: available,
    // Reset connection attempts when API becomes available
    ...(available ? { 
      connectionAttempts: 0,
      backoffInterval: 1000,
      nextScheduledCheck: null
    } : {})
  }),
  
  setApiLoading: (loading) => set({ isApiLoading: loading }),
  
  setApiError: (error) => set({ apiError: error }),
  
  // Reset connection attempts
  resetConnectionAttempts: () => set({ 
    connectionAttempts: 0,
    backoffInterval: 1000,
    nextScheduledCheck: null
  }),
  
  // Track API errors
  addApiError: (error) => set(state => ({ 
    recentErrors: [error, ...state.recentErrors].slice(0, 10) // Keep last 10 errors
  })),
  
  clearErrors: () => set({ recentErrors: [], apiError: null }),
  
  // Function to check API availability with backoff strategy
  checkApiAvailability: async (force = false): Promise<boolean> => {
    try {
      const { 
        isMockApi, 
        connectionAttempts, 
        maxConnectionAttempts, 
        backoffInterval,
        nextScheduledCheck,
        isApiLoading
      } = get();
      
      const now = Date.now();
      
      // If already loading, don't start another check
      if (isApiLoading && !force) {
        console.log('API check already in progress, skipping');
        return get().apiAvailable;
      }
      
      // Don't check if we've reached max attempts
      if (connectionAttempts >= maxConnectionAttempts && !force) {
        console.log(`Maximum connection attempts (${maxConnectionAttempts}) reached, not checking`);
        return false;
      }
      
      // Check if we should respect the backoff interval
      if (nextScheduledCheck && now < nextScheduledCheck && !force) {
        const waitTime = Math.round((nextScheduledCheck - now) / 1000);
        console.log(`Respecting backoff period, next check in ${waitTime}s`);
        return get().apiAvailable;
      }
      
      // If using mock API, always return available
      if (isMockApi) {
        set({ 
          apiAvailable: true, 
          apiError: null,
          lastChecked: new Date().toISOString()
        });
        return true;
      }
      
      // Start the check
      set({ 
        isApiLoading: true,
        connectionAttempts: connectionAttempts + 1,
        lastAttemptTime: now
      });
      
      console.log(`Checking API availability (attempt ${connectionAttempts + 1}/${maxConnectionAttempts})...`);
      const available = await isApiAvailable();
      
      // Calculate next backoff interval (exponential with max of 60s)
      const newBackoffInterval = available 
        ? 1000 // Reset to 1s if successful
        : Math.min(backoffInterval * 2, 60000); // Exponential backoff with max 60s
      
      set({ 
        apiAvailable: available,
        lastChecked: new Date().toISOString(),
        backoffInterval: newBackoffInterval,
        // Schedule next check
        nextScheduledCheck: available ? null : now + newBackoffInterval
      });
      
      if (!available) {
        // Different messages based on number of attempts
        let errorMessage = 'API is not available.';
        
        if (connectionAttempts >= 3) {
          errorMessage = 'Cannot connect to the backend server. Please ensure it is running.';
        }
        
        if (connectionAttempts >= maxConnectionAttempts) {
          errorMessage = `Failed to connect after ${maxConnectionAttempts} attempts. Try switching to Mock API or check server status.`;
        }
        
        set({ apiError: errorMessage });
        console.warn(`API is not available (attempt ${connectionAttempts}/${maxConnectionAttempts}). Next check in ${newBackoffInterval/1000}s`);
        
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
      const { connectionAttempts, backoffInterval } = get();
      const now = Date.now();
      
      // Calculate next backoff interval (exponential with max of 60s)
      const newBackoffInterval = Math.min(backoffInterval * 2, 60000);
      
      set({ 
        apiAvailable: false,
        apiError: errorMessage,
        connectionAttempts: connectionAttempts + 1,
        backoffInterval: newBackoffInterval,
        nextScheduledCheck: now + newBackoffInterval
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
    
    // If connection error, check API availability (but don't force)
    if (error instanceof Error && 
        (error.message.includes('fetch') || 
         error.message.includes('Unable to transform response'))) {
      // Don't initiate a check if we're at max attempts or waiting for backoff
      if (store.connectionAttempts < store.maxConnectionAttempts && 
          (!store.nextScheduledCheck || Date.now() >= store.nextScheduledCheck)) {
        store.checkApiAvailability();
      }
    }
  });
  
  // Listen for manual API check requests (always force when manually requested)
  window.addEventListener('check_api_availability', () => {
    useApiStore.getState().checkApiAvailability(true);
  });
}