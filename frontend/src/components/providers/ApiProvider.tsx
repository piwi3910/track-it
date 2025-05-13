import { ReactNode, useEffect, useRef } from 'react';
import { useApiStore } from '@/stores/useApiStore';

/**
 * API provider component that initializes and checks API availability
 * This implementation uses direct store access to avoid dependency cycles and infinite loops
 */
export function ApiProvider({ children }: { children: ReactNode }) {
  // Use refs instead of state to avoid rendering loops
  const isMockApiRef = useRef(useApiStore.getState().isMockApi);
  const intervalRef = useRef<number | null>(null);
  const initializedRef = useRef(false);
  
  // Direct store access function to avoid hook dependency issues
  const checkApiAvailability = () => {
    useApiStore.getState().checkApiAvailability();
  };
  
  // Setup store subscription and API check only once on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    // Create an unsubscribe function for the store
    const unsubscribe = useApiStore.subscribe(
      (state) => ({
        isMockApi: state.isMockApi,
        apiAvailable: state.apiAvailable,
        apiError: state.apiError,
        connectionAttempts: state.connectionAttempts
      }),
      (newState, prevState) => {
        // Update ref
        isMockApiRef.current = newState.isMockApi;
        
        // Log status changes
        if (newState.apiAvailable && !prevState.apiAvailable) {
          console.log('API connection established successfully');
        } else if (newState.apiError && newState.apiError !== prevState.apiError) {
          console.warn(`API connection error: ${newState.apiError}`);
        }
        
        // Handle interval when mock API status changes
        if (newState.isMockApi !== prevState.isMockApi) {
          if (newState.isMockApi && intervalRef.current !== null) {
            // Clear interval if we switch to mock API
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          } else if (!newState.isMockApi && intervalRef.current === null) {
            // Start interval if we switch away from mock API
            checkApiAvailability();
            setupInterval();
          }
        }
      }
    );
    
    // Function to set up the interval with the current state
    function setupInterval() {
      if (intervalRef.current !== null) return;
      
      intervalRef.current = window.setInterval(() => {
        const state = useApiStore.getState();
        if (!state.apiAvailable && state.connectionAttempts < 5) {
          checkApiAvailability();
        }
      }, 10000);
    }
    
    // Initial API check if not using mock API
    if (!isMockApiRef.current) {
      checkApiAvailability();
      setupInterval();
    }
    
    // Cleanup
    return () => {
      unsubscribe();
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Empty deps array - this effect runs ONCE only
  
  return <>{children}</>;
}