import { PrismaClient } from '@prisma/client';
import { createDatabaseError } from '../utils/unified-error-handler';

/**
 * Base repository interface defining common CRUD operations
 */
export interface IBaseRepository<T, CreateInput, UpdateInput> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<boolean>;
}

/**
 * Abstract base repository class providing common functionality
 */
export abstract class BaseRepository<T, CreateInput, UpdateInput> 
  implements IBaseRepository<T, CreateInput, UpdateInput> {
  
  protected prisma: PrismaClient;
  protected modelName: string;

  constructor(prisma: PrismaClient, modelName: string) {
    this.prisma = prisma;
    this.modelName = modelName;
  }

  abstract findAll(): Promise<T[]>;
  abstract findById(id: string): Promise<T | null>;
  abstract create(data: CreateInput): Promise<T>;
  abstract update(id: string, data: UpdateInput): Promise<T>;
  abstract delete(id: string): Promise<boolean>;

  /**
   * Handle database errors consistently
   */
  protected handleError(operation: string, error: unknown): never {
    throw createDatabaseError(`Failed to ${operation} ${this.modelName}`, { error });
  }
}