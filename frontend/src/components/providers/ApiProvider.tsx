import { ReactNode, useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import { useApiStore } from '@/stores/useApiStore';

/**
 * API provider component that initializes and checks API availability
 */
export function ApiProvider({ children }: { children: ReactNode }) {
  // Use shallow equality to prevent unnecessary re-renders
  const store = useApiStore(
    state => ({
      isMockApi: state.isMockApi,
      apiAvailable: state.apiAvailable,
      apiError: state.apiError,
      connectionAttempts: state.connectionAttempts
    }),
    shallow // Use shallow equality to ensure stable object references
  );
  
  // Get a reference to the store for direct access in intervals to avoid dependency cycles
  const getStore = useApiStore.getState;
  
  // Track intervals to avoid duplicate interval creation
  const checkIntervalRef = useRef<number | null>(null);
  
  // Function to check API availability through getState to avoid rendering loop
  const checkApiAvailability = () => {
    useApiStore.getState().checkApiAvailability();
  };
  
  // Setup API check on mount and cleanup on unmount
  useEffect(() => {
    // Only run if we're not using mock API
    if (!store.isMockApi) {
      // Initial check on mount
      checkApiAvailability();
      
      // Make sure we don't create multiple intervals
      if (checkIntervalRef.current === null) {
        // Set up periodic checks
        checkIntervalRef.current = window.setInterval(() => {
          const currentState = getStore();
          if (!currentState.apiAvailable && currentState.connectionAttempts < 5) {
            checkApiAvailability();
          }
        }, 10000); // Check every 10 seconds if not connected
      }
      
      // Cleanup interval on unmount
      return () => {
        if (checkIntervalRef.current !== null) {
          window.clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
      };
    }
    
    // This effect should only run once on mount and when isMockApi changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.isMockApi]);
  
  // Log API status changes
  useEffect(() => {
    if (store.apiAvailable) {
      console.log('API connection established successfully');
    } else if (store.apiError) {
      console.warn(`API connection error: ${store.apiError}`);
    }
  }, [store.apiAvailable, store.apiError]);
  
  return <>{children}</>;
}