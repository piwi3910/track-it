import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconAlertCircle, IconAt, IconLock } from '@tabler/icons-react';
import { useApp } from '@/hooks/useApp';
import { useStore } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { logger } from '@/services/logger.service';

export default function LoginPage() {
  const { auth } = useStore();
  const { currentUser, userLoading } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Form state
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the return path if redirected from a protected route
  // This is passed via the 'from' property in the location state
  const from = location.state?.from?.pathname || '/dashboard';

  // Add informational message if redirected due to auth error
  useEffect(() => {
    if (location.state?.authError) {
      setError('Your session has expired. Please log in again.');
    }
  }, [location.state]);
  
  // Add event listener for auth state changes to handle redirects
  useEffect(() => {
    const handleAuthStateChange = (event: Event) => {
      // Check if we have a custom event with authentication details
      if (event instanceof CustomEvent && event.detail?.isAuthenticated) {
        // Redirect to the intended page
        navigate(from, { replace: true });
      }
    };
    
    window.addEventListener('auth_state_change', handleAuthStateChange);
    
    return () => {
      window.removeEventListener('auth_state_change', handleAuthStateChange);
    };
  }, [navigate, from]);

  // Redirect to previous location or dashboard if already logged in
  useEffect(() => {
    if (currentUser && !userLoading) {
      navigate(from, { replace: true });
    }
  }, [currentUser, userLoading, navigate, from]);

  const handlePasswordLogin = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const result = await auth.login(email, password);
      
      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }
      
      // Wait for the auth state to be updated
      await auth.loadUser();
      
      // Small delay to ensure state propagation
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
      
    } catch (err) {
      logger.error('Login failed', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setLoading(false);
    }
  };

  // Show a message if redirected from a protected route
  const isRedirected = location.state?.from && location.pathname !== '/dashboard';

  return (
    <div className="container max-w-md mx-auto p-8">
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center mb-6">
            <img
              src="/logo.png"
              alt="Track-It Logo"
              className="login-logo h-12 w-auto"
            />
          </div>

        {isRedirected && !error && (
          <Alert className="mb-4">
            <AlertDescription>
              Please log in to access {location.state.from.pathname}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <IconAlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-2 hover:opacity-70"
                aria-label="Close"
              >
                ×
              </button>
            </AlertDescription>
          </Alert>
        )}
        
          <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <IconAt className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <Button
            className="w-full mt-4"
            onClick={handlePasswordLogin}
            disabled={!email || !password || loading}
          >
            {loading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Loading...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
          
            <p className="text-xs text-muted-foreground text-center">
              Default credentials: demo@example.com / password123
            </p>
          </div>

          <Separator className="my-6" />

          <div className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <span className="text-blue-600 cursor-pointer hover:text-blue-800">
                Contact your administrator
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}