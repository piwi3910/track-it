import { createContext } from 'react';

export interface ApiContextType {
  apiAvailable: boolean;
  isApiLoading: boolean;
  apiError: string | null;
  checkApiAvailability: () => Promise<boolean>;
}

export const ApiContext = createContext<ApiContextType | undefined>(undefined);