import { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import { errorLoggingService } from '@/services/error-logging.service';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  logError?: boolean;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary component to catch JavaScript errors in child components
 * and display a fallback UI instead of crashing the whole application.
 * 
 * Usage:
 * ```jsx
 * <ErrorBoundary>
 *   <ComponentThatMightError />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the error service
    if (this.props.logError !== false) {
      errorLoggingService.logError(error, {
        componentStack: errorInfo.componentStack,
        componentName: this.props.componentName,
        boundary: 'ErrorBoundary',
        timestamp: new Date().toISOString()
      });
    }
    
    // Store error info for debugging display
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    // Reset the error boundary state
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    
    // Call the optional onReset callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    // If there's no error, render children normally
    if (!this.state.hasError) {
      return this.props.children;
    }

    // If a custom fallback is provided, use that
    if (this.props.fallback) {
      return this.props.fallback;
    }

    // Otherwise, render the default error UI
    return (
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Stack align="center" gap="md">
          <IconAlertTriangle size={48} color="red" />
          <Title order={3}>Something went wrong</Title>
          
          <Text c="dimmed" size="sm" ta="center">
            {this.state.error?.message || 
              'An error occurred while rendering this component.'}
          </Text>
          
          {import.meta.env.DEV && this.state.errorInfo && (
            <Card withBorder p="xs" bg="gray.0" style={{ overflow: 'auto', maxHeight: '200px', width: '100%' }}>
              <Text size="xs" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                {this.state.errorInfo.componentStack}
              </Text>
            </Card>
          )}
          
          <Group>
            <Button 
              leftSection={<IconRefresh size={16} />} 
              onClick={this.handleReset}
              color="blue"
            >
              Try Again
            </Button>
          </Group>
        </Stack>
      </Card>
    );
  }
}

/**
 * A specialized ErrorBoundary for wrapping page components.
 * It provides a more user-friendly error page for major failures.
 */
export function PageErrorBoundary({ children, onReset }: { children: ReactNode; onReset?: () => void }) {
  const handleReset = () => {
    // Refresh the page on reset for page-level errors
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };
  
  const pageFallback = (
    <Stack align="center" gap="xl" py="xl" maw={500} mx="auto" mt={50}>
      <IconAlertTriangle size={80} color="red" />
      <Title order={2} ta="center">Oops! Something went wrong</Title>
      <Text c="dimmed" ta="center">
        We've encountered an error while loading this page. Our team has been notified.
      </Text>
      <Group>
        <Button 
          leftSection={<IconRefresh size={16} />} 
          onClick={handleReset}
          color="blue"
          size="md"
        >
          Reload Page
        </Button>
      </Group>
      {import.meta.env.DEV && (
        <Text size="xs" c="dimmed" ta="center">
          Check the console for more details about this error.
        </Text>
      )}
    </Stack>
  );
  
  return (
    <ErrorBoundary 
      fallback={pageFallback} 
      onReset={handleReset}
      componentName="PageComponent"
      logError={true}
    >
      {children}
    </ErrorBoundary>
  );
}