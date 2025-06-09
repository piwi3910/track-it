import { IconAlertCircle, IconInfoCircle, IconExclamationMark, IconX } from '@tabler/icons-react';
import { ReactNode, useEffect, useState } from 'react';
import { AppError, AppErrorDetails, ErrorCode, ErrorSeverity } from '@track-it/shared';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorAlertProps {
  error: AppError | AppErrorDetails | string | Error | null;
  onClose?: () => void;
  onRetry?: () => void;
  children?: ReactNode;
  title?: string;
  autoClose?: boolean;
  autoCloseTimeout?: number;
  showDetails?: boolean;
}

/**
 * A component for displaying error messages in a consistent way
 * Can handle different error types and provides appropriate styling
 */
export function ErrorAlert({ 
  error, 
  onClose, 
  onRetry,
  children, 
  title,
  autoClose,
  autoCloseTimeout = 5000,
  showDetails = false
}: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  // Auto-close the alert after a timeout if autoClose is true
  useEffect(() => {
    if (autoClose && error) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) {
          onClose();
        }
      }, autoCloseTimeout);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseTimeout, error, onClose]);
  
  // If error is null or empty, or if explicitly hidden, don't render anything
  if (!error || !isVisible) {
    return null;
  }
  
  // Determine the error details to display
  let errorMessage: string;
  let errorCode: ErrorCode | undefined;
  let errorDetails: Record<string, unknown> | undefined;
  let severity: ErrorSeverity = ErrorSeverity.ERROR;
  let isRetryable = false;
  
  // Extract error information based on the type
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof AppError) {
    errorMessage = error.message;
    errorCode = error.details.code;
    errorDetails = error.details.details;
    severity = error.details.severity || ErrorSeverity.ERROR;
    isRetryable = error.details.retryable || false;
  } else if ('code' in error && 'message' in error) {
    // It's an AppErrorDetails object
    errorMessage = error.message;
    errorCode = error.code as ErrorCode;
    errorDetails = error.details;
    severity = (error as AppErrorDetails).severity || ErrorSeverity.ERROR;
    isRetryable = (error as AppErrorDetails).retryable || false;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else {
    errorMessage = 'An unknown error occurred';
  }
  
  // Determine the alert color and icon based on severity
  let color: string;
  let Icon: React.ComponentType<{ size?: string | number; className?: string }> | null = null;
  
  switch (severity) {
    case ErrorSeverity.INFO:
      color = 'blue';
      Icon = IconInfoCircle;
      break;
    case ErrorSeverity.WARNING:
      color = 'yellow';
      Icon = IconExclamationMark;
      break;
    case ErrorSeverity.CRITICAL:
      color = 'red';
      Icon = IconAlertCircle;
      break;
    case ErrorSeverity.ERROR:
    default:
      color = 'red';
      Icon = IconAlertCircle;
      break;
  }
  
  // Determine the alert title based on the error code or provided title
  let alertTitle = title;
  if (!alertTitle && errorCode) {
    switch (errorCode) {
      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.API_UNAVAILABLE:
      case ErrorCode.TIMEOUT_ERROR:
        alertTitle = 'Connection Error';
        break;
      case ErrorCode.UNAUTHORIZED:
      case ErrorCode.TOKEN_EXPIRED:
        alertTitle = 'Authentication Required';
        break;
      case ErrorCode.FORBIDDEN:
        alertTitle = 'Access Denied';
        break;
      case ErrorCode.NOT_FOUND:
        alertTitle = 'Not Found';
        break;
      case ErrorCode.VALIDATION_ERROR:
      case ErrorCode.INVALID_INPUT:
      case ErrorCode.MISSING_FIELD:
        alertTitle = 'Validation Error';
        break;
      case ErrorCode.GOOGLE_API_ERROR:
        alertTitle = 'Google API Error';
        break;
    }
  }
  
  // If no title is determined, use a default
  if (!alertTitle) {
    alertTitle = 'Error';
  }
  
  // Accessibility attributes
  const alertAttributes = {
    role: 'alert' as const,
    'aria-live': 'assertive' as const,
    'aria-atomic': true
  };
  
  // Map color to alert variant and className
  let variant: 'default' | 'destructive' = 'default';
  let className = '';
  
  switch (color) {
    case 'red':
      variant = 'destructive';
      break;
    case 'yellow':
      className = 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100';
      break;
    case 'blue':
      className = 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100';
      break;
  }
  
  return (
    <Alert
      variant={variant}
      className={cn(className, onClose && 'relative pr-8')}
      {...alertAttributes}
    >
      {Icon && <Icon size={16} className="h-4 w-4" />}
      <div className="flex-1">
        <AlertTitle>{alertTitle}</AlertTitle>
        <AlertDescription>
          <div className="space-y-2">
            <p>{errorMessage}</p>
            
            {children}
            
            {showDetails && errorDetails && (
              <div className="text-xs text-muted-foreground space-y-1">
                {Object.entries(errorDetails).map(([key, value]) => (
                  <div key={key}>{key}: {value?.toString()}</div>
                ))}
              </div>
            )}
            
            {onRetry && isRetryable && (
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={onRetry}>
                  Retry
                </Button>
              </div>
            )}
          </div>
        </AlertDescription>
      </div>
      {onClose && (
        <button
          onClick={() => {
            setIsVisible(false);
            if (onClose) {
              onClose();
            }
          }}
          className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <IconX className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
    </Alert>
  );
}

/**
 * A specialized ErrorAlert for network/API errors with a retry button
 */
export function ConnectionErrorAlert({ 
  error, 
  onRetry, 
  onClose 
}: { 
  error: string | Error | AppError | AppErrorDetails; 
  onRetry: () => void; 
  onClose?: () => void;
}) {
  return (
    <ErrorAlert
      error={error}
      title="Connection Error"
      onClose={onClose}
      onRetry={onRetry}
    >
      <p className="text-sm">
        There was a problem connecting to the server. Please check your internet connection and try again.
      </p>
    </ErrorAlert>
  );
}

/**
 * A specialized ErrorAlert for validation errors
 */
export function ValidationErrorAlert({ 
  error, 
  onClose 
}: { 
  error: string | Error | AppError | AppErrorDetails; 
  onClose?: () => void;
}) {
  // Extract field information from the error if available
  let fieldInfo = '';
  if (error instanceof AppError && error.details.field) {
    fieldInfo = ` (Field: ${error.details.field})`;
  } else if (typeof error === 'object' && error !== null && 'field' in error) {
    fieldInfo = ` (Field: ${error.field})`;
  }
  
  return (
    <ErrorAlert
      error={error}
      title="Validation Error"
      onClose={onClose}
      showDetails={false}
    >
      {fieldInfo && <p className="text-sm text-muted-foreground">{fieldInfo}</p>}
    </ErrorAlert>
  );
}