/**
 * Error types and utilities for the Track-It application
 * 
 * This module defines standardized error types, codes, and utilities
 * to be used across both frontend and backend.
 */

/**
 * Standard error codes used across the application
 */
export enum ErrorCode {
  // Connection errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Authentication/Authorization errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Input errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_FIELD = 'MISSING_FIELD',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  GOOGLE_API_ERROR = 'GOOGLE_API_ERROR',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Backend errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Standard error details structure
 */
export interface AppErrorDetails {
  code: ErrorCode;
  message: string;
  statusCode?: number;
  field?: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
  severity?: ErrorSeverity;
  recoverable?: boolean;
  retryable?: boolean;
}

/**
 * Standard application error class
 */
export class AppError extends Error {
  public details: AppErrorDetails;
  
  constructor(details: Omit<AppErrorDetails, 'timestamp'> & { timestamp?: string }) {
    super(details.message);
    this.name = 'AppError';
    this.details = {
      ...details,
      timestamp: details.timestamp || new Date().toISOString()
    };
  }

  /**
   * Create an error with the specified code and message
   */
  static create(code: ErrorCode, message: string, additionalDetails?: Partial<Omit<AppErrorDetails, 'code' | 'message' | 'timestamp'>>) {
    return new AppError({
      code,
      message,
      ...additionalDetails
    });
  }

  /**
   * Create a network error
   */
  static networkError(message = 'Network connection error') {
    return this.create(ErrorCode.NETWORK_ERROR, message, {
      severity: ErrorSeverity.ERROR,
      retryable: true
    });
  }

  /**
   * Create an API unavailable error
   */
  static apiUnavailable(message = 'API service is unavailable') {
    return this.create(ErrorCode.API_UNAVAILABLE, message, {
      severity: ErrorSeverity.ERROR,
      retryable: true
    });
  }

  /**
   * Create an unauthorized error
   */
  static unauthorized(message = 'Authentication required') {
    return this.create(ErrorCode.UNAUTHORIZED, message, {
      statusCode: 401,
      severity: ErrorSeverity.WARNING,
      recoverable: true
    });
  }

  /**
   * Create a forbidden error
   */
  static forbidden(message = 'Access denied') {
    return this.create(ErrorCode.FORBIDDEN, message, {
      statusCode: 403,
      severity: ErrorSeverity.WARNING,
      recoverable: false
    });
  }

  /**
   * Create a not found error
   */
  static notFound(resource?: string) {
    const message = resource
      ? `${resource} not found`
      : 'Resource not found';

    return this.create(ErrorCode.NOT_FOUND, message, {
      statusCode: 404,
      severity: ErrorSeverity.WARNING
    });
  }

  /**
   * Create a validation error
   */
  static validationError(message: string, field?: string, details?: Record<string, any>) {
    return this.create(ErrorCode.VALIDATION_ERROR, message, {
      statusCode: 400,
      field,
      details,
      severity: ErrorSeverity.WARNING,
      recoverable: true
    });
  }

  /**
   * Create a basic TRPC error object suitable for returning from the backend
   */
  toJSON(): AppErrorDetails {
    return {
      ...this.details,
      message: this.message
    };
  }
}

/**
 * Maps HTTP status codes to error codes
 */
export function mapHttpStatusToErrorCode(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCode.VALIDATION_ERROR;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 409:
      return ErrorCode.CONFLICT;
    case 429:
      return ErrorCode.RATE_LIMIT_EXCEEDED;
    case 500:
      return ErrorCode.INTERNAL_SERVER_ERROR;
    case 502:
    case 503:
    case 504:
      return ErrorCode.API_UNAVAILABLE;
    default:
      return ErrorCode.UNKNOWN_ERROR;
  }
}

/**
 * Maps error codes to HTTP status codes
 */
export function mapErrorCodeToHttpStatus(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_INPUT:
    case ErrorCode.MISSING_FIELD:
      return 400;
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.TOKEN_EXPIRED:
      return 401;
    case ErrorCode.FORBIDDEN:
    case ErrorCode.OPERATION_NOT_ALLOWED:
      return 403;
    case ErrorCode.NOT_FOUND:
      return 404;
    case ErrorCode.CONFLICT:
    case ErrorCode.ALREADY_EXISTS:
      return 409;
    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return 429;
    case ErrorCode.NETWORK_ERROR:
    case ErrorCode.TIMEOUT_ERROR:
    case ErrorCode.API_UNAVAILABLE:
    case ErrorCode.EXTERNAL_SERVICE_ERROR:
    case ErrorCode.GOOGLE_API_ERROR:
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.CACHE_ERROR:
    case ErrorCode.INTERNAL_SERVER_ERROR:
    case ErrorCode.UNKNOWN_ERROR:
    default:
      return 500;
  }
}

/**
 * Returns true if the error is retryable
 */
export function isRetryableError(error: AppError | ErrorCode): boolean {
  const code = error instanceof AppError ? error.details.code : error;
  
  switch (code) {
    case ErrorCode.NETWORK_ERROR:
    case ErrorCode.API_UNAVAILABLE:
    case ErrorCode.TIMEOUT_ERROR:
    case ErrorCode.EXTERNAL_SERVICE_ERROR:
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.CACHE_ERROR:
      return true;
    default:
      return false;
  }
}

/**
 * Returns true if the error is likely recoverable by the user
 */
export function isRecoverableError(error: AppError | ErrorCode): boolean {
  const code = error instanceof AppError ? error.details.code : error;
  
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_INPUT:
    case ErrorCode.MISSING_FIELD:
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.TOKEN_EXPIRED:
      return true;
    default:
      return false;
  }
}

/**
 * Utility to safely parse API responses into errors
 */
export function parseErrorResponse(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    // Handle standard JS errors
    return AppError.create(
      ErrorCode.UNKNOWN_ERROR,
      error.message,
      {
        details: {
          name: error.name,
          stack: error.stack
        }
      }
    );
  }
  
  // Handle error-like objects
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any;
    
    // Try to extract information from the error object
    if (errorObj.code && typeof errorObj.code === 'string' && Object.values(ErrorCode).includes(errorObj.code as ErrorCode)) {
      return AppError.create(
        errorObj.code as ErrorCode,
        errorObj.message || 'Unknown error',
        {
          details: errorObj.details,
          statusCode: errorObj.statusCode,
          field: errorObj.field
        }
      );
    }
    
    if (errorObj.message && typeof errorObj.message === 'string') {
      return AppError.create(
        ErrorCode.UNKNOWN_ERROR,
        errorObj.message,
        {
          details: { ...errorObj }
        }
      );
    }
  }
  
  // Handle primitive error cases
  return AppError.create(
    ErrorCode.UNKNOWN_ERROR,
    typeof error === 'string' ? error : 'An unknown error occurred',
    {
      details: { originalError: error }
    }
  );
}