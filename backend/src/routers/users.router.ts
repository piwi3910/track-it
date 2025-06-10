import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure, adminProcedure, safeProcedure } from '../trpc/trpc';
// Removed unused imports: User, LoginResponse, RegisterResponse
import { 
  createNotFoundError, 
  createUnauthorizedError, 
  handleError
} from '../utils/unified-error-handler';
import repositories from '../repositories/container';
import { Prisma, UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from '../config';
import { logger } from '../server';
import { rateLimitAuth, resetRateLimit } from '../middleware/rate-limit';
import { normalizeDates } from '@track-it/shared';

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

// Helper function to normalize user data for API response
const normalizeUserData = (user: { 
  createdAt: Date | string;
  updatedAt: Date | string;
  lastLogin?: Date | string | null;
  passwordHash?: string | null;
  [key: string]: unknown;
}): NormalizedUser => {
  // Explicitly exclude sensitive fields
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safeUser } = user;
  
  // Use shared date normalization
  return normalizeDates(safeUser, ['createdAt', 'updatedAt', 'lastLogin']) as NormalizedUser;
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
    
    // TODO: Implement proper Google OAuth2 token verification
    // This is currently mocked for development
    
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
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      try {
        // Rate limit by email to prevent brute force
        rateLimitAuth(input.email);
        
        // Log login attempt for debugging
        logger.info({ 
          input,
          inputType: typeof input,
          inputKeys: Object.keys(input || {}),
          email: input?.email,
          hasPassword: !!input?.password,
          rawBody: (ctx.req as { body?: unknown }).body,
          rawBodyType: typeof (ctx.req as { body?: unknown }).body,
          rawBodyKeys: Object.keys((ctx.req as { body?: Record<string, unknown> }).body || {})
        }, 'Login attempt - detailed debug');
        
        // Get user by email
        const user = await repositories.users.findByEmail(input.email);
        
        if (!user || !user.passwordHash) {
          logger.warn({ email: input.email }, 'Login failed: User not found or no password');
          throw createUnauthorizedError('Invalid email or password');
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
        
        if (!isPasswordValid) {
          logger.warn({ email: input.email }, 'Login failed: Invalid password');
          throw createUnauthorizedError('Invalid email or password');
        }
        
        // Update login timestamp
        await repositories.users.updateLastLogin(user.id);
        
        // Generate JWT token
        const token = jwt.sign(
          {
            id: user.id,
            role: user.role
          },
          config.jwtSecret,
          { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
        );
        
        // Log successful login
        logger.info({ userId: user.id, email: user.email }, 'Login successful');
        
        // Reset rate limit on successful login
        resetRateLimit(input.email);
        
        // Return data exactly as specified in API spec
        // Format exactly as the LoginResponse interface requires
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
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
        let user = await repositories.users.findByGoogleId(payload.sub);
        
        // If no user with this Google ID, check for user with same email
        if (!user) {
          user = await repositories.users.findByEmail(payload.email);
        }
        
        // If user exists, update Google connection
        if (user) {
          // Update Google information
          await repositories.users.update(user.id, {
            googleId: payload.sub,
            googleRefreshToken: undefined, // Refresh token would be handled in a full implementation
            googleProfile: { ...payload, id: payload.sub } // Store the full profile with id mapping
          });
          
          // Update login timestamp
          await repositories.users.updateLastLogin(user.id);
        } else {
          // If user doesn't exist, create a new user
          const newUser = await repositories.users.create({
            name: payload.name,
            email: payload.email,
            avatarUrl: payload.picture
          });
          
          // Then connect Google account
          await repositories.users.update(newUser.id, {
            googleId: payload.sub,
            googleRefreshToken: undefined,
            googleProfile: { ...payload, id: payload.sub }
          });
          
          // Get the full user object with all fields
          user = await repositories.users.findById(newUser.id);
        }
        
        if (!user) {
          throw createUnauthorizedError('Failed to create or update user');
        }
        
        // Generate JWT token
        const token = jwt.sign(
          {
            id: user.id,
            role: user.role
          },
          config.jwtSecret,
          { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
        );
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
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
        const existingUser = await repositories.users.findByEmail(payload.email);
        
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
        // Rate limit by email to prevent spam registrations
        rateLimitAuth(input.email);
        
        // Log registration attempt (don't log the password for security)
        logger.info({ 
          email: input.email, 
          name: input.name 
        }, 'User registration attempt');
        
        // Check if user already exists 
        const existingUser = await repositories.users.findByEmail(input.email);
        
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
        const newUser = await repositories.users.create({
          name: input.name,
          email: input.email,
          passwordHash: await bcrypt.hash(input.password, 10),
          role: 'member',
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
        const user = await repositories.users.findById(ctx.user.id);
        
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
        const user = await repositories.users.findById(ctx.user.id);
        
        if (!user) {
          throw createNotFoundError('User', ctx.user.id);
        }
        
        // Update basic profile fields
        const updateData: Record<string, unknown> = {};
        
        if (input.name) updateData.name = input.name;
        
        // Handle avatar update with validation if provided
        if (input.avatarUrl !== undefined) {
          // Use the specialized avatar update service for validation
          await repositories.users.update(ctx.user.id, { avatarUrl: input.avatarUrl });
        } else {
          // Update other fields only
          if (Object.keys(updateData).length > 0) {
            await repositories.users.update(ctx.user.id, updateData);
          } else {
            // No updates needed, just get current user
            await repositories.users.findById(ctx.user.id);
          }
        }
        
        // If preferences provided, update them separately
        if (input.preferences) {
          await repositories.users.update(ctx.user.id, { preferences: input.preferences });
        }
        
        // Get fresh user data with updated preferences
        const refreshedUser = await repositories.users.findById(ctx.user.id);
        
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
        const user = await repositories.users.findById(ctx.user.id);
        
        if (!user) {
          throw createNotFoundError('User', ctx.user.id);
        }
        
        // Validate avatar if it's a base64 data URL
        if (input.avatarUrl && input.avatarUrl.startsWith('data:')) {
          // Extract the MIME type and base64 data
          const matches = input.avatarUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (!matches) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid base64 data URL format'
            });
          }
          
          const [, mimeType, base64Data] = matches;
          
          // Validate MIME type (only allow images)
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
          if (!allowedTypes.includes(mimeType)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Unsupported image format. Allowed formats: ${allowedTypes.join(', ')}`
            });
          }
          
          // Validate file size (5MB max)
          const sizeInBytes = Buffer.from(base64Data, 'base64').length;
          const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
          if (sizeInBytes > maxSizeInBytes) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Image size too large. Maximum size: 5MB, provided: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB`
            });
          }
        }
        
        // Update avatar
        const updatedUser = await repositories.users.update(ctx.user.id, { avatarUrl: input.avatarUrl });
        
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
        const user = await repositories.users.findById(ctx.user.id);
        
        if (!user) {
          throw createNotFoundError('User', ctx.user.id);
        }
        
        if (!user.googleId) {
          return { success: false, message: 'No Google account connected' };
        }
        
        // Disconnect Google account
        await repositories.users.update(ctx.user.id, {
          googleId: null,
          googleRefreshToken: null,
          googleProfile: Prisma.JsonNull
        });
        
        return { success: true };
      } catch (error) {
        return handleError(error);
      }
    })),
    
  // Admin routes
  getAllUsers: adminProcedure
    .query(() => safeProcedure(async () => {
      try {
        const users = await repositories.users.findAll();
        return users.map(normalizeUserData);
      } catch (error) {
        return handleError(error);
      }
    })),
    
  updateUserRole: adminProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(['admin', 'member', 'guest'])
    }))
    .mutation(({ input }) => safeProcedure(async () => {
      try {
        const user = await repositories.users.findById(input.userId);
        
        if (!user) {
          throw createNotFoundError('User', input.userId);
        }
        
        // Update user role
        const updatedUser = await repositories.users.updateRole(input.userId, input.role);
        
        return {
          id: updatedUser.id,
          name: updatedUser.name,
          role: updatedUser.role
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
      role: z.enum(['admin', 'member', 'guest']).default('member')
    }))
    .mutation(({ input }) => safeProcedure(async () => {
      try {
        // Check if user already exists
        const existingUser = await repositories.users.findByEmail(input.email);
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

        const newUser = await repositories.users.create(userData);
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
      role: z.enum(['admin', 'member', 'guest']).optional()
    }))
    .mutation(({ input }) => safeProcedure(async () => {
      try {
        const user = await repositories.users.findById(input.userId);
        
        if (!user) {
          throw createNotFoundError('User', input.userId);
        }

        // Check if email is being changed and if it already exists
        if (input.email && input.email !== user.email) {
          const existingUser = await repositories.users.findByEmail(input.email);
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

        const updatedUser = await repositories.users.update(input.userId, updateData);
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
        // Implement inline counting logic
        const user = await repositories.users.findById(input.userId);
        if (!user) {
          throw createNotFoundError('User', input.userId);
        }
        
        // Count related entities that would be affected by deletion
        // Since countByUserId doesn't exist, we'll use findAll with filtering
        const allTasks = await repositories.tasks.findAll();
        const taskCount = allTasks.filter(task => task.assigneeId === input.userId).length;
        
        const allComments = await repositories.comments.findAll();
        const commentCount = allComments.filter(comment => comment.authorId === input.userId).length;
        
        // TaskTemplate doesn't have a createdById field, so we can't filter by user
        const templateCount = 0;
        
        return {
          userId: input.userId,
          userName: user.name,
          userEmail: user.email,
          stats: {
            tasksCreated: taskCount,
            comments: commentCount,
            templates: templateCount
          }
        };
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

        const user = await repositories.users.findById(input.userId);
        
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

        await repositories.users.delete(input.userId);
        
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
        const user = await repositories.users.findById(input.userId);
        
        if (!user) {
          throw createNotFoundError('User', input.userId);
        }

        const hashedPassword = await bcrypt.hash(input.newPassword, 10);
        await repositories.users.updatePassword(input.userId, hashedPassword);
        
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
        const user = await repositories.users.findById(ctx.user.id);
        
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
          await repositories.users.update(ctx.user.id, {
            googleId: null,
            googleRefreshToken: null,
            googleProfile: Prisma.JsonNull
          });
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