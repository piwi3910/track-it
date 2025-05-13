import { ReactNode } from 'react';
import { AppProvider as BaseAppProvider } from '@/context/AppContext';

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return <BaseAppProvider>{children}</BaseAppProvider>;
}