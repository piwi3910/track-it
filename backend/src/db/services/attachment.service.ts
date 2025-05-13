import { prisma } from '../client';
import { Attachment, Prisma } from '../../generated/prisma';
import { TRPCError } from '@trpc/server';

export interface CreateAttachmentInput {
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
  taskId: string;
  googleDriveId?: string;
  googleDriveUrl?: string;
}

export class AttachmentService {
  /**
   * Find an attachment by ID
   */
  static async findById(id: string): Promise<Attachment | null> {
    return prisma.attachment.findUnique({
      where: { id }
    });
  }

  /**
   * Get attachments for a task
   */
  static async findByTaskId(taskId: string): Promise<Attachment[]> {
    return prisma.attachment.findMany({
      where: { taskId },
      orderBy: {
        uploadedAt: 'desc'
      }
    });
  }

  /**
   * Create a new attachment
   */
  static async create(data: CreateAttachmentInput): Promise<Attachment> {
    try {
      return await prisma.attachment.create({
        data: {
          fileName: data.fileName,
          fileSize: data.fileSize,
          fileType: data.fileType,
          filePath: data.filePath,
          task: {
            connect: { id: data.taskId }
          },
          googleDriveId: data.googleDriveId,
          googleDriveUrl: data.googleDriveUrl
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle foreign key constraint violations
        if (error.code === 'P2003') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid task ID'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Delete an attachment
   */
  static async delete(id: string): Promise<Attachment> {
    try {
      return await prisma.attachment.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Attachment not found'
          });
        }
      }
      throw error;
    }
  }

  /**
   * Create or update Google Drive attachment
   */
  static async createOrUpdateGoogleDriveAttachment(
    taskId: string,
    fileData: {
      name: string;
      size: number;
      type: string;
      googleDriveId: string;
      googleDriveUrl: string;
    }
  ): Promise<Attachment> {
    // Check if attachment with this Google Drive ID already exists
    const existingAttachment = await prisma.attachment.findFirst({
      where: {
        googleDriveId: fileData.googleDriveId
      }
    });

    // If it exists, update it
    if (existingAttachment) {
      return await prisma.attachment.update({
        where: { id: existingAttachment.id },
        data: {
          fileName: fileData.name,
          fileSize: fileData.size,
          fileType: fileData.type,
          googleDriveUrl: fileData.googleDriveUrl,
          task: {
            connect: { id: taskId }
          }
        }
      });
    }

    // Otherwise, create a new attachment
    return await prisma.attachment.create({
      data: {
        fileName: fileData.name,
        fileSize: fileData.size,
        fileType: fileData.type,
        filePath: '', // No local path for Google Drive files
        googleDriveId: fileData.googleDriveId,
        googleDriveUrl: fileData.googleDriveUrl,
        task: {
          connect: { id: taskId }
        }
      }
    });
  }
}