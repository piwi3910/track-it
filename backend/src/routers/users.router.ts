import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc/trpc';
import { TRPCError } from '@trpc/server';
import type {
  User,
  LoginResponse,
  RegisterResponse
} from '@track-it/shared';

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
  }
];

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

// Users router with endpoints
export const usersRouter = router({
  // Public routes (no auth required)
  login: publicProcedure
    .input(userLoginSchema)
    .mutation(async ({ input, ctx }): Promise<LoginResponse> => {
      // In a real app, you would verify the password against a hash
      const user = mockUsers.find(user => user.email === input.email);
      
      if (!user) {
        throw new TRPCError({ 
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password'
        });
      }
      
      // Generate JWT token
      const token = ctx.req.server.jwt.sign({ 
        id: user.id,
        role: user.role || 'member'
      });
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'member',
        token
      };
    }),
    
  register: publicProcedure
    .input(userRegisterSchema)
    .mutation(async ({ input }): Promise<RegisterResponse> => {
      // Check if user already exists
      if (mockUsers.some(user => user.email === input.email)) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists'
        });
      }
      
      // Create new user (in a real app, you would hash the password)
      const newUser: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
    }),
    
  // Protected routes (auth required)
  getCurrentUser: protectedProcedure
    .query(({ ctx }): User => {
      const user = mockUsers.find(user => user.id === ctx.user?.id);
      
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        preferences: user.preferences
      };
    }),
    
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
    .mutation(({ input, ctx }): User => {
      const userIndex = mockUsers.findIndex(user => user.id === ctx.user?.id);
      
      if (userIndex === -1) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }
      
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        ...input,
        preferences: {
          ...mockUsers[userIndex].preferences,
          ...input.preferences
        }
      };
      
      return {
        id: mockUsers[userIndex].id,
        name: mockUsers[userIndex].name,
        email: mockUsers[userIndex].email,
        role: mockUsers[userIndex].role,
        avatarUrl: mockUsers[userIndex].avatarUrl,
        preferences: mockUsers[userIndex].preferences
      };
    }),
    
  // Admin routes
  getAllUsers: adminProcedure
    .query((): Pick<User, 'id' | 'name' | 'email' | 'role' | 'avatarUrl'>[] => {
      return mockUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl
      }));
    }),
    
  updateUserRole: adminProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(['admin', 'member', 'guest'])
    }))
    .mutation(({ input }): Pick<User, 'id' | 'name' | 'role'> => {
      const userIndex = mockUsers.findIndex(user => user.id === input.userId);
      
      if (userIndex === -1) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }
      
      mockUsers[userIndex].role = input.role;
      
      return {
        id: mockUsers[userIndex].id,
        name: mockUsers[userIndex].name,
        role: mockUsers[userIndex].role
      };
    })
});