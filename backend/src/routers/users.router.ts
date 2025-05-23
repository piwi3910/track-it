import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure, adminProcedure, safeProcedure } from '../trpc/trpc';
// Removed unused imports: User, LoginResponse, RegisterResponse
import { 
  createNotFoundError, 
  createUnauthorizedError, 
  handleError
} from '../utils/error-handler';
import * as userService from '../db/services/user.service';
import { Prisma, UserRole } from '../generated/prisma';
import { USER_ROLE } from '../utils/constants';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '../config';
import { logger } from '../server';

// Type for normalized user data
export interface NormalizedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  preferences?: {
    theme?: string;
    defaultView?: string;
    notifications?: {
      email?: boolean;
      inApp?: boolean;
    };
  };
  googleId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  lastLogin?: string | Date | null;
  [key: string]: unknown;
}

// Helper function to format enum values for API
const formatEnumForApi = (value: unknown): string => {
  return String(value);
};

// Helper function to normalize user data for API response
const normalizeUserData = (user: { 
  role: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastLogin?: Date | string | null;
  [key: string]: unknown;
}): NormalizedUser => {
  return {
    ...user,
    role: formatEnumForApi(user.role),
    // Format dates as ISO strings if they exist as Date objects
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
    lastLogin: user.lastLogin instanceof Date ? user.lastLogin.toISOString() : user.lastLogin
  } as NormalizedUser;
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
async function verifyGoogleIdToken(idToken: string): Promise<{
  sub: string;
  email: string;
  email_verified?: boolean;
  name: string;
  picture?: string;
} | null> {
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
      picture: 'https://i.pravatar.cc/150?u=google-user'
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
          { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
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
        
        if (!payload) {
          throw createUnauthorizedError('Invalid Google token');
        }
        
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
            { ...payload, id: payload.sub } // Store the full profile with id mapping
          );
          
          // Update login timestamp
          await userService.updateLoginTimestamp(user.id);
        } else {
          // If user doesn't exist, create a new user
          const newUser = await userService.createUser({
            name: payload.name,
            email: payload.email,
            avatarUrl: payload.picture
          });
          
          // Then connect Google account
          await userService.connectGoogleAccount(
            newUser.id,
            payload.sub,
            input.idToken,
            undefined,
            { ...payload, id: payload.sub }
          );
          
          // Get the full user object with all fields
          user = await userService.getUserById(newUser.id);
        }
        
        if (!user) {
          throw createUnauthorizedError('Failed to create or update user');
        }
        
        // Generate JWT token
        const token = jwt.sign(
          {
            id: user.id,
            role: formatEnumForApi(user.role)
          },
          config.jwtSecret,
          { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
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
        
        if (!payload) {
          return { valid: false };
        }
        
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
          passwordHash: await bcrypt.hash(input.password, 10),
          role: UserRole.MEMBER,
          preferences: { theme: 'light', defaultView: 'dashboard' } // Default preferences
        } as Prisma.UserCreateInput);
        
        logger.info({ userId: newUser.id }, 'User registration successful');
        
        // Return format matches API specification
        return {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email
        };
      } catch (error) {
        logger.error({ error, input: { email: input.email, name: input.name } }, 'Registration error');
        
        // Special handling for duplicate email errors
        const err = error as { message?: string; code?: string; meta?: { target?: string[] } };
        if (err.message === 'Email already exists' || 
            (err.code === 'P2002' && err.meta?.target?.includes('email'))) {
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
        if (error instanceof Error && (
            error.message.includes("don't match") || 
            error.message.includes("invalid") || 
            error.message.includes("password"))) {
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
      avatarUrl: z.string().nullable().optional(), // Allow any string (URL or base64 data URL) or null for deletion
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
        const updateData: Record<string, unknown> = {};
        
        if (input.name) updateData.name = input.name;
        
        // Handle avatar update with validation if provided
        if (input.avatarUrl !== undefined) {
          // Use the specialized avatar update service for validation
          await userService.updateUserAvatar(ctx.user.id, input.avatarUrl);
        } else {
          // Update other fields only
          if (Object.keys(updateData).length > 0) {
            await userService.updateUser(ctx.user.id, updateData);
          } else {
            // No updates needed, just get current user
            await userService.getUserById(ctx.user.id);
          }
        }
        
        // If preferences provided, update them separately
        if (input.preferences) {
          await userService.updateUserPreferences(ctx.user.id, input.preferences);
        }
        
        // Get fresh user data with updated preferences
        const refreshedUser = await userService.getUserById(ctx.user.id);
        
        if (!refreshedUser) {
          throw createNotFoundError('User', ctx.user.id);
        }
        
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
        // Handle validation errors specifically for avatar updates
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('Unsupported image format') || 
            errorMessage.includes('Image size too large')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: errorMessage
          });
        }
        
        return handleError(error);
      }
    })),

  // Update user avatar with base64 data support
  updateAvatar: protectedProcedure
    .input(z.object({
      avatarUrl: z.string().nullable() // Can be base64 data URL, regular URL, or null to remove
    }))
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        const user = await userService.getUserById(ctx.user.id);
        
        if (!user) {
          throw createNotFoundError('User', ctx.user.id);
        }
        
        // Update avatar using the specialized service function
        const updatedUser = await userService.updateUserAvatar(ctx.user.id, input.avatarUrl);
        
        const normalized = normalizeUserData(updatedUser);
        
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
        // Handle validation errors specifically
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('Unsupported image format') || 
            errorMessage.includes('Image size too large')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: errorMessage
          });
        }
        
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

  // Admin: Create user
  createUser: adminProcedure
    .input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(Object.values(USER_ROLE) as [string, ...string[]]).default('MEMBER')
    }))
    .mutation(({ input }) => safeProcedure(async () => {
      try {
        // Check if user already exists
        const existingUser = await userService.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'User with this email already exists'
          });
        }

        // Create user
        const userData = {
          name: input.name,
          email: input.email,
          password: input.password,
          role: input.role as UserRole
        };

        const newUser = await userService.createUser(userData);
        return normalizeUserData(newUser);
      } catch (error) {
        const err = error as { message?: string };
        if (err.message?.includes('already exists')) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: err.message || 'User already exists' });
        }
        return handleError(error);
      }
    })),

  // Admin: Update user
  updateUser: adminProcedure
    .input(z.object({
      userId: z.string(),
      name: z.string().min(2).optional(),
      email: z.string().email().optional(),
      role: z.enum(Object.values(USER_ROLE) as [string, ...string[]]).optional()
    }))
    .mutation(({ input }) => safeProcedure(async () => {
      try {
        const user = await userService.getUserById(input.userId);
        
        if (!user) {
          throw createNotFoundError('User', input.userId);
        }

        // Check if email is being changed and if it already exists
        if (input.email && input.email !== user.email) {
          const existingUser = await userService.getUserByEmail(input.email);
          if (existingUser) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'User with this email already exists'
            });
          }
        }

        // Prepare update data
        const updateData: Prisma.UserUpdateInput = {};
        if (input.name) updateData.name = input.name;
        if (input.email) updateData.email = input.email;
        if (input.role) updateData.role = input.role as UserRole;

        const updatedUser = await userService.updateUser(input.userId, updateData);
        return normalizeUserData(updatedUser);
      } catch (error) {
        const err = error as { message?: string };
        if (err.message?.includes('already exists')) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: err.message || 'Operation failed' });
        }
        return handleError(error);
      }
    })),

  // Admin: Get user deletion statistics
  getUserDeletionStats: adminProcedure
    .input(z.object({
      userId: z.string()
    }))
    .query(({ input }) => safeProcedure(async () => {
      try {
        return await userService.getUserDeletionStats(input.userId);
      } catch (error) {
        return handleError(error);
      }
    })),

  // Admin: Delete user
  deleteUser: adminProcedure
    .input(z.object({
      userId: z.string()
    }))
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        // Prevent admin from deleting themselves
        if (input.userId === ctx.user.id) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'You cannot delete your own account'
          });
        }

        const user = await userService.getUserById(input.userId);
        
        if (!user) {
          throw createNotFoundError('User', input.userId);
        }

        // Prevent deleting the system placeholder user
        if (user.email === 'deleted-user@system.placeholder') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot delete the system placeholder user'
          });
        }

        await userService.deleteUser(input.userId);
        
        return {
          id: input.userId,
          deleted: true
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('cannot delete')) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: errorMessage });
        }
        return handleError(error);
      }
    })),

  // Admin: Reset user password
  resetUserPassword: adminProcedure
    .input(z.object({
      userId: z.string(),
      newPassword: z.string().min(6)
    }))
    .mutation(({ input }) => safeProcedure(async () => {
      try {
        const user = await userService.getUserById(input.userId);
        
        if (!user) {
          throw createNotFoundError('User', input.userId);
        }

        await userService.updateUserPassword(input.userId, input.newPassword);
        
        return {
          id: input.userId,
          message: 'Password updated successfully'
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
        const updateData: Prisma.UserUpdateInput = {};
        
        // If we're enabling integration and a refresh token is provided
        if (input.googleEnabled && input.googleRefreshToken) {
          updateData.googleRefreshToken = input.googleRefreshToken;
        }
        
        // If Google is disabled, disconnect Google account
        if (!input.googleEnabled && user.googleId) {
          await userService.disconnectGoogleAccount(ctx.user.id);
        }
        
        // Google integration preferences are stored separately
        
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