import { Prisma, User, PrismaClient, $Enums } from '@prisma/client';
import { BaseRepository } from './base.repository';

/**
 * User repository interface extending base repository with user-specific methods
 */
export interface IUserRepository extends BaseRepository<User, Prisma.UserCreateInput, Prisma.UserUpdateInput> {
  findByEmail(email: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  updatePassword(id: string, passwordHash: string): Promise<User>;
  updateLastLogin(id: string): Promise<User>;
  updateRole(id: string, role: $Enums.UserRole): Promise<User>;
}

/**
 * User repository implementation
 */
export class UserRepository extends BaseRepository<User, Prisma.UserCreateInput, Prisma.UserUpdateInput> 
  implements IUserRepository {
  
  constructor(prisma: PrismaClient) {
    super(prisma, 'User');
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.prisma.user.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      this.handleError('find all', error);
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { id }
      });
    } catch (error) {
      this.handleError(`find by id ${id}`, error);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { email }
      });
    } catch (error) {
      this.handleError(`find by email ${email}`, error);
    }
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { googleId }
      });
    } catch (error) {
      this.handleError(`find by Google ID ${googleId}`, error);
    }
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    try {
      return await this.prisma.user.create({
        data
      });
    } catch (error) {
      this.handleError('create', error);
    }
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data
      });
    } catch (error) {
      this.handleError(`update with id ${id}`, error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.user.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      this.handleError(`delete with id ${id}`, error);
    }
  }

  async updatePassword(id: string, passwordHash: string): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          passwordHash,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      this.handleError(`update password for id ${id}`, error);
    }
  }

  async updateLastLogin(id: string): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          lastLogin: new Date()
        }
      });
    } catch (error) {
      this.handleError(`update last login for id ${id}`, error);
    }
  }

  async updateRole(id: string, role: $Enums.UserRole): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          role,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      this.handleError(`update role for id ${id}`, error);
    }
  }
}