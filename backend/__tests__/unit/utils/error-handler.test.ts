import {
  ErrorCode,
  AppError,
  handleError,
  createNotFoundError,
  createValidationError,
  createUnauthorizedError,
  createForbiddenError,
  createDatabaseError,
  createExternalServiceError,
  createGoogleApiError,
} from '../../../src/utils/error-handler';
import { TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import { logger } from '../../../src/server'; // Assuming logger is exported from server.ts

// Mock the logger to prevent actual logging during tests
jest.mock('../../../src/server', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
  },
}));

describe('ErrorCode', () => {
  it('should have correct values', () => {
    expect(ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(ErrorCode.API_UNAVAILABLE).toBe('API_UNAVAILABLE');
    expect(ErrorCode.TIMEOUT_ERROR).toBe('TIMEOUT_ERROR');
    expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN');
    expect(ErrorCode.TOKEN_EXPIRED).toBe('TOKEN_EXPIRED');
    expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCode.ALREADY_EXISTS).toBe('ALREADY_EXISTS');
    expect(ErrorCode.CONFLICT).toBe('CONFLICT');
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCode.INVALID_INPUT).toBe('INVALID_INPUT');
    expect(ErrorCode.MISSING_FIELD).toBe('MISSING_FIELD');
    expect(ErrorCode.EXTERNAL_SERVICE_ERROR).toBe('EXTERNAL_SERVICE_ERROR');
    expect(ErrorCode.GOOGLE_API_ERROR).toBe('GOOGLE_API_ERROR');
    expect(ErrorCode.BUSINESS_RULE_VIOLATION).toBe('BUSINESS_RULE_VIOLATION');
    expect(ErrorCode.OPERATION_NOT_ALLOWED).toBe('OPERATION_NOT_ALLOWED');
    expect(ErrorCode.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
    expect(ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR');
    expect(ErrorCode.CACHE_ERROR).toBe('CACHE_ERROR');
    expect(ErrorCode.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
    expect(ErrorCode.INTERNAL_SERVER_ERROR).toBe('INTERNAL_SERVER_ERROR');
  });
});

describe('AppError', () => {
  it('should create an AppError instance with correct properties', () => {
    const error = AppError.create(ErrorCode.NOT_FOUND, 'Resource not found');
    expect(error).toBeInstanceOf(AppError);
    expect(error.name).toBe('AppError');
    expect(error.message).toBe('Resource not found');
    expect(error.details.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.details.timestamp).toBeDefined();
  });

  it('should include additional details', () => {
    const error = AppError.create(ErrorCode.VALIDATION_ERROR, 'Invalid input', {
      statusCode: 400,
      field: 'email',
      details: { reason: 'format' },
    });
    expect(error.details.statusCode).toBe(400);
    expect(error.details.field).toBe('email');
    expect(error.details.details).toEqual({ reason: 'format' });
  });

  it('should return a JSON representation', () => {
    const error = AppError.create(ErrorCode.UNAUTHORIZED, 'Authentication failed');
    const json = error.toJSON();
    expect(json.name).toBe('AppError');
    expect(json.message).toBe('Authentication failed');
    expect(json.details.code).toBe(ErrorCode.UNAUTHORIZED);
  });
});

describe('createNotFoundError', () => {
  it('should create a NOT_FOUND error for a resource', () => {
    const error = createNotFoundError('Task');
    expect(error).toBeInstanceOf(AppError);
    expect(error.details.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.message).toBe('Task not found');
    expect(error.details.statusCode).toBe(404);
    expect(error.details.field).toBeUndefined();
  });

  it('should create a NOT_FOUND error for a resource with ID', () => {
    const error = createNotFoundError('Task', '123');
    expect(error.details.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.message).toBe('Task with ID \'123\' not found');
    expect(error.details.statusCode).toBe(404);
    expect(error.details.field).toBe('id');
  });
});

describe('createValidationError', () => {
  it('should create a VALIDATION_ERROR', () => {
    const error = createValidationError('Invalid email format', 'email');
    expect(error).toBeInstanceOf(AppError);
    expect(error.details.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.message).toBe('Invalid email format');
    expect(error.details.statusCode).toBe(400);
    expect(error.details.field).toBe('email');
  });
});

describe('createUnauthorizedError', () => {
  it('should create an UNAUTHORIZED error with default message', () => {
    const error = createUnauthorizedError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.details.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(error.message).toBe('Authentication required');
    expect(error.details.statusCode).toBe(401);
  });

  it('should create an UNAUTHORIZED error with custom message', () => {
    const error = createUnauthorizedError('Invalid credentials');
    expect(error.message).toBe('Invalid credentials');
  });
});

describe('createForbiddenError', () => {
  it('should create a FORBIDDEN error with default message', () => {
    const error = createForbiddenError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.details.code).toBe(ErrorCode.FORBIDDEN);
    expect(error.message).toBe('Access denied');
    expect(error.details.statusCode).toBe(403);
  });

  it('should create a FORBIDDEN error with custom message', () => {
    const error = createForbiddenError('User role not sufficient');
    expect(error.message).toBe('User role not sufficient');
  });
});

describe('createDatabaseError', () => {
  it('should create a DATABASE_ERROR', () => {
    const error = createDatabaseError('Failed to connect to DB', { originalError: 'Connection refused' });
    expect(error).toBeInstanceOf(AppError);
    expect(error.details.code).toBe(ErrorCode.DATABASE_ERROR);
    expect(error.message).toBe('Failed to connect to DB');
    expect(error.details.statusCode).toBe(500);
    expect(error.details.details).toEqual({ originalError: 'Connection refused' });
  });
});

describe('createExternalServiceError', () => {
  it('should create an EXTERNAL_SERVICE_ERROR', () => {
    const error = createExternalServiceError('Google', 'Google API is down', { status: 503 });
    expect(error).toBeInstanceOf(AppError);
    expect(error.details.code).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
    expect(error.message).toBe('Google API is down');
    expect(error.details.statusCode).toBe(502);
    expect(error.details.details).toEqual({ service: 'Google', status: 503 });
  });
});

describe('createGoogleApiError', () => {
  it('should create a GOOGLE_API_ERROR', () => {
    const error = createGoogleApiError('Google auth failed', { reason: 'invalid_token' });
    expect(error).toBeInstanceOf(AppError);
    expect(error.details.code).toBe(ErrorCode.GOOGLE_API_ERROR);
    expect(error.message).toBe('Google auth failed');
    expect(error.details.statusCode).toBe(502);
    expect(error.details.details).toEqual({ reason: 'invalid_token' });
  });
});

describe('handleError', () => {
  beforeEach(() => {
    (logger.error as jest.Mock).mockClear();
  });

  it('should convert AppError to TRPCError', () => {
    const appError = AppError.create(ErrorCode.NOT_FOUND, 'Item not found');
    expect(() => handleError(appError)).toThrow(TRPCError);
    expect(() => handleError(appError)).toThrow(expect.objectContaining({
      code: 'NOT_FOUND',
      message: 'Item not found',
    }));
  });

  it('should convert ZodError to TRPCError with BAD_REQUEST code', () => {
    const zodError = new ZodError([
      { code: 'too_small', minimum: 1, type: 'string', inclusive: true, exact: false, path: ['name'], message: 'Name is required' },
      { code: 'invalid_string', validation: 'email', path: ['email'], message: 'Invalid email' },
    ]);

    expect(() => handleError(zodError)).toThrow(TRPCError);
    expect(() => handleError(zodError)).toThrow(expect.objectContaining({
      code: 'BAD_REQUEST',
      message: 'Validation error: name: Name is required; email: Invalid email',
    }));
  });

  it('should rethrow TRPCError', () => {
    const trpcError = new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'TRPC error' });
    expect(() => handleError(trpcError)).toThrow(trpcError);
  });

  it('should convert standard Error to TRPCError with NOT_FOUND code', () => {
    const error = new Error('Resource not found');
    expect(() => handleError(error)).toThrow(TRPCError);
    expect(() => handleError(error)).toThrow(expect.objectContaining({
      code: 'NOT_FOUND',
      message: 'Resource not found',
    }));
  });

  it('should convert standard Error to TRPCError with FORBIDDEN code', () => {
    const error = new Error('Permission denied');
    expect(() => handleError(error)).toThrow(TRPCError);
    expect(() => handleError(error)).toThrow(expect.objectContaining({
      code: 'FORBIDDEN',
      message: 'Permission denied',
    }));
  });

  it('should convert standard Error to TRPCError with UNAUTHORIZED code', () => {
    const error = new Error('Authentication required');
    expect(() => handleError(error)).toThrow(TRPCError);
    expect(() => handleError(error)).toThrow(expect.objectContaining({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    }));
  });

  it('should convert standard Error to TRPCError with INTERNAL_SERVER_ERROR code for unknown errors', () => {
    const error = new Error('Something went wrong');
    expect(() => handleError(error)).toThrow(TRPCError);
    expect(() => handleError(error)).toThrow(expect.objectContaining({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong',
    }));
  });

  it('should convert non-Error object to TRPCError with INTERNAL_SERVER_ERROR code', () => {
    const error = 'Just a string error';
    expect(() => handleError(error)).toThrow(TRPCError);
    expect(() => handleError(error)).toThrow(expect.objectContaining({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Just a string error',
    }));
  });

  it('should convert non-Error object to TRPCError with generic message if not string', () => {
    const error = 123;
    expect(() => handleError(error)).toThrow(TRPCError);
    expect(() => handleError(error)).toThrow(expect.objectContaining({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unknown error occurred',
    }));
  });
});