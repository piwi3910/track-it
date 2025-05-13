import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  children: ReactNode;
}

export default function ProtectedRoute({ isAuthenticated, children }: ProtectedRouteProps) {
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page and store the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}