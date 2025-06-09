/**
 * Attachment repository for database operations on Attachment model
 */
import { Prisma, Attachment, PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { createDatabaseError } from '../utils/unified-error-handler';

export interface IAttachmentRepository extends BaseRepository<Attachment, Prisma.AttachmentCreateInput, Prisma.AttachmentUpdateInput> {
  findByTaskId(taskId: string): Promise<Attachment[]>;
  findByIdWithTask(id: string): Promise<Attachment & {
    task: {
      id: string;
      title: string;
      creatorId: string;
      assigneeId: string | null;
    };
  } | null>;
  generateThumbnailUrl(fileName: string, fileType: string): string | null;
  generateFileUrl(fileName: string): string;
}

export class AttachmentRepository extends BaseRepository<Attachment, Prisma.AttachmentCreateInput, Prisma.AttachmentUpdateInput> implements IAttachmentRepository {
  constructor(prisma: PrismaClient) {
    super(prisma, 'Attachment');
  }

  /**
   * Get attachments by task ID
   */
  async findByTaskId(taskId: string): Promise<Attachment[]> {
    try {
      return await this.prisma.attachment.findMany({
        where: { taskId },
        orderBy: {
          uploadedAt: 'desc'
        }
      });
    } catch (error) {
      throw createDatabaseError(`Failed to get attachments for task with ID ${taskId}`, { error });
    }
  }

  /**
   * Get attachment by ID with task details
   */
  async findByIdWithTask(id: string) {
    try {
      return await this.prisma.attachment.findUnique({
        where: { id },
        include: {
          task: {
            select: {
              id: true,
              title: true,
              creatorId: true,
              assigneeId: true
            }
          }
        }
      });
    } catch (error) {
      throw createDatabaseError(`Failed to get attachment with ID ${id}`, { error });
    }
  }

  /**
   * Find all attachments (implementation required by base repository)
   */
  async findAll(): Promise<Attachment[]> {
    try {
      return await this.prisma.attachment.findMany({
        orderBy: {
          uploadedAt: 'desc'
        }
      });
    } catch (error) {
      this.handleError('find all', error);
    }
  }

  /**
   * Find attachment by ID
   */
  async findById(id: string): Promise<Attachment | null> {
    try {
      return await this.prisma.attachment.findUnique({
        where: { id }
      });
    } catch (error) {
      this.handleError('find by id', error);
    }
  }

  /**
   * Create a new attachment
   */
  async create(data: Prisma.AttachmentCreateInput): Promise<Attachment> {
    try {
      return await this.prisma.attachment.create({
        data
      });
    } catch (error) {
      this.handleError('create', error);
    }
  }

  /**
   * Update an attachment
   */
  async update(id: string, data: Prisma.AttachmentUpdateInput): Promise<Attachment> {
    try {
      return await this.prisma.attachment.update({
        where: { id },
        data
      });
    } catch (error) {
      this.handleError('update', error);
    }
  }

  /**
   * Delete an attachment
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.attachment.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      this.handleError('delete', error);
    }
  }

  /**
   * Generate a thumbnail URL for an image
   * In a real application, this would actually generate and store a thumbnail
   * @param fileName The original file name
   * @param fileType The file MIME type
   * @returns Thumbnail URL or null if not an image
   */
  generateThumbnailUrl(fileName: string, fileType: string): string | null {
    // Only generate thumbnails for image types
    if (!fileType.startsWith('image/')) {
      return null;
    }
    
    // In a real app, this would actually generate a thumbnail
    // For now, we'll just return a mock URL
    const sanitizedName = fileName.toLowerCase().replace(/\s+/g, '-');
    return `https://example.com/thumbnails/${sanitizedName}`;
  }

  /**
   * Generate a URL for a file
   * In a real application, this would be the URL to access the file
   * @param fileName The original file name
   * @returns URL for the file
   */
  generateFileUrl(fileName: string): string {
    // In a real app, this would be a real URL to access the file
    // For now, we'll just return a mock URL
    const sanitizedName = fileName.toLowerCase().replace(/\s+/g, '-');
    return `https://example.com/files/${sanitizedName}`;
  }
}