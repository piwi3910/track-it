import { useContext } from 'react';
import { GoogleContext } from '@/context/GoogleContext';

export function useGoogle() {
  const context = useContext(GoogleContext);
  if (context === undefined) {
    throw new Error('useGoogle must be used within a GoogleProvider');
  }
  return context;
}