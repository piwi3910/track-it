import { useEffect } from 'react';
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
  rem
} from '@mantine/core';
import { IconBrandGoogle } from '@tabler/icons-react';
import { useApp } from '@/hooks/useApp';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

export default function LoginPage() {
  const { currentUser, userLoading } = useApp();
  const { login, loading, error } = useGoogleAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (currentUser && !userLoading) {
      navigate('/dashboard');
    }
  }, [currentUser, userLoading, navigate]);

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
          <Text c="red" ta="center" mb="md">
            {error}
          </Text>
        )}

        <Stack mb="md">
          <Button
            leftSection={<IconBrandGoogle size="1rem" />}
            variant="default"
            loading={loading}
            onClick={handleGoogleLogin}
            fullWidth
          >
            Continue with Google Workspace
          </Button>
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