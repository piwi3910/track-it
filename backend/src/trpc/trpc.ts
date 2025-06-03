import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Context } from './context';
import { 
  handleError, 
  createUnauthorizedError, 
  createForbiddenError,
  formatErrorResponse
} from '../utils/error-handler';

// Initialize tRPC with context type
const t = initTRPC.context<Context>().create({
  // No transformer - we'll use plain JSON
  transformer: undefined,
  errorFormatter({ shape, error }) {
    // Get HTTP status code for internal use
    const httpStatus = getHttpStatusFromError(error);
    
    // Special handling for Zod validation errors
    if (error.cause instanceof z.ZodError) {
      // Format validation error message from all Zod issues
      const formattedIssues = error.cause.issues.map(issue => {
        const path = issue.path.join('.') || 'value';
        return `${path}: ${issue.message}`;
      }).join('; ');
      
      return {
        ...shape,
        data: {
          httpStatus,
          message: formattedIssues || 'Validation error',
          code: 'VALIDATION_ERROR'
        }
      };
    }
    
    // If the error or cause directly has a code property, use it
    if (error.cause && typeof error.cause === 'object' && 'code' in error.cause) {
      return {
        ...shape,
        data: {
          httpStatus,
          message: error.cause.message || 'An error occurred',
          code: error.cause.code
        }
      };
    }
    
    // Check if the original error has a code
    if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' && error.code !== 'INTERNAL_SERVER_ERROR') {
      // It has a specific error code, preserve it
      return {
        ...shape,
        data: {
          httpStatus,
          message: error.message || 'An error occurred',
          code: error.code
        }
      };
    }
    
    // Use our formatErrorResponse utility for all other errors
    // This ensures consistent error format that complies with API spec
    const formattedError = formatErrorResponse(error.cause || error);
    
    // Return the error in API specification format
    return {
      ...shape,
      data: {
        httpStatus,
        message: formattedError.message,
        code: formattedError.code
      }
    };
  },
});

/**
 * Map TRPC error codes to HTTP status codes
 */
function getHttpStatusFromError(error: TRPCError): number {
  switch (error.code) {
    case 'BAD_REQUEST':
      return 400;
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'TIMEOUT':
      return 408;
    case 'CONFLICT':
      return 409;
    case 'PRECONDITION_FAILED':
      return 412;
    case 'PAYLOAD_TOO_LARGE':
      return 413;
    case 'METHOD_NOT_SUPPORTED':
      return 405;
    case 'UNPROCESSABLE_CONTENT':
      return 422;
    case 'TOO_MANY_REQUESTS':
      return 429;
    case 'CLIENT_CLOSED_REQUEST':
      return 499;
    case 'INTERNAL_SERVER_ERROR':
    default:
      return 500;
  }
}

// Router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware to check if user is authenticated
const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    // Use standardized error handling
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'Authentication required to access this resource',
      cause: createUnauthorizedError('Authentication required to access this resource')
    });
  }
  return next({
    ctx: {
      // Add authenticated user to context
      user: ctx.user,
    },
  });
});

// Procedures for authenticated routes
export const protectedProcedure = t.procedure.use(isAuthenticated);

// Middleware to check if user is admin
const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'Authentication required to access this resource',
      cause: createUnauthorizedError('Authentication required to access this resource')
    });
  }
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Administrator access required',
      cause: createForbiddenError('Administrator access required')
    });
  }
  return next({
    ctx: {
      // Add authenticated user to context
      user: ctx.user,
    },
  });
});

// Procedures for admin-only routes
export const adminProcedure = t.procedure.use(isAdmin);

/**
 * Error handler wrapper for procedures
 * Use this to wrap your procedure implementation for standardized error handling
 * 
 * Example:
 * ```
 * const myProcedure = publicProcedure
 *   .input(z.object({ id: z.string() }))
 *   .query(({ input }) => safeProcedure(async () => {
 *     // Your implementation here
 *   }));
 * ```
 */
export async function safeProcedure<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // This will convert the error to a standardized TRPCError
    handleError(error);
  }
}