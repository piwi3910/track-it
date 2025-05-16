/**
 * Backend error handling utilities
 */
import { TRPCError } from '@trpc/server';
import { AppError, ErrorCode, mapErrorCodeToHttpStatus } from '@track-it/shared';
import { ZodError } from 'zod';

/**
 * Convert an error to a standardized TRPCError
 * This is used to ensure consistent error handling across the application
 */
export function handleError(error: unknown): never {
  // Log the error (in production, this could use a proper logging service)
  console.error('Error encountered:', error);
  
  if (error instanceof AppError) {
    // If it's already an AppError, convert it to a TRPCError
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
    // You can add special handling for known error types
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: error.message,
        cause: error
      });
    } else if (error.message.includes('permission') || 
               error.message.includes('not allowed') || 
               error.message.includes('forbidden')) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: error.message,
        cause: error
      });
    } else if (error.message.includes('unauthorized') || 
               error.message.includes('unauthenticated') || 
               error.message.includes('authentication')) {
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
function mapErrorCodeToTRPC(code: ErrorCode): TRPCError['code'] {
  switch (code) {
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
    const path = issue.path.join('.');
    formattedErrors[path || 'value'] = issue.message;
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
  // Create basic error structure if AppError.create is not available
  if (!AppError || typeof AppError.create !== 'function') {
    return {
      name: 'AppError',
      message,
      details: {
        code: ErrorCode.UNAUTHORIZED,
        message,
        statusCode: 401,
        timestamp: new Date().toISOString()
      }
    } as AppError;
  }
  
  return AppError.create(ErrorCode.UNAUTHORIZED, message, {
    statusCode: 401
  });
}

/**
 * Create a standardized AppError for forbidden access
 */
export function createForbiddenError(message = 'Access denied'): AppError {
  // Create basic error structure if AppError.create is not available
  if (!AppError || typeof AppError.create !== 'function') {
    return {
      name: 'AppError',
      message,
      details: {
        code: ErrorCode.FORBIDDEN,
        message,
        statusCode: 403,
        timestamp: new Date().toISOString()
      }
    } as AppError;
  }
  
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