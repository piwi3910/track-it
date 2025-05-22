/**
 * Backend error handling utilities
 */
import { TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import { logger } from '../server';

// Define local error codes to avoid dependency on shared package
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

// Define local AppError class to avoid dependency on shared package
export class AppError extends Error {
  public details: {
    code: ErrorCode;
    message: string;
    statusCode?: number;
    field?: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId?: string;
    retryable?: boolean;
  };
  
  constructor(details: Omit<AppError['details'], 'timestamp'> & { timestamp?: string }) {
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
  static create(
    code: ErrorCode, 
    message: string, 
    additionalDetails?: Partial<Omit<AppError['details'], 'code' | 'message' | 'timestamp'>>
  ): AppError {
    return new AppError({
      code,
      message,
      ...additionalDetails
    });
  }

  /**
   * Create a JSON representation of the error
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      details: this.details
    };
  }
}

/**
 * Convert an error to a standardized TRPCError
 * This is used to ensure consistent error handling across the application
 */
export function handleError(error: unknown): never {
  // Log the error
  logger.error({ error }, 'Error encountered');
  
  // Type guard for AppError
  const isAppError = (err: any): err is AppError => {
    return (
      err &&
      typeof err === 'object' &&
      err.name === 'AppError' &&
      err.details &&
      typeof err.details === 'object' &&
      'code' in err.details
    );
  };
  
  if (isAppError(error)) {
    // If it's an AppError, convert it to a TRPCError
    throw new TRPCError({
      code: mapErrorCodeToTRPC(error.details.code),
      message: error.message,
      cause: error
    });
  } else if (error instanceof ZodError) {
    // Format Zod validation errors
    const formattedErrors = formatZodError(error);
    const message = Object.entries(formattedErrors)
      .map(([field, message]) => `${field}: ${message}`)
      .join('; ');
    
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Validation error: ${message}`,
      cause: error
    });
  } else if (error instanceof TRPCError) {
    // If it's already a TRPCError, just rethrow it
    throw error;
  } else if (error instanceof Error) {
    // For standard JS errors, convert to TRPCError
    if (error.message.toLowerCase().includes('not found') || error.message.toLowerCase().includes('does not exist')) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: error.message,
        cause: error
      });
    } else if (error.message.toLowerCase().includes('permission denied') ||
               error.message.toLowerCase().includes('not allowed') ||
               error.message.toLowerCase().includes('forbidden')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: error.message,
        cause: error
      });
    } else if (error.message.toLowerCase().includes('unauthorized') ||
               error.message.toLowerCase().includes('unauthenticated') ||
               error.message.toLowerCase().includes('authentication required')) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: error.message,
        cause: error
      });
    } else {
      // Default to internal server error
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
        cause: error
      });
    }
  } else {
    // Handle non-Error objects (strings, numbers, etc.)
    const message = typeof error === 'string'
      ? error
      : 'An unknown error occurred';
      
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message,
      cause: error
    });
  }
}

/**
 * Map our error codes to TRPC error codes
 */
function mapErrorCodeToTRPC(code: ErrorCode | string): TRPCError['code'] {
  const errorCode = typeof code === 'string' ? code : ErrorCode.UNKNOWN_ERROR;
  
  switch (errorCode) {
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_INPUT:
    case ErrorCode.MISSING_FIELD:
      return 'BAD_REQUEST';
      
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.TOKEN_EXPIRED:
      return 'UNAUTHORIZED';
      
    case ErrorCode.FORBIDDEN:
    case ErrorCode.OPERATION_NOT_ALLOWED:
      return 'FORBIDDEN';
      
    case ErrorCode.NOT_FOUND:
      return 'NOT_FOUND';
      
    case ErrorCode.CONFLICT:
    case ErrorCode.ALREADY_EXISTS:
      return 'CONFLICT';
      
    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return 'TOO_MANY_REQUESTS';
      
    case ErrorCode.TIMEOUT_ERROR:
      return 'TIMEOUT';
      
    case ErrorCode.NETWORK_ERROR:
    case ErrorCode.API_UNAVAILABLE:
    case ErrorCode.EXTERNAL_SERVICE_ERROR:
    case ErrorCode.GOOGLE_API_ERROR:
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.CACHE_ERROR:
    case ErrorCode.INTERNAL_SERVER_ERROR:
    case ErrorCode.UNKNOWN_ERROR:
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
}

/**
 * Format Zod validation errors into a user-friendly format
 */
function formatZodError(error: ZodError): Record<string, string> {
  const formattedErrors: Record<string, string> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'value';
    formattedErrors[path] = issue.message;
  }
  
  return formattedErrors;
}

/**
 * Create a standardized AppError for the specified resource not found
 */
export function createNotFoundError(resourceName: string, id?: string): AppError {
  const message = id 
    ? `${resourceName} with ID '${id}' not found` 
    : `${resourceName} not found`;
    
  return AppError.create(ErrorCode.NOT_FOUND, message, {
    statusCode: 404,
    field: id ? 'id' : undefined
  });
}

/**
 * Create a standardized AppError for validation errors
 */
export function createValidationError(message: string, field?: string): AppError {
  return AppError.create(ErrorCode.VALIDATION_ERROR, message, {
    statusCode: 400,
    field
  });
}


/**
 * Create a standardized AppError for unauthorized access
 */
export function createUnauthorizedError(message = 'Authentication required'): AppError {
  return AppError.create(ErrorCode.UNAUTHORIZED, message, {
    statusCode: 401
  });
}

/**
 * Create a standardized AppError for forbidden access
 */
export function createForbiddenError(message = 'Access denied'): AppError {
  return AppError.create(ErrorCode.FORBIDDEN, message, {
    statusCode: 403
  });
}

/**
 * Create a standardized AppError for database errors
 */
export function createDatabaseError(message: string, details?: any): AppError {
  return AppError.create(ErrorCode.DATABASE_ERROR, message, {
    statusCode: 500,
    details
  });
}

/**
 * Create a standardized AppError for external service errors
 */
export function createExternalServiceError(
  service: string, 
  message: string,
  details?: any
): AppError {
  return AppError.create(ErrorCode.EXTERNAL_SERVICE_ERROR, message, {
    statusCode: 502,
    details: {
      service,
      ...details
    }
  });
}

/**
 * Create a standardized AppError for Google API errors
 */
export function createGoogleApiError(message: string, details?: any): AppError {
  return AppError.create(ErrorCode.GOOGLE_API_ERROR, message, {
    statusCode: 502,
    details
  });
}

/**
 * Format an error for the API response according to the API specification
 * 
 * @param error Any error object
 * @returns Formatted error with message and code properties
 */
export function formatErrorResponse(error: any): { message: string; code: string } {
  // Default error response
  const defaultResponse = {
    message: "An unexpected error occurred",
    code: "INTERNAL_SERVER_ERROR"
  };
  
  // Type guard for AppError
  const isAppError = (err: any): err is AppError => {
    return (
      err && 
      typeof err === 'object' && 
      err.name === 'AppError' && 
      err.details && 
      typeof err.details === 'object' && 
      'code' in err.details
    );
  };
  
  // If it's an AppError, format according to API spec
  if (isAppError(error)) {
    return {
      message: error.message,
      code: error.details.code as string
    };
  } 
  // If it's a TRPCError, format accordingly
  else if (error && typeof error === 'object' && 'code' in error) {
    // Map TRPC error codes to API specification codes
    let code: string;
    switch (error.code) {
      case 'UNAUTHORIZED':
        code = 'UNAUTHORIZED';
        break;
      case 'FORBIDDEN':
        code = 'FORBIDDEN';
        break;
      case 'NOT_FOUND':
        code = 'NOT_FOUND';
        break;
      case 'BAD_REQUEST':
        code = 'VALIDATION_ERROR';
        break;
      default:
        code = 'INTERNAL_SERVER_ERROR';
    }
    
    return {
      message: error.message || defaultResponse.message,
      code
    };
  } 
  // Regular Error object
  else if (error instanceof Error) {
    let code = 'INTERNAL_SERVER_ERROR';
    
    // Try to guess appropriate code based on error message
    if (error.message.toLowerCase().includes('not found')) {
      code = 'NOT_FOUND';
    } else if (error.message.toLowerCase().includes('permission') || 
               error.message.toLowerCase().includes('forbidden')) {
      code = 'FORBIDDEN';
    } else if (error.message.toLowerCase().includes('unauthorized') || 
               error.message.toLowerCase().includes('authentication')) {
      code = 'UNAUTHORIZED';
    } else if (error.message.toLowerCase().includes('validation') || 
               error.message.toLowerCase().includes('invalid')) {
      code = 'VALIDATION_ERROR';
    }
    
    return {
      message: error.message,
      code
    };
  }
  
  // Default case for unknown error types
  return defaultResponse;
}