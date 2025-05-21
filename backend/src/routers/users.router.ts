import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, adminProcedure, safeProcedure } from '../trpc/trpc';
import type {
  User,
  LoginResponse,
  RegisterResponse
} from '@track-it/shared';
import { 
  createNotFoundError, 
  createUnauthorizedError, 
  createValidationError
} from '../utils/error-handler';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../server';

// Mock user database for now
const mockUsers: User[] = [
  {
    id: 'user1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=user1',
    role: 'admin'
  },
  {
    id: 'user2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=user2',
    role: 'member'
  },
  {
    id: 'user3',
    name: 'Demo User',
    email: 'demo@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=demo',
    role: 'member'
  }
];

// Store for Google connected accounts
// In a real app, this would be stored in the database
const googleConnections: Record<string, {
  googleId: string;
  email: string;
  name: string;
  picture: string;
  userId: string;
}> = {};

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

// Mock function to decode and verify a Google ID token
// In a real app, you would use the Google OAuth2 API to verify the token
async function verifyGoogleIdToken(idToken: string) {
  // For development purposes, we're mocking this by assuming the token is valid
  // In production, you would verify this token with Google
  logger.info({ tokenPrefix: idToken.substring(0, 10) }, 'Verifying Google ID token');
  
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
}

// Users router with endpoints
export const usersRouter = router({
  // Public routes (no auth required)
  login: publicProcedure
    .input(userLoginSchema)
    .mutation(({ input }) => safeProcedure(async () => {
      // In a real app, you would verify the password against a hash
      const user = mockUsers.find(user => user.email === input.email);
      
      if (!user) {
        throw createUnauthorizedError('Invalid email or password');
      }
      
      // Generate JWT token using jsonwebtoken
      const token = jwt.sign(
        { 
          id: user.id,
          role: user.role || 'member'
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'member',
        token
      };
    })),
  
  // Google authentication
  loginWithGoogle: publicProcedure
    .input(googleLoginSchema)
    .mutation(({ input }) => safeProcedure(async () => {
      // Verify the Google ID token
      const payload = await verifyGoogleIdToken(input.idToken);
      
      if (!payload.email_verified) {
        throw createUnauthorizedError('Email not verified with Google');
      }
      
      // Check if user exists
      let user = mockUsers.find(user => user.email === payload.email);
      
      // If user doesn't exist, create a new user
      if (!user) {
        user = {
          id: `user-google-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: payload.name,
          email: payload.email,
          avatarUrl: payload.picture,
          role: 'member'
        };
        
        mockUsers.push(user);
      }
      
      // Store Google connection
      googleConnections[payload.sub] = {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        userId: user.id
      };
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id,
          role: user.role || 'member'
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'member',
        token,
        googleConnected: true
      };
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
        
        return {
          valid: true,
          email: payload.email,
          name: payload.name,
          picture: payload.picture
        };
      } catch (error) {
        logger.error({ error }, 'Google token verification error');
        return { valid: false };
      }
    })),
    
  register: publicProcedure
    .input(userRegisterSchema)
    .mutation(({ input }) => safeProcedure(async () => {
      // Check if user already exists
      if (mockUsers.some(user => user.email === input.email)) {
        throw createValidationError('User with this email already exists', 'email');
      }
      
      // Create new user (in a real app, you would hash the password)
      const newUser: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: input.name,
        email: input.email,
        role: 'member',
        // In a real app: passwordHash: await hashPassword(input.password)
      };
      
      mockUsers.push(newUser);
      
      return {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      };
    })),
    
  // Protected routes (auth required)
  getCurrentUser: protectedProcedure
    .query(({ ctx }) => safeProcedure(async () => {
      const user = mockUsers.find(user => user.id === ctx.user?.id);
      
      if (!user) {
        throw createNotFoundError('User', ctx.user?.id);
      }
      
      // Check if user has Google connection
      const googleConnection = Object.values(googleConnections).find(
        conn => conn.userId === user.id
      );
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        preferences: user.preferences,
        googleConnected: !!googleConnection,
        googleEmail: googleConnection?.email
      };
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
      const userIndex = mockUsers.findIndex(user => user.id === ctx.user?.id);
      
      if (userIndex === -1) {
        throw createNotFoundError('User', ctx.user?.id);
      }
      
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        ...input,
        preferences: {
          ...mockUsers[userIndex].preferences,
          ...input.preferences
        }
      };
      
      // Check for Google connection
      const googleConnection = Object.values(googleConnections).find(
        conn => conn.userId === mockUsers[userIndex].id
      );
      
      return {
        id: mockUsers[userIndex].id,
        name: mockUsers[userIndex].name,
        email: mockUsers[userIndex].email,
        role: mockUsers[userIndex].role,
        avatarUrl: mockUsers[userIndex].avatarUrl,
        preferences: mockUsers[userIndex].preferences,
        googleConnected: !!googleConnection,
        googleEmail: googleConnection?.email
      };
    })),
  
  // Google account connection
  disconnectGoogleAccount: protectedProcedure
    .mutation(({ ctx }) => safeProcedure(async () => {
      const user = mockUsers.find(user => user.id === ctx.user?.id);
      
      if (!user) {
        throw createNotFoundError('User', ctx.user?.id);
      }
      
      // Find Google connection
      const googleId = Object.entries(googleConnections).find(
        ([_, conn]) => conn.userId === user.id
      )?.[0];
      
      if (googleId) {
        delete googleConnections[googleId];
        return { success: true };
      }
      
      return { success: false };
    })),
    
  // Admin routes
  getAllUsers: adminProcedure
    .query(() => safeProcedure(async () => {
      return mockUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl
      }));
    })),
    
  updateUserRole: adminProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(['admin', 'member', 'guest'])
    }))
    .mutation(({ input }) => safeProcedure(async () => {
      const userIndex = mockUsers.findIndex(user => user.id === input.userId);
      
      if (userIndex === -1) {
        throw createNotFoundError('User', input.userId);
      }
      
      mockUsers[userIndex].role = input.role;
      
      return {
        id: mockUsers[userIndex].id,
        name: mockUsers[userIndex].name,
        role: mockUsers[userIndex].role
      };
    })),

  // Update Google integration settings
  updateGoogleIntegration: protectedProcedure
    .input(z.object({
      googleRefreshToken: z.string().nullable().optional(),
      googleEnabled: z.boolean()
    }))
    .mutation(({ input, ctx }) => safeProcedure(async () => {
      const userIndex = mockUsers.findIndex(user => user.id === ctx.user?.id);
      
      if (userIndex === -1) {
        throw createNotFoundError('User', ctx.user?.id);
      }

      // In a real implementation, this would update the database
      const connected = !!Object.values(googleConnections).find(
        conn => conn.userId === mockUsers[userIndex].id
      );

      return {
        id: mockUsers[userIndex].id,
        name: mockUsers[userIndex].name,
        googleIntegration: {
          enabled: input.googleEnabled,
          connected
        }
      };
    }))
});