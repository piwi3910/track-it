import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/hooks/useStore';

/**
 * AuthErrorHandler component
 * Listens for auth errors and redirects to login when unauthorized
 */
export function AuthErrorHandler() {
  const { api, auth } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Function to handle auth errors
    const checkAuthErrors = () => {
      // Check for 401 errors in API error messages
      const hasAuthError = api.error?.includes('UNAUTHORIZED') ||
                          api.error?.includes('401') ||
                          api.recentErrors.some(err => 
                            err.includes('UNAUTHORIZED') || 
                            err.includes('401')
                          );
      
      // Check for 401 errors in auth store
      const hasAuthStoreError = auth.error?.includes('UNAUTHORIZED') ||
                               auth.error?.includes('401');
      
      // If there are auth errors and the user was authenticated
      if ((hasAuthError || hasAuthStoreError) && auth.isAuthenticated) {
        console.log('Authentication error detected, logging out user');
        
        // Log the user out
        auth.logout();
        
        // Clear errors
        api.clearErrors();
        auth.clearError();
        
        // Redirect to login page with the intended destination
        if (location.pathname !== '/login') {
          navigate('/login', { 
            state: { from: location },
            replace: true
          });
        }
      }
    };
    
    // Check immediately
    checkAuthErrors();
    
    // Create an interval to periodically check for auth errors
    const intervalId = setInterval(checkAuthErrors, 5000);
    
    // Cleanup
    return () => {
      clearInterval(intervalId);
    };
  }, [api.error, api.recentErrors, auth, navigate, location]);
  
  // This component doesn't render anything
  return null;
}

export default AuthErrorHandler;