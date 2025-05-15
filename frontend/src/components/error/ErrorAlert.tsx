import { Alert, Group, Stack, Text, Button } from '@mantine/core';
import { IconAlertCircle, IconInfoCircle, IconExclamationMark, IconX } from '@tabler/icons-react';
import { ReactNode, useEffect, useState } from 'react';
import { AppError, AppErrorDetails, ErrorCode, ErrorSeverity } from '@track-it/shared';

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
  let errorDetails: Record<string, any> | undefined;
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
    severity = (error as any).severity || ErrorSeverity.ERROR;
    isRetryable = (error as any).retryable || false;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else {
    errorMessage = 'An unknown error occurred';
  }
  
  // Determine the alert color and icon based on severity
  let color: string;
  let Icon: any;
  
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
    role: 'alert',
    'aria-live': 'assertive',
    'aria-atomic': 'true'
  };
  
  return (
    <Alert
      icon={<Icon size={16} />}
      color={color}
      title={alertTitle}
      withCloseButton={!!onClose}
      onClose={() => {
        setIsVisible(false);
        if (onClose) {
          onClose();
        }
      }}
      {...alertAttributes}
    >
      <Stack spacing="xs">
        <Text>{errorMessage}</Text>
        
        {children}
        
        {showDetails && errorDetails && (
          <Text size="xs" c="dimmed">
            {Object.entries(errorDetails).map(([key, value]) => (
              <div key={key}>{key}: {value?.toString()}</div>
            ))}
          </Text>
        )}
        
        {onRetry && isRetryable && (
          <Group position="right">
            <Button size="xs" variant="light" color={color} onClick={onRetry}>
              Retry
            </Button>
          </Group>
        )}
      </Stack>
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
  error: any; 
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
      <Text size="sm">
        There was a problem connecting to the server. Please check your internet connection and try again.
      </Text>
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
  error: any; 
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
      {fieldInfo && <Text size="sm" c="dimmed">{fieldInfo}</Text>}
    </ErrorAlert>
  );
}