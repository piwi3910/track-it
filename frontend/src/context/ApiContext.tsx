import { createContext, useState, useEffect, ReactNode } from 'react';
import { isApiAvailable } from '@/utils/api-utils';
import { env } from '@/utils/env';

interface ApiContextType {
  apiAvailable: boolean;
  isApiLoading: boolean;
  apiError: string | null;
  checkApiAvailability: () => Promise<boolean>;
  isMockApi: boolean;
}

export const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);
  const [isApiLoading, setIsApiLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isMockApi] = useState<boolean>(import.meta.env.VITE_USE_MOCK_API === 'true');
  
  // Check if the API is available on mount
  useEffect(() => {
    const checkApi = async () => {
      try {
        // Skip the check if we're using mock API
        if (isMockApi) {
          setApiAvailable(true);
          setIsApiLoading(false);
          return;
        }
        
        setIsApiLoading(true);
        const available = await isApiAvailable();
        setApiAvailable(available);
        
        if (!available) {
          setApiError('API is not available. Using fallback data.');
          console.warn('API is not available. Using fallback data.');
        } else {
          setApiError(null);
        }
      } catch (error) {
        setApiAvailable(false);
        setApiError('Failed to check API availability');
        console.error('Failed to check API availability:', error);
      } finally {
        setIsApiLoading(false);
      }
    };
    
    checkApi();
  }, [isMockApi]);
  
  // Function to manually check API availability
  const checkApiAvailability = async (): Promise<boolean> => {
    try {
      setIsApiLoading(true);
      const available = await isApiAvailable();
      setApiAvailable(available);
      
      if (!available) {
        setApiError('API is not available. Using fallback data.');
      } else {
        setApiError(null);
      }
      
      return available;
    } catch (error) {
      setApiAvailable(false);
      setApiError('Failed to check API availability');
      console.error('Failed to check API availability:', error);
      return false;
    } finally {
      setIsApiLoading(false);
    }
  };
  
  return (
    <ApiContext.Provider 
      value={{ 
        apiAvailable, 
        isApiLoading, 
        apiError, 
        checkApiAvailability,
        isMockApi
      }}
    >
      {children}
    </ApiContext.Provider>
  );
}