/**
 * Backend error handling utilities
 */
import { TRPCError } from '@trpc/server';
import { ZodError } from 'zod';

// Import error types from shared package
// Note: If there are import errors, we define fallbacks to ensure the app works
let AppError: any;
enum ErrorCode {
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

// Try to import from shared package, but use local fallbacks if it fails
try {
  const sharedImport = require('@track-it/shared');
  if (sharedImport.AppError && sharedImport.ErrorCode) {
    AppError = sharedImport.AppError;
    // Keep our local ErrorCode enum for safety
  }
} catch (e) {
  console.error('Failed to import error types from shared package, using fallbacks', e);
}

// Create a fallback AppError if needed
if (!AppError) {
  AppError = class AppError extends Error {
    public details: any;
    
    constructor(details: any) {
      super(details.message);
      this.name = 'AppError';
      this.details = {
        ...details,
        timestamp: details.timestamp || new Date().toISOString()
      };
    }
    
    static create(code: ErrorCode, message: string, additionalDetails?: any) {
      return new AppError({
        code,
        message,
        ...additionalDetails
      });
    }
  };
}

/**
 * Convert an error to a standardized TRPCError
 * This is used to ensure consistent error handling across the application
 */
export function handleError(error: unknown): never {
  // Log the error (in production, this could use a proper logging service)
  console.error('Error encountered:', error);
  
  // Safe check for AppError - check if it matches our expected structure
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
 * Always uses our local ErrorCode enum values for safety
 */
function mapErrorCodeToTRPC(code: string): TRPCError['code'] {
  // Convert string code to our local enum if it's a string
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
    
  // Always use our local ErrorCode enum for safety
  const NOT_FOUND_CODE = ErrorCode.NOT_FOUND;
  
  // Create basic error structure if AppError.create is not available
  if (!AppError || typeof AppError.create !== 'function') {
    return {
      name: 'AppError',
      message,
      details: {
        code: NOT_FOUND_CODE,
        message,
        statusCode: 404,
        field: id ? 'id' : undefined,
        timestamp: new Date().toISOString()
      }
    } as AppError;
  }
  
  return AppError.create(NOT_FOUND_CODE, message, {
    statusCode: 404,
    field: id ? 'id' : undefined
  });
}

/**
 * Create a standardized AppError for validation errors
 */
export function createValidationError(message: string, field?: string): AppError {
  // Always use our local ErrorCode enum for safety
  const VALIDATION_ERROR_CODE = ErrorCode.VALIDATION_ERROR;
  
  // Create basic error structure if AppError.create is not available
  if (!AppError || typeof AppError.create !== 'function') {
    return {
      name: 'AppError',
      message,
      details: {
        code: VALIDATION_ERROR_CODE,
        message,
        statusCode: 400,
        field,
        timestamp: new Date().toISOString()
      }
    } as AppError;
  }
  
  return AppError.create(VALIDATION_ERROR_CODE, message, {
    statusCode: 400,
    field
  });
}

/**
 * Create a standardized AppError for unauthorized access
 */
export function createUnauthorizedError(message = 'Authentication required'): AppError {
  // Always use our local ErrorCode enum for safety
  const UNAUTHORIZED_CODE = ErrorCode.UNAUTHORIZED;
  
  // Create basic error structure if AppError.create is not available
  if (!AppError || typeof AppError.create !== 'function') {
    return {
      name: 'AppError',
      message,
      details: {
        code: UNAUTHORIZED_CODE,
        message,
        statusCode: 401,
        timestamp: new Date().toISOString()
      }
    } as AppError;
  }
  
  return AppError.create(UNAUTHORIZED_CODE, message, {
    statusCode: 401
  });
}

/**
 * Create a standardized AppError for forbidden access
 */
export function createForbiddenError(message = 'Access denied'): AppError {
  // Always use our local ErrorCode enum for safety
  const FORBIDDEN_CODE = ErrorCode.FORBIDDEN;
  
  // Create basic error structure if AppError.create is not available
  if (!AppError || typeof AppError.create !== 'function') {
    return {
      name: 'AppError',
      message,
      details: {
        code: FORBIDDEN_CODE,
        message,
        statusCode: 403,
        timestamp: new Date().toISOString()
      }
    } as AppError;
  }
  
  return AppError.create(FORBIDDEN_CODE, message, {
    statusCode: 403
  });
}

/**
 * Create a standardized AppError for database errors
 */
export function createDatabaseError(message: string, details?: any): AppError {
  // Always use our local ErrorCode enum for safety
  const DATABASE_ERROR_CODE = ErrorCode.DATABASE_ERROR;
  
  // Create basic error structure if AppError.create is not available
  if (!AppError || typeof AppError.create !== 'function') {
    return {
      name: 'AppError',
      message,
      details: {
        code: DATABASE_ERROR_CODE,
        message,
        statusCode: 500,
        details,
        timestamp: new Date().toISOString()
      }
    } as AppError;
  }
  
  return AppError.create(DATABASE_ERROR_CODE, message, {
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
  // Always use our local ErrorCode enum for safety
  const EXTERNAL_SERVICE_ERROR_CODE = ErrorCode.EXTERNAL_SERVICE_ERROR;
  
  // Create basic error structure if AppError.create is not available
  if (!AppError || typeof AppError.create !== 'function') {
    return {
      name: 'AppError',
      message,
      details: {
        code: EXTERNAL_SERVICE_ERROR_CODE,
        message,
        statusCode: 502,
        details: {
          service,
          ...details
        },
        timestamp: new Date().toISOString()
      }
    } as AppError;
  }
  
  return AppError.create(EXTERNAL_SERVICE_ERROR_CODE, message, {
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
  // Always use our local ErrorCode enum for safety
  const GOOGLE_API_ERROR_CODE = ErrorCode.GOOGLE_API_ERROR;
  
  // Create basic error structure if AppError.create is not available
  if (!AppError || typeof AppError.create !== 'function') {
    return {
      name: 'AppError',
      message,
      details: {
        code: GOOGLE_API_ERROR_CODE,
        message,
        statusCode: 502,
        details,
        timestamp: new Date().toISOString()
      }
    } as AppError;
  }
  
  return AppError.create(GOOGLE_API_ERROR_CODE, message, {
    statusCode: 502,
    details
  });
}