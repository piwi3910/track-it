import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="flex flex-col items-center gap-4 p-6">
          <IconAlertTriangle size={48} className="text-red-600" />
          <h3 className="text-lg font-semibold">Something went wrong</h3>
          
          <p className="text-sm text-muted-foreground text-center">
            {this.state.error?.message || 
              'An error occurred while rendering this component.'}
          </p>
          
          {import.meta.env.DEV && this.state.errorInfo && (
            <Card className="w-full border bg-muted/50">
              <CardContent className="p-3 max-h-48 overflow-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {this.state.errorInfo.componentStack}
                </pre>
              </CardContent>
            </Card>
          )}
          
          <Button 
            onClick={this.handleReset}
            className="gap-2"
          >
            <IconRefresh size={16} />
            Try Again
          </Button>
        </CardContent>
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
    <div className="flex flex-col items-center gap-8 py-16 px-4 max-w-lg mx-auto mt-12">
      <IconAlertTriangle size={80} className="text-red-600" />
      <h2 className="text-2xl font-semibold text-center">Oops! Something went wrong</h2>
      <p className="text-muted-foreground text-center">
        We've encountered an error while loading this page. Our team has been notified.
      </p>
      <Button 
        onClick={handleReset}
        size="lg"
        className="gap-2"
      >
        <IconRefresh size={16} />
        Reload Page
      </Button>
      {import.meta.env.DEV && (
        <p className="text-xs text-muted-foreground text-center">
          Check the console for more details about this error.
        </p>
      )}
    </div>
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