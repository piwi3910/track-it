import { prisma } from '../client';
import { 
  User, 
  Prisma, 
  UserRole 
} from '../../generated/prisma';
import { TRPCError } from '@trpc/server';

export interface CreateUserInput extends Omit<Prisma.UserCreateInput, 'createdTasks' | 'assignedTasks' | 'comments' | 'notifications'> {
  password?: string;
}

export interface UpdateUserInput extends Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'passwordHash'>> {
  password?: string;
}

export class UserService {
  /**
   * Find a user by ID
   */
  static async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id }
    });
  }

  /**
   * Find a user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  /**
   * Find a user by Google ID
   */
  static async findByGoogleId(googleId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { googleId }
    });
  }

  /**
   * Get all users
   */
  static async findAll(): Promise<User[]> {
    return prisma.user.findMany({
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Create a new user
   */
  static async create(data: CreateUserInput): Promise<User> {
    const { password, ...userData } = data;

    // In a real implementation, we would hash the password here
    const passwordHash = password ? `hashed_${password}` : null;

    try {
      return await prisma.user.create({
        data: {
          ...userData,
          passwordHash
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle unique constraint violations
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A user with this email already exists'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Update a user
   */
  static async update(id: string, data: UpdateUserInput): Promise<User> {
    const { password, ...userData } = data;

    // If password is provided, hash it
    const updates: Prisma.UserUpdateInput = { ...userData };
    if (password) {
      updates.passwordHash = `hashed_${password}`;
    }

    try {
      return await prisma.user.update({
        where: { id },
        data: updates
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found'
          });
        }
        // Handle unique constraint violations
        if (error.code === 'P2002') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A user with this email already exists'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Delete a user
   */
  static async delete(id: string): Promise<User> {
    try {
      return await prisma.user.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Update user role
   */
  static async updateRole(id: string, role: UserRole): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data: { role }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(id: string, preferences: Record<string, any>): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data: { preferences: preferences as Prisma.JsonValue }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Update Google integration data
   */
  static async updateGoogleData(
    id: string, 
    googleData: { 
      googleId: string, 
      googleToken: string, 
      googleRefreshToken?: string,
      googleProfile?: Record<string, any>
    }
  ): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data: {
          googleId: googleData.googleId,
          googleToken: googleData.googleToken,
          googleRefreshToken: googleData.googleRefreshToken,
          googleProfile: googleData.googleProfile as Prisma.JsonValue
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Record user login
   */
  static async recordLogin(id: string): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data: { lastLogin: new Date() }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found'
          });
        }
      }
      throw error;
    }
  }
}