import { useState, useEffect, ReactNode } from 'react';
import { isApiAvailable } from '@/utils/api-utils';
import { ApiContext } from './ApiContext.types';

export function ApiProvider({ children }: { children: ReactNode }) {
  const [apiAvailable, setApiAvailable] = useState<boolean>(false);
  const [isApiLoading, setIsApiLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Check if the API is available on mount
  useEffect(() => {
    const checkApi = async () => {
      try {
        setIsApiLoading(true);
        const available = await isApiAvailable();
        setApiAvailable(available);
        
        if (!available) {
          setApiError('API is not available.');
          console.warn('API is not available.');
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
  }, []);
  
  // Function to manually check API availability
  const checkApiAvailability = async (): Promise<boolean> => {
    try {
      setIsApiLoading(true);
      const available = await isApiAvailable();
      setApiAvailable(available);
      
      if (!available) {
        setApiError('API is not available.');
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
        checkApiAvailability
      }}
    >
      {children}
    </ApiContext.Provider>
  );
}