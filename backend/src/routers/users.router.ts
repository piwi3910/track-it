import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure, adminProcedure, safeProcedure } from '../trpc/trpc';
import type {
  User,
  LoginResponse,
  RegisterResponse
} from '@track-it/shared';
import { 
  createNotFoundError, 
  createUnauthorizedError, 
  createValidationError,
  handleError
} from '../utils/error-handler';
import * as userService from '../db/services/user.service';
import { USER_ROLE, formatEnumForApi, formatEnumForDb } from '../utils/constants';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../server';

// Helper function to normalize user data for API response
const normalizeUserData = (user: any) => {
  return {
    ...user,
    role: formatEnumForApi(user.role),
    // Format dates as ISO strings if they exist as Date objects
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
    lastLogin: user.lastLogin instanceof Date ? user.lastLogin.toISOString() : user.lastLogin
  };
};

// Input validation schemas
const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const userRegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  passwordConfirm: z.string().min(6)
}).refine(data => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ["passwordConfirm"]
});

const googleLoginSchema = z.object({
  idToken: z.string()
});

const googleTokenVerificationSchema = z.object({
  credential: z.string()
});

// Function to decode and verify a Google ID token
// In a real app, you would use the Google OAuth2 API to verify the token
async function verifyGoogleIdToken(idToken: string) {
  try {
    // Log token verification attempt (only show prefix for security)
    logger.info({ tokenPrefix: idToken.substring(0, 10) }, 'Verifying Google ID token');
    
    // For development purposes, we're mocking this by assuming the token is valid
    // In production, you would verify this token with Google OAuth2 library
    // Example with real implementation:
    // const ticket = await googleClient.verifyIdToken({
    //   idToken,
    //   audience: config.googleClientId
    // });
    // const payload = ticket.getPayload();
    
    // Mock decoded token payload (in production this would come from Google)
    return {
      sub: 'google-123456789',
      email: 'user@example.com',
      email_verified: true,
      name: 'Test User',
      picture: 'https://i.pravatar.cc/150?u=google-user',
      given_name: 'Test',
      family_name: 'User',
      locale: 'en'
    };
  } catch (error) {
    logger.error({ error }, 'Google token verification failed');
    throw createUnauthorizedError('Failed to verify Google token');
  }
}

// Users router with endpoints
export const usersRouter = router({
  // Public routes (no auth required)
  ping: publicProcedure
    .query(() => {
      return { status: 'ok' };
    }),
    
  login: publicProcedure
    .input(userLoginSchema)
    .mutation(({ input }) => safeProcedure(async () => {
      try {
        // Log login attempt for debugging
        logger.info({ email: input.email }, 'Login attempt');
        
        // Get user by email
        const user = await userService.getUserByEmail(input.email);
        
        if (!user || !user.passwordHash) {
          logger.warn({ email: input.email }, 'Login failed: User not found or no password');
          throw createUnauthorizedError('Invalid email or password');
        }
        
        // Verify password
        const isPasswordValid = await userService.verifyPassword(input.password, user.passwordHash);
        
        if (!isPasswordValid) {
          logger.warn({ email: input.email }, 'Login failed: Invalid password');
          throw createUnauthorizedError('Invalid email or password');
        }
        
        // Update login timestamp
        await userService.updateLoginTimestamp(user.id);
        
        // Generate JWT token
        const token = jwt.sign(
          { 
            id: user.id,
            role: formatEnumForApi(user.role)
          },
          config.jwtSecret,
          { expiresIn: config.jwtExpiresIn }
        );
        
        // Log successful login
        logger.info({ userId: user.id, email: user.email }, 'Login successful');
        
        // Return data exactly as specified in API spec
        // Format exactly as the LoginResponse interface requires
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: formatEnumForApi(user.role),
          token
        };
      } catch (error) {
        logger.error({ error, email: input.email }, 'Login error');
        throw error; // Important: Allow error to propagate directly
      }
    })),
  
  // Google authentication
  loginWithGoogle: publicProcedure
    .input(googleLoginSchema)
    .mutation(({ input }) => safeProcedure(async () => {
      try {
        // Verify the Google ID token
        const payload = await verifyGoogleIdToken(input.idToken);
        
        if (!payload.email_verified) {
          throw createUnauthorizedError('Email not verified with Google');
        }
        
        // Check if user already exists with this Google ID
        let user = await userService.getUserByGoogleId(payload.sub);
        
        // If no user with this Google ID, check for user with same email
        if (!user) {
          user = await userService.getUserByEmail(payload.email);
        }
        
        // If user exists, update Google connection
        if (user) {
          // Update Google information
          await userService.connectGoogleAccount(
            user.id, 
            payload.sub, 
            input.idToken, 
            undefined, // Refresh token would be handled in a full implementation
            payload // Store the full profile
          );
          
          // Update login timestamp
          await userService.updateLoginTimestamp(user.id);
        } else {
          // If user doesn't exist, create a new user
          user = await userService.createUser({
            name: payload.name,
            email: payload.email,
            avatarUrl: payload.picture,
            role: formatEnumForDb(USER_ROLE.MEMBER),
            googleId: payload.sub,
            googleToken: input.idToken,
            googleProfile: payload
          });
        }
        
        // Generate JWT token
        const token = jwt.sign(
          { 
            id: user.id,
            role: formatEnumForApi(user.role)
          },
          config.jwtSecret,
          { expiresIn: config.jwtExpiresIn }
        );
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: formatEnumForApi(user.role),
          token,
          googleConnected: true
        };
      } catch (error) {
        return handleError(error);
      }
    })),
  
  // Verify Google token
  verifyGoogleToken: publicProcedure
    .input(googleTokenVerificationSchema)
    .mutation(({ input }) => safeProcedure(async () => {
      try {
        // Verify the Google ID token
        const payload = await verifyGoogleIdToken(input.credential);
        
        if (!payload.email_verified) {
          return { valid: false };
        }
        
        // Check if user with this email already exists
        const existingUser = await userService.getUserByEmail(payload.email);
        
        return {
          valid: true,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          userExists: !!existingUser
        };
      } catch (error) {
        logger.error({ error }, 'Google token verification error');
        return { valid: false };
      }
    })),
    
  register: publicProcedure
    .input(userRegisterSchema)
    .mutation(({ input }) => safeProcedure(async () => {
      try {
        // Log registration attempt (don't log the password for security)
        logger.info({ 
          email: input.email, 
          name: input.name 
        }, 'User registration attempt');
        
        // Check if user already exists 
        const existingUser = await userService.getUserByEmail(input.email);
        
        if (existingUser) {
          logger.warn({ email: input.email }, 'Registration failed: Email already exists');
          // Create a properly formatted error with code property matching API spec
          // Throw a TRPCError that will be properly formatted through the error formatter
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already exists',
            cause: {
              code: 'ALREADY_EXISTS',
              message: 'Email already exists'
            }
          });
        }
        
        // Create new user with hashed password
        const newUser = await userService.createUser({
          name: input.name,
          email: input.email,
          password: input.password, // Will be hashed in the service
          passwordConfirm: input.passwordConfirm, // Will be removed in the service
          role: formatEnumForDb(USER_ROLE.MEMBER),
          preferences: { theme: 'light', defaultView: 'dashboard' } // Default preferences
        });
        
        logger.info({ userId: newUser.id }, 'User registration successful');
        
        // Return format matches API specification
        return {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email
        };
      } catch (error: any) {
        logger.error({ error, input: { email: input.email, name: input.name } }, 'Registration error');
        
        // Special handling for duplicate email errors
        if (error.message === 'Email already exists' || 
            (error.code === 'P2002' && error.meta?.target?.includes('email'))) {
          // Use TRPCError for consistent error handling
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already exists',
            cause: {
              code: 'ALREADY_EXISTS',
              message: 'Email already exists'
            }
          });
        }
        
        // Pass through validation errors
        if (error.message.includes("don't match") || 
            error.message.includes("invalid") || 
            error.message.includes("password")) {
          throw error;
        }
        
        // For other errors, use standard handler
        return handleError(error);
      }
    })),
    
  // Protected routes (auth required)
  getCurrentUser: protectedProcedure
    .query(({ ctx }) => safeProcedure(async () => {
      try {
        const user = await userService.getUserById(ctx.user.id);
        
        if (!user) {
          throw createNotFoundError('User', ctx.user.id);
        }
        
        const normalized = normalizeUserData(user);
        
        // Return exact structure as specified in API specification
        return {
          id: normalized.id,
          name: normalized.name,
          email: normalized.email,
          role: normalized.role,
          avatarUrl: normalized.avatarUrl,
          preferences: {
            theme: normalized.preferences?.theme || 'light',
            defaultView: normalized.preferences?.defaultView || 'dashboard',
            notifications: {
              email: normalized.preferences?.notifications?.email ?? true,
              inApp: normalized.preferences?.notifications?.inApp ?? true
            }
          },
          googleConnected: !!normalized.googleId,
          googleEmail: normalized.googleId ? normalized.email : null
        };
      } catch (error) {
        return handleError(error);
      }
    })),
    
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(2).optional(),
      avatarUrl: z.string().url().optional(),
      preferences: z.object({
        theme: z.enum(['light', 'dark', 'auto']).optional(),
        defaultView: z.enum(['dashboard', 'kanban', 'calendar', 'backlog']).optional(),
        notifications: z.object({
          email: z.boolean().optional(),
          inApp: z.boolean().optional()
        }).optional()
      }).optional()
    }))
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        const user = await userService.getUserById(ctx.user.id);
        
        if (!user) {
          throw createNotFoundError('User', ctx.user.id);
        }
        
        // Update basic profile fields
        const updateData: any = {};
        
        if (input.name) updateData.name = input.name;
        if (input.avatarUrl) updateData.avatarUrl = input.avatarUrl;
        
        // Update user record
        const updatedUser = await userService.updateUser(ctx.user.id, updateData);
        
        // If preferences provided, update them separately
        if (input.preferences) {
          await userService.updateUserPreferences(ctx.user.id, input.preferences);
        }
        
        // Get fresh user data with updated preferences
        const refreshedUser = await userService.getUserById(ctx.user.id);
        const normalized = normalizeUserData(refreshedUser);
        
        // Return exact structure as specified in API specification
        return {
          id: normalized.id,
          name: normalized.name,
          email: normalized.email,
          role: normalized.role,
          avatarUrl: normalized.avatarUrl,
          preferences: {
            theme: normalized.preferences?.theme || 'light',
            defaultView: normalized.preferences?.defaultView || 'dashboard',
            notifications: {
              email: normalized.preferences?.notifications?.email ?? true,
              inApp: normalized.preferences?.notifications?.inApp ?? true
            }
          },
          googleConnected: !!normalized.googleId,
          googleEmail: normalized.googleId ? normalized.email : null
        };
      } catch (error) {
        return handleError(error);
      }
    })),
  
  // Google account connection
  disconnectGoogleAccount: protectedProcedure
    .mutation(({ ctx }) => safeProcedure(async () => {
      try {
        const user = await userService.getUserById(ctx.user.id);
        
        if (!user) {
          throw createNotFoundError('User', ctx.user.id);
        }
        
        if (!user.googleId) {
          return { success: false, message: 'No Google account connected' };
        }
        
        // Disconnect Google account
        await userService.disconnectGoogleAccount(ctx.user.id);
        
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    })),
    
  // Admin routes
  getAllUsers: adminProcedure
    .query(() => safeProcedure(async () => {
      try {
        const users = await userService.getAllUsers();
        return users.map(normalizeUserData);
      } catch (error) {
        return handleError(error);
      }
    })),
    
  updateUserRole: adminProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(Object.values(USER_ROLE) as [string, ...string[]])
    }))
    .mutation(({ input }) => safeProcedure(async () => {
      try {
        const user = await userService.getUserById(input.userId);
        
        if (!user) {
          throw createNotFoundError('User', input.userId);
        }
        
        // Update user role
        const updatedUser = await userService.updateUserRole(input.userId, input.role);
        
        return {
          id: updatedUser.id,
          name: updatedUser.name,
          role: formatEnumForApi(updatedUser.role)
        };
      } catch (error) {
        return handleError(error);
      }
    })),

  // Update Google integration settings
  updateGoogleIntegration: protectedProcedure
    .input(z.object({
      googleRefreshToken: z.string().nullable().optional(),
      googleEnabled: z.boolean()
    }))
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        const user = await userService.getUserById(ctx.user.id);
        
        if (!user) {
          throw createNotFoundError('User', ctx.user.id);
        }
        
        // Update Google integration settings
        const updateData: any = {};
        
        // If we're enabling integration and a refresh token is provided
        if (input.googleEnabled && input.googleRefreshToken) {
          updateData.googleRefreshToken = input.googleRefreshToken;
        }
        
        // If Google is disabled, disconnect Google account
        if (!input.googleEnabled && user.googleId) {
          await userService.disconnectGoogleAccount(ctx.user.id);
        }
        
        // Update preferences to store the enabled setting
        await userService.updateUserPreferences(ctx.user.id, {
          googleIntegration: {
            enabled: input.googleEnabled
          }
        });
        
        return {
          id: user.id,
          name: user.name,
          googleIntegration: {
            enabled: input.googleEnabled,
            connected: !!user.googleId
          }
        };
      } catch (error) {
        return handleError(error);
      }
    }))
});