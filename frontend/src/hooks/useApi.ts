import { useContext } from 'react';
import { ApiContext } from '@/context/ApiContext.types';

export function useApi() {
  const context = useContext(ApiContext);
  
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  
  return context;
}