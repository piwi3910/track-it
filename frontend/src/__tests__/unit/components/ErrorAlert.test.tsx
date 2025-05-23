import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MantineProvider } from '@mantine/core';
import { ErrorAlert, ConnectionErrorAlert, ValidationErrorAlert } from '../../../components/error/ErrorAlert';
import { describe, it, afterEach } from '@jest/globals';
import { jest } from '@jest/globals';
import { AppError, AppErrorDetails, ErrorCode, ErrorSeverity } from '@track-it/shared/types/errors';


// Mock timer functions
jest.useFakeTimers();

// Wrapper component for Mantine provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

const renderWithWrapper = (component: React.ReactElement) => {
  return render(component, { wrapper: TestWrapper });
};

describe('ErrorAlert', () => {
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('basic functionality', () => {
    it('should render error message when error is a string', () => {
      renderWithWrapper(<ErrorAlert error="Test error message" />);
      
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument(); // Default title
    });

    it('should not render when error is null', () => {
      const { container } = renderWithWrapper(<ErrorAlert error={null} />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should not render when error is empty string', () => {
      const { container } = renderWithWrapper(<ErrorAlert error="" />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should render custom title when provided', () => {
      renderWithWrapper(<ErrorAlert error="Test error" title="Custom Title" />);
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should render children when provided', () => {
      renderWithWrapper(
        <ErrorAlert error="Test error">
          <div>Custom content</div>
        </ErrorAlert>
      );
      
      expect(screen.getByText('Custom content')).toBeInTheDocument();
    });
  });

  describe('error type handling', () => {
    it('should handle AppError instances', () => {
      const appError = AppError.create(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        { severity: ErrorSeverity.WARNING, retryable: true }
      );

      renderWithWrapper(<ErrorAlert error={appError} />);
      
      expect(screen.getByText('Validation failed')).toBeInTheDocument();
      expect(screen.getByText('Validation Error')).toBeInTheDocument();
    });

    it('should handle AppErrorDetails objects', () => {
      const errorDetails: AppErrorDetails = {
        code: ErrorCode.NOT_FOUND,
        timestamp: new Date().toISOString(),
        message: 'Resource not found',
        severity: ErrorSeverity.ERROR,
        details: { id: '123' },
      };

      renderWithWrapper(<ErrorAlert error={errorDetails} showDetails />);
      
      expect(screen.getByText('Resource not found')).toBeInTheDocument();
      expect(screen.getByText('Not Found')).toBeInTheDocument();
      expect(screen.getByText('id: 123')).toBeInTheDocument();
    });

    it('should handle JavaScript Error instances', () => {
      const jsError = new Error('JavaScript error');

      renderWithWrapper(<ErrorAlert error={jsError} />);
      
      expect(screen.getByText('JavaScript error')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should handle unknown error types', () => {
      const unknownError = { unknown: 'error' };

      renderWithWrapper(<ErrorAlert error={unknownError as unknown as Error} />);
      
      expect(screen.getByText('An unknown error occurred')).toBeInTheDocument();
    });
  });

  describe('severity styling', () => {
    it('should use blue color for INFO severity', () => {
      const infoError = new AppError({
        code: ErrorCode.API_UNAVAILABLE,
        message: 'API info',
        severity: ErrorSeverity.INFO,
      });

      renderWithWrapper(<ErrorAlert error={infoError} />);
      
      // Check that the alert has the correct color attributes
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should use yellow color for WARNING severity', () => {
      const warningError = new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Warning message',
        severity: ErrorSeverity.WARNING,
      });

      renderWithWrapper(<ErrorAlert error={warningError} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should use red color for ERROR severity', () => {
      const error = AppError.create(
        ErrorCode.INTERNAL_SERVER_ERROR,
        'Error message',
        { severity: ErrorSeverity.ERROR }
      );

      renderWithWrapper(<ErrorAlert error={error} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should use red color for CRITICAL severity', () => {
      const criticalError = AppError.create(
        ErrorCode.INTERNAL_SERVER_ERROR,
        'Critical error',
        { severity: ErrorSeverity.CRITICAL }
      );

      renderWithWrapper(<ErrorAlert error={criticalError} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('error code specific titles', () => {
    it('should use "Connection Error" title for network errors', () => {
      const networkError = AppError.create(
        ErrorCode.NETWORK_ERROR,
        'Network failed'
      );

      renderWithWrapper(<ErrorAlert error={networkError} />);
      
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
    });

    it('should use "Authentication Required" title for auth errors', () => {
      const authError = AppError.create(
        ErrorCode.UNAUTHORIZED,
        'Not authorized'
      );

      renderWithWrapper(<ErrorAlert error={authError} />);
      
      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    });

    it('should use "Access Denied" title for forbidden errors', () => {
      const forbiddenError = AppError.create(
        ErrorCode.FORBIDDEN,
        'Access denied'
      );

      renderWithWrapper(<ErrorAlert error={forbiddenError} />);
      
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('interactive features', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = jest.fn();
      
      renderWithWrapper(<ErrorAlert error="Test error" onClose={onClose} />);
      
      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should show retry button for retryable errors', () => {
      const onRetry = jest.fn();
      const retryableError = AppError.create(
        ErrorCode.NETWORK_ERROR,
        'Network error',
        { retryable: true }
      );

      renderWithWrapper(<ErrorAlert error={retryableError} onRetry={onRetry} />);
      
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not show retry button for non-retryable errors', () => {
      const onRetry = jest.fn();
      const nonRetryableError = AppError.create(
        ErrorCode.VALIDATION_ERROR,
        'Validation error',
        { retryable: false }
      );

      renderWithWrapper(<ErrorAlert error={nonRetryableError} onRetry={onRetry} />);
      
      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });
  });

  describe('auto-close functionality', () => {
    it('should auto-close after timeout when autoClose is true', async () => {
      const onClose = jest.fn();
      
      renderWithWrapper(
        <ErrorAlert 
          error="Test error" 
          autoClose 
          autoCloseTimeout={1000}
          onClose={onClose} 
        />
      );
      
      expect(screen.getByText('Test error')).toBeInTheDocument();
      
      // Fast-forward time
      jest.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should not auto-close when autoClose is false', () => {
      const onClose = jest.fn();
      
      renderWithWrapper(
        <ErrorAlert 
          error="Test error" 
          autoClose={false}
          autoCloseTimeout={1000}
          onClose={onClose} 
        />
      );
      
      jest.advanceTimersByTime(1000);
      
      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithWrapper(<ErrorAlert error="Test error" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
      expect(alert).toHaveAttribute('aria-atomic', 'true');
    });
  });
});

describe('ConnectionErrorAlert', () => {
  it('should render with connection-specific styling and content', () => {
    const onRetry = jest.fn();
    
    renderWithWrapper(
      <ConnectionErrorAlert error="Connection failed" onRetry={onRetry} />
    );
    
    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(screen.getByText(/problem connecting to the server/)).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});

describe('ValidationErrorAlert', () => {
  it('should render with validation-specific styling', () => {
    renderWithWrapper(
      <ValidationErrorAlert error="Invalid email format" />
    );
    
    expect(screen.getByText('Validation Error')).toBeInTheDocument();
    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
  });

  it('should show field information when available', () => {
    const errorWithField = AppError.create(
      ErrorCode.VALIDATION_ERROR,
      'Invalid email',
      { field: 'email' }
    );

    renderWithWrapper(
      <ValidationErrorAlert error={errorWithField} />
    );
    
    expect(screen.getByText('(Field: email)')).toBeInTheDocument();
  });
});