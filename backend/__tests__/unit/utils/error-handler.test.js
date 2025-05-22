"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_handler_1 = require("../../../src/utils/error-handler");
const server_1 = require("@trpc/server");
const zod_1 = require("zod");
const server_2 = require("../../../src/server"); // Assuming logger is exported from server.ts
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
        expect(error_handler_1.ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
        expect(error_handler_1.ErrorCode.API_UNAVAILABLE).toBe('API_UNAVAILABLE');
        expect(error_handler_1.ErrorCode.TIMEOUT_ERROR).toBe('TIMEOUT_ERROR');
        expect(error_handler_1.ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
        expect(error_handler_1.ErrorCode.FORBIDDEN).toBe('FORBIDDEN');
        expect(error_handler_1.ErrorCode.TOKEN_EXPIRED).toBe('TOKEN_EXPIRED');
        expect(error_handler_1.ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
        expect(error_handler_1.ErrorCode.ALREADY_EXISTS).toBe('ALREADY_EXISTS');
        expect(error_handler_1.ErrorCode.CONFLICT).toBe('CONFLICT');
        expect(error_handler_1.ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
        expect(error_handler_1.ErrorCode.INVALID_INPUT).toBe('INVALID_INPUT');
        expect(error_handler_1.ErrorCode.MISSING_FIELD).toBe('MISSING_FIELD');
        expect(error_handler_1.ErrorCode.EXTERNAL_SERVICE_ERROR).toBe('EXTERNAL_SERVICE_ERROR');
        expect(error_handler_1.ErrorCode.GOOGLE_API_ERROR).toBe('GOOGLE_API_ERROR');
        expect(error_handler_1.ErrorCode.BUSINESS_RULE_VIOLATION).toBe('BUSINESS_RULE_VIOLATION');
        expect(error_handler_1.ErrorCode.OPERATION_NOT_ALLOWED).toBe('OPERATION_NOT_ALLOWED');
        expect(error_handler_1.ErrorCode.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
        expect(error_handler_1.ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR');
        expect(error_handler_1.ErrorCode.CACHE_ERROR).toBe('CACHE_ERROR');
        expect(error_handler_1.ErrorCode.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
        expect(error_handler_1.ErrorCode.INTERNAL_SERVER_ERROR).toBe('INTERNAL_SERVER_ERROR');
    });
});
describe('AppError', () => {
    it('should create an AppError instance with correct properties', () => {
        const error = error_handler_1.AppError.create(error_handler_1.ErrorCode.NOT_FOUND, 'Resource not found');
        expect(error).toBeInstanceOf(error_handler_1.AppError);
        expect(error.name).toBe('AppError');
        expect(error.message).toBe('Resource not found');
        expect(error.details.code).toBe(error_handler_1.ErrorCode.NOT_FOUND);
        expect(error.details.timestamp).toBeDefined();
    });
    it('should include additional details', () => {
        const error = error_handler_1.AppError.create(error_handler_1.ErrorCode.VALIDATION_ERROR, 'Invalid input', {
            statusCode: 400,
            field: 'email',
            details: { reason: 'format' },
        });
        expect(error.details.statusCode).toBe(400);
        expect(error.details.field).toBe('email');
        expect(error.details.details).toEqual({ reason: 'format' });
    });
    it('should return a JSON representation', () => {
        const error = error_handler_1.AppError.create(error_handler_1.ErrorCode.UNAUTHORIZED, 'Authentication failed');
        const json = error.toJSON();
        expect(json.name).toBe('AppError');
        expect(json.message).toBe('Authentication failed');
        expect(json.details.code).toBe(error_handler_1.ErrorCode.UNAUTHORIZED);
    });
});
describe('createNotFoundError', () => {
    it('should create a NOT_FOUND error for a resource', () => {
        const error = (0, error_handler_1.createNotFoundError)('Task');
        expect(error).toBeInstanceOf(error_handler_1.AppError);
        expect(error.details.code).toBe(error_handler_1.ErrorCode.NOT_FOUND);
        expect(error.message).toBe('Task not found');
        expect(error.details.statusCode).toBe(404);
        expect(error.details.field).toBeUndefined();
    });
    it('should create a NOT_FOUND error for a resource with ID', () => {
        const error = (0, error_handler_1.createNotFoundError)('Task', '123');
        expect(error.details.code).toBe(error_handler_1.ErrorCode.NOT_FOUND);
        expect(error.message).toBe('Task with ID \'123\' not found');
        expect(error.details.statusCode).toBe(404);
        expect(error.details.field).toBe('id');
    });
});
describe('createValidationError', () => {
    it('should create a VALIDATION_ERROR', () => {
        const error = (0, error_handler_1.createValidationError)('Invalid email format', 'email');
        expect(error).toBeInstanceOf(error_handler_1.AppError);
        expect(error.details.code).toBe(error_handler_1.ErrorCode.VALIDATION_ERROR);
        expect(error.message).toBe('Invalid email format');
        expect(error.details.statusCode).toBe(400);
        expect(error.details.field).toBe('email');
    });
});
describe('createUnauthorizedError', () => {
    it('should create an UNAUTHORIZED error with default message', () => {
        const error = (0, error_handler_1.createUnauthorizedError)();
        expect(error).toBeInstanceOf(error_handler_1.AppError);
        expect(error.details.code).toBe(error_handler_1.ErrorCode.UNAUTHORIZED);
        expect(error.message).toBe('Authentication required');
        expect(error.details.statusCode).toBe(401);
    });
    it('should create an UNAUTHORIZED error with custom message', () => {
        const error = (0, error_handler_1.createUnauthorizedError)('Invalid credentials');
        expect(error.message).toBe('Invalid credentials');
    });
});
describe('createForbiddenError', () => {
    it('should create a FORBIDDEN error with default message', () => {
        const error = (0, error_handler_1.createForbiddenError)();
        expect(error).toBeInstanceOf(error_handler_1.AppError);
        expect(error.details.code).toBe(error_handler_1.ErrorCode.FORBIDDEN);
        expect(error.message).toBe('Access denied');
        expect(error.details.statusCode).toBe(403);
    });
    it('should create a FORBIDDEN error with custom message', () => {
        const error = (0, error_handler_1.createForbiddenError)('User role not sufficient');
        expect(error.message).toBe('User role not sufficient');
    });
});
describe('createDatabaseError', () => {
    it('should create a DATABASE_ERROR', () => {
        const error = (0, error_handler_1.createDatabaseError)('Failed to connect to DB', { originalError: 'Connection refused' });
        expect(error).toBeInstanceOf(error_handler_1.AppError);
        expect(error.details.code).toBe(error_handler_1.ErrorCode.DATABASE_ERROR);
        expect(error.message).toBe('Failed to connect to DB');
        expect(error.details.statusCode).toBe(500);
        expect(error.details.details).toEqual({ originalError: 'Connection refused' });
    });
});
describe('createExternalServiceError', () => {
    it('should create an EXTERNAL_SERVICE_ERROR', () => {
        const error = (0, error_handler_1.createExternalServiceError)('Google', 'Google API is down', { status: 503 });
        expect(error).toBeInstanceOf(error_handler_1.AppError);
        expect(error.details.code).toBe(error_handler_1.ErrorCode.EXTERNAL_SERVICE_ERROR);
        expect(error.message).toBe('Google API is down');
        expect(error.details.statusCode).toBe(502);
        expect(error.details.details).toEqual({ service: 'Google', status: 503 });
    });
});
describe('createGoogleApiError', () => {
    it('should create a GOOGLE_API_ERROR', () => {
        const error = (0, error_handler_1.createGoogleApiError)('Google auth failed', { reason: 'invalid_token' });
        expect(error).toBeInstanceOf(error_handler_1.AppError);
        expect(error.details.code).toBe(error_handler_1.ErrorCode.GOOGLE_API_ERROR);
        expect(error.message).toBe('Google auth failed');
        expect(error.details.statusCode).toBe(502);
        expect(error.details.details).toEqual({ reason: 'invalid_token' });
    });
});
describe('handleError', () => {
    beforeEach(() => {
        server_2.logger.error.mockClear();
    });
    it('should convert AppError to TRPCError', () => {
        const appError = error_handler_1.AppError.create(error_handler_1.ErrorCode.NOT_FOUND, 'Item not found');
        expect(() => (0, error_handler_1.handleError)(appError)).toThrow(server_1.TRPCError);
        expect(() => (0, error_handler_1.handleError)(appError)).toThrow(expect.objectContaining({
            code: 'NOT_FOUND',
            message: 'Item not found',
        }));
    });
    it('should convert ZodError to TRPCError with BAD_REQUEST code', () => {
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(1, 'Name is required'),
            email: zod_1.z.string().email('Invalid email'),
        });
        const zodError = new zod_1.ZodError([
            { code: 'too_small', minimum: 1, type: 'string', inclusive: true, exact: false, path: ['name'], message: 'Name is required' },
            { code: 'invalid_string', validation: 'email', path: ['email'], message: 'Invalid email' },
        ]);
        expect(() => (0, error_handler_1.handleError)(zodError)).toThrow(server_1.TRPCError);
        expect(() => (0, error_handler_1.handleError)(zodError)).toThrow(expect.objectContaining({
            code: 'BAD_REQUEST',
            message: 'Validation error: name: Name is required; email: Invalid email',
        }));
    });
    it('should rethrow TRPCError', () => {
        const trpcError = new server_1.TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'TRPC error' });
        expect(() => (0, error_handler_1.handleError)(trpcError)).toThrow(trpcError);
    });
    it('should convert standard Error to TRPCError with NOT_FOUND code', () => {
        const error = new Error('Resource not found');
        expect(() => (0, error_handler_1.handleError)(error)).toThrow(server_1.TRPCError);
        expect(() => (0, error_handler_1.handleError)(error)).toThrow(expect.objectContaining({
            code: 'NOT_FOUND',
            message: 'Resource not found',
        }));
    });
    it('should convert standard Error to TRPCError with FORBIDDEN code', () => {
        const error = new Error('Permission denied');
        expect(() => (0, error_handler_1.handleError)(error)).toThrow(server_1.TRPCError);
        expect(() => (0, error_handler_1.handleError)(error)).toThrow(expect.objectContaining({
            code: 'FORBIDDEN',
            message: 'Permission denied',
        }));
    });
    it('should convert standard Error to TRPCError with UNAUTHORIZED code', () => {
        const error = new Error('Authentication required');
        expect(() => (0, error_handler_1.handleError)(error)).toThrow(server_1.TRPCError);
        expect(() => (0, error_handler_1.handleError)(error)).toThrow(expect.objectContaining({
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
        }));
    });
    it('should convert standard Error to TRPCError with INTERNAL_SERVER_ERROR code for unknown errors', () => {
        const error = new Error('Something went wrong');
        expect(() => (0, error_handler_1.handleError)(error)).toThrow(server_1.TRPCError);
        expect(() => (0, error_handler_1.handleError)(error)).toThrow(expect.objectContaining({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong',
        }));
    });
    it('should convert non-Error object to TRPCError with INTERNAL_SERVER_ERROR code', () => {
        const error = 'Just a string error';
        expect(() => (0, error_handler_1.handleError)(error)).toThrow(server_1.TRPCError);
        expect(() => (0, error_handler_1.handleError)(error)).toThrow(expect.objectContaining({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Just a string error',
        }));
    });
    it('should convert non-Error object to TRPCError with generic message if not string', () => {
        const error = 123;
        expect(() => (0, error_handler_1.handleError)(error)).toThrow(server_1.TRPCError);
        expect(() => (0, error_handler_1.handleError)(error)).toThrow(expect.objectContaining({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unknown error occurred',
        }));
    });
});
//# sourceMappingURL=error-handler.test.js.map