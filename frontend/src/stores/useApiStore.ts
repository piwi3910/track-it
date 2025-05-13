import { create } from 'zustand';
import { isApiAvailable } from '@/utils/api-utils';
import { env } from '@/utils/env';

interface ApiState {
  // Status
  apiAvailable: boolean;
  isApiLoading: boolean;
  apiError: string | null;
  isMockApi: boolean;
  
  // Actions
  setApiAvailable: (available: boolean) => void;
  setApiLoading: (loading: boolean) => void;
  setApiError: (error: string | null) => void;
  checkApiAvailability: () => Promise<boolean>;
}

export const useApiStore = create<ApiState>((set, get) => ({
  // Initial state
  apiAvailable: false,
  isApiLoading: true,
  apiError: null,
  isMockApi: import.meta.env.VITE_USE_MOCK_API === 'true',
  
  // Actions to update state
  setApiAvailable: (available) => set({ apiAvailable: available }),
  setApiLoading: (loading) => set({ isApiLoading: loading }),
  setApiError: (error) => set({ apiError: error }),
  
  // Function to check API availability
  checkApiAvailability: async (): Promise<boolean> => {
    try {
      // Skip the check if we're using mock API
      if (get().isMockApi) {
        set({ 
          apiAvailable: true,
          isApiLoading: false,
          apiError: null
        });
        return true;
      }
      
      set({ isApiLoading: true });
      const available = await isApiAvailable();
      set({ apiAvailable: available });
      
      if (!available) {
        set({ apiError: 'API is not available. Using fallback data.' });
        console.warn('API is not available. Using fallback data.');
      } else {
        set({ apiError: null });
      }
      
      return available;
    } catch (error) {
      set({ 
        apiAvailable: false,
        apiError: 'Failed to check API availability'
      });
      console.error('Failed to check API availability:', error);
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
}