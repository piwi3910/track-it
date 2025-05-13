import { ReactNode, useEffect } from 'react';
import { useApiStore } from '@/stores/useApiStore';

/**
 * API provider component that initializes and checks API availability
 */
export function ApiProvider({ children }: { children: ReactNode }) {
  const { checkApiAvailability, isMockApi } = useApiStore();
  
  // Check API availability on mount
  useEffect(() => {
    if (!isMockApi) {
      checkApiAvailability();
    }
  }, [checkApiAvailability, isMockApi]);
  
  return <>{children}</>;
}