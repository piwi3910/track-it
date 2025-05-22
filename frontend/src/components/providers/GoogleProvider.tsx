import { ReactNode } from 'react';
import { GoogleProvider as GoogleContextProvider } from '@/context/GoogleContext';

interface GoogleProviderProps {
  children: ReactNode;
}

export function GoogleProvider({ children }: GoogleProviderProps) {
  return (
    <GoogleContextProvider>
      {children}
    </GoogleContextProvider>
  );
}