import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Divider,
  Stack,
  Image,
  rem,
  Alert,
  TextInput,
  PasswordInput,
  Tabs
} from '@mantine/core';
import { IconBrandGoogle, IconAlertCircle, IconLogin, IconAt, IconLock } from '@tabler/icons-react';
import { useApp } from '@/hooks/useApp';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useStore } from '@/hooks/useStore';

export default function LoginPage() {
  const { auth } = useStore();
  const { currentUser, userLoading } = useApp();
  const { login: googleLogin, renderButton, isGoogleLoaded, loading: googleLoading, error: googleError } = useGoogleAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string | null>('password');
  
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

  // Initialize Google Sign-In button once Google Identity Services are loaded
  useEffect(() => {
    if (activeTab === 'google' && isGoogleLoaded && googleButtonRef.current) {
      renderButton('google-signin-button');
    }
  }, [isGoogleLoaded, renderButton, activeTab]);

  const handleGoogleLogin = async () => {
    setError(null);
    const success = await googleLogin();
    
    if (success) {
      // Manually redirect after successful login
      navigate(from, { replace: true });
    }
  };
  
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
      console.error('Login failed:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setLoading(false);
    }
  };

  // Show a message if redirected from a protected route
  const isRedirected = location.state?.from && location.pathname !== '/dashboard';

  return (
    <Container size="xs" p="xl">
      <Paper radius="md" p="xl" withBorder>
        <Stack align="center" mb="lg">
          <Image
            src="/logo.png"
            alt="Track-It Logo"
            className="login-logo"
          />
        </Stack>

        {isRedirected && !error && (
          <Alert 
            color="blue" 
            mb="md"
          >
            Please log in to access {location.state.from.pathname}
          </Alert>
        )}

        {(error || googleError) && (
          <Alert 
            icon={<IconAlertCircle size="1rem" />} 
            title="Authentication Error" 
            color="red" 
            mb="md"
            withCloseButton
            onClose={() => setError(null)}
          >
            {error || googleError}
          </Alert>
        )}
        
        <Tabs value={activeTab} onChange={setActiveTab} mb="md">
          <Tabs.List grow>
            <Tabs.Tab value="password" leftSection={<IconLogin size="0.8rem" />}>
              Password
            </Tabs.Tab>
            <Tabs.Tab 
              value="google" 
              leftSection={<IconBrandGoogle size="0.8rem" />}
              className="disabled coming-soon"
            >
              Google
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {activeTab === 'password' ? (
          <Stack gap="md">
            <TextInput
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              leftSection={<IconAt size="1rem" />}
              required
            />
            
            <PasswordInput
              label="Password"
              placeholder="Your password"
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              leftSection={<IconLock size="1rem" />}
              required
            />
            
            <Button
              fullWidth
              mt="md"
              loading={loading}
              onClick={handlePasswordLogin}
            >
              Sign in
            </Button>
            
            <Text size="xs" c="dimmed" ta="center">
              Default credentials: demo@example.com / password123
            </Text>
          </Stack>
        ) : (
          <Stack gap="md">
            {/* Button that triggers Google One Tap dialog */}
            <Button
              leftSection={<IconBrandGoogle size="1rem" />}
              variant="default"
              loading={googleLoading}
              onClick={handleGoogleLogin}
              fullWidth
            >
              Continue with Google Workspace
            </Button>
            
            {/* Container for Google Sign-In button */}
            <div 
              id="google-signin-button" 
              ref={googleButtonRef}
              style={{ 
                display: 'flex', 
                justifyContent: 'center',
                marginTop: '8px' 
              }}
            />

            {!isGoogleLoaded && (
              <Text size="sm" c="dimmed" ta="center">
                Loading Google authentication...
              </Text>
            )}
          </Stack>
        )}

        <Divider my="lg" />

        <Group justify="center" mt="md">
          <Text size="sm" c="dimmed">
            Don't have an account?{' '}
            <Text span c="blue" style={{ cursor: 'pointer' }}>
              Contact your administrator
            </Text>
          </Text>
        </Group>
      </Paper>
    </Container>
  );
}