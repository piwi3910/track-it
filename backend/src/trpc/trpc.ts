import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { Context } from './context';
import { handleError, createUnauthorizedError, createForbiddenError } from '../utils/error-handler';

// Initialize tRPC with context type
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    const formattedError = { 
      ...shape,
      data: {
        ...shape.data,
        // Include HTTP status code for the client
        httpStatus: getHttpStatusFromError(error)
      }
    };

    if (error.cause instanceof z.ZodError) {
      // Format Zod validation errors for better client-side presentation
      const formattedZodError: Record<string, string> = {};
      for (const issue of error.cause.issues) {
        const path = issue.path.join('.') || 'value';
        formattedZodError[path] = issue.message;
      }
      formattedError.data = {
        ...formattedError.data,
        zodError: formattedZodError
      };
    } 
    // Check for AppError structure in error.cause
    else if (
      error.cause && 
      typeof error.cause === 'object' && 
      'details' in error.cause && 
      error.cause.details && 
      typeof error.cause.details === 'object'
    ) {
      // Include AppError details in the response
      formattedError.data = {
        ...formattedError.data,
        appError: error.cause.details
      };
    }

    return formattedError;
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