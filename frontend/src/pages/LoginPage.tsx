import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Text,
  Group,
  Divider,
  Stack,
  Image,
  Alert
} from '@mantine/core';
import { IconAlertCircle, IconAt, IconLock } from '@tabler/icons-react';
import { useApp } from '@/hooks/useApp';
import { useStore } from '@/hooks/useStore';
import { AppButton } from '@/components/ui/AppButton';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { AppPasswordInput } from '@/components/ui/AppPasswordInput';

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

        {error && (
          <Alert 
            icon={<IconAlertCircle size="1rem" />} 
            title="Authentication Error" 
            color="red" 
            mb="md"
            withCloseButton
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}
        
        <Stack gap="md">
          <AppTextInput
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            leftSection={<IconAt size={16} />}
            required
          />
          
          <AppPasswordInput
            label="Password"
            placeholder="Your password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            leftSection={<IconLock size={16} />}
            required
          />
          
          <AppButton
            fullWidth
            mt="md"
            loading={loading}
            onClick={handlePasswordLogin}
            disabled={!email || !password}
          >
            Sign in
          </AppButton>
          
          <Text size="xs" c="dimmed" ta="center">
            Default credentials: demo@example.com / password123
          </Text>
        </Stack>

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