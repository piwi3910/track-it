import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Alert
} from '@mantine/core';
import { IconBrandGoogle, IconAlertCircle } from '@tabler/icons-react';
import { useApp } from '@/hooks/useApp';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

export default function LoginPage() {
  const { currentUser, userLoading } = useApp();
  const { login, renderButton, isGoogleLoaded, loading, error } = useGoogleAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (currentUser && !userLoading) {
      navigate('/dashboard');
    }
  }, [currentUser, userLoading, navigate]);

  // Initialize Google Sign-In button once Google Identity Services are loaded
  useEffect(() => {
    if (isGoogleLoaded && googleButtonRef.current) {
      renderButton('google-signin-button');
    }
  }, [isGoogleLoaded, renderButton]);

  const handleGoogleLogin = async () => {
    await login();
    // The useEffect hook will handle redirection after successful login
    // when currentUser is updated
  };

  return (
    <Container size="xs" p="xl">
      <Paper radius="md" p="xl" withBorder>
        <Stack align="center" mb="md">
          <Title mb="lg">Track-It</Title>
          <Image
            src="/vite.svg" // Replace with your app logo
            alt="Track-It Logo"
            width={rem(100)}
            height={rem(100)}
          />
        </Stack>

        <Text size="lg" fw={500} ta="center" mb="xl">
          Sign in to your account
        </Text>

        {error && (
          <Alert 
            icon={<IconAlertCircle size="1rem" />} 
            title="Authentication Error" 
            color="red" 
            mb="md"
          >
            {error}
          </Alert>
        )}

        <Stack mb="md" gap="md">
          {/* Button that triggers Google One Tap dialog */}
          <Button
            leftSection={<IconBrandGoogle size="1rem" />}
            variant="default"
            loading={loading}
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

        <Divider label="Or" labelPosition="center" my="lg" />

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