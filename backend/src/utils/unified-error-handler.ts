/**
 * Unified error handling utilities using shared types
 */
import { TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import { AppError, ErrorCode } from '@track-it/shared';
import { logger } from '../server';

/**
 * Convert any error to a TRPCError with appropriate code
 */
export function handleError(error: unknown): never {
  // If it's already a TRPCError, just throw it
  if (error instanceof TRPCError) {
    throw error;
  }

  // Handle AppError from shared types
  if (error instanceof AppError) {
    const trpcCode = mapErrorCodeToTRPC(error.details.code);
    throw new TRPCError({
      code: trpcCode,
      message: error.message,
      cause: error
    });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Validation error',
      cause: error
    });
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;
    
    // Prisma error codes
    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Resource already exists'
        });
      case 'P2025': // Record not found
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Resource not found'
        });
      case 'P2003': // Foreign key constraint violation
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid reference'
        });
      default:
        break;
    }
  }

  // Log unexpected errors
  logger.error({ error }, 'Unexpected error in handler');

  // Default to internal server error
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: error instanceof Error ? error.message : 'An unexpected error occurred'
  });
}

/**
 * Map shared ErrorCode to TRPC error code
 */
function mapErrorCodeToTRPC(code: ErrorCode): TRPCError['code'] {
  switch (code) {
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.TOKEN_EXPIRED:
      return 'UNAUTHORIZED';
    
    case ErrorCode.FORBIDDEN:
    case ErrorCode.OPERATION_NOT_ALLOWED:
      return 'FORBIDDEN';
    
    case ErrorCode.NOT_FOUND:
      return 'NOT_FOUND';
    
    case ErrorCode.ALREADY_EXISTS:
    case ErrorCode.CONFLICT:
      return 'CONFLICT';
    
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_INPUT:
    case ErrorCode.MISSING_FIELD:
      return 'BAD_REQUEST';
    
    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return 'TOO_MANY_REQUESTS';
    
    case ErrorCode.NETWORK_ERROR:
    case ErrorCode.API_UNAVAILABLE:
    case ErrorCode.TIMEOUT_ERROR:
    case ErrorCode.EXTERNAL_SERVICE_ERROR:
    case ErrorCode.GOOGLE_API_ERROR:
      return 'INTERNAL_SERVER_ERROR';
    
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.CACHE_ERROR:
    case ErrorCode.INTERNAL_SERVER_ERROR:
    case ErrorCode.UNKNOWN_ERROR:
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
}

/**
 * Create specific error types using shared AppError
 */
export function createNotFoundError(resource: string, id?: string): AppError {
  const message = id 
    ? `${resource} with ID ${id} not found`
    : `${resource} not found`;
  return AppError.notFound(message);
}

export function createUnauthorizedError(message: string = 'Unauthorized'): AppError {
  return AppError.unauthorized(message);
}

export function createForbiddenError(message: string = 'You do not have permission to perform this action'): AppError {
  return AppError.forbidden(message);
}

export function createValidationError(message: string, field?: string): AppError {
  return AppError.validationError(message, field);
}

export function createConflictError(message: string): AppError {
  return AppError.create(ErrorCode.CONFLICT, message);
}

export function createDatabaseError(message: string, details?: unknown): AppError {
  logger.error({ details }, message);
  return AppError.create(ErrorCode.DATABASE_ERROR, message, { 
    details: details as Record<string, any> 
  });
}

export function createExternalServiceError(service: string, message: string, details?: unknown): AppError {
  logger.error({ service, details }, message);
  return AppError.create(ErrorCode.EXTERNAL_SERVICE_ERROR, message, { 
    details: { service, ...(typeof details === 'object' ? details : { data: details }) }
  });
}

/**
 * Wrap an async procedure with error handling
 */
export async function safeProcedure<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    handleError(error);
  }
}