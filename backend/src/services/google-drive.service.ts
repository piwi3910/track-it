/**
 * Google Drive Service
 * 
 * This service manages Google Drive integration, including fetching files
 * and attaching them to tasks.
 */
import { prisma } from '../db/client';
import { 
  GoogleDriveFile, 
  Prisma, 
  Attachment 
} from '../generated/prisma';
import { GoogleApiService } from './google-api.service';
import { createGoogleApiError, createNotFoundError, createDatabaseError } from '../utils/error-handler';

// Input types
export interface CreateGoogleDriveFileInput {
  googleFileId: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  iconLink: string;
  thumbnailLink?: string;
  size?: string;
  createdTime?: Date;
  modifiedTime?: Date;
  userId: string;
}

export interface GoogleDriveSearchOptions {
  query?: string;
  mimeType?: string;
  includeShared?: boolean;
  includeTeamDrives?: boolean;
  maxResults?: number;
  orderBy?: string;
}

// Output interface for files with attachment info
export interface GoogleDriveFileWithAttachments extends GoogleDriveFile {
  attachments: Attachment[];
}

export class GoogleDriveService {
  /**
   * Find a Google Drive file by ID
   */
  static async findById(id: string): Promise<GoogleDriveFile | null> {
    try {
      return await prisma.googleDriveFile.findUnique({
        where: { id }
      });
    } catch (error) {
      throw createDatabaseError('Failed to find Google Drive file', { id, error });
    }
  }

  /**
   * Find a Google Drive file by Google file ID
   */
  static async findByGoogleId(googleFileId: string): Promise<GoogleDriveFile | null> {
    try {
      return await prisma.googleDriveFile.findUnique({
        where: { googleFileId }
      });
    } catch (error) {
      throw createDatabaseError('Failed to find Google Drive file by Google ID', { googleFileId, error });
    }
  }

  /**
   * Get Google Drive files for a user
   */
  static async getFilesForUser(
    userId: string,
    options: {
      limit?: number;
      includeAttachments?: boolean;
      orderBy?: 'modifiedTime' | 'createdTime' | 'name';
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<GoogleDriveFileWithAttachments[]> {
    const { 
      limit = 50, 
      includeAttachments = false,
      orderBy = 'modifiedTime',
      orderDirection = 'desc'
    } = options;
    
    try {
      return await prisma.googleDriveFile.findMany({
        where: { userId },
        orderBy: { [orderBy]: orderDirection },
        take: limit,
        include: {
          attachments: includeAttachments
        }
      });
    } catch (error) {
      throw createDatabaseError('Failed to get Google Drive files for user', { userId, options, error });
    }
  }

  /**
   * Get Google Drive files by MIME type
   */
  static async getFilesByMimeType(
    userId: string,
    mimeType: string,
    options: {
      limit?: number;
      includeAttachments?: boolean;
    } = {}
  ): Promise<GoogleDriveFileWithAttachments[]> {
    const { limit = 50, includeAttachments = false } = options;
    
    try {
      return await prisma.googleDriveFile.findMany({
        where: {
          userId,
          mimeType: {
            contains: mimeType
          }
        },
        orderBy: { modifiedTime: 'desc' },
        take: limit,
        include: {
          attachments: includeAttachments
        }
      });
    } catch (error) {
      throw createDatabaseError('Failed to get Google Drive files by MIME type', { userId, mimeType, options, error });
    }
  }

  /**
   * Search Google Drive files
   */
  static async searchFiles(
    userId: string,
    searchTerm: string,
    options: {
      limit?: number;
      includeAttachments?: boolean;
    } = {}
  ): Promise<GoogleDriveFileWithAttachments[]> {
    const { limit = 50, includeAttachments = false } = options;
    
    try {
      return await prisma.googleDriveFile.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { mimeType: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        orderBy: { modifiedTime: 'desc' },
        take: limit,
        include: {
          attachments: includeAttachments
        }
      });
    } catch (error) {
      throw createDatabaseError('Failed to search Google Drive files', { userId, searchTerm, options, error });
    }
  }

  /**
   * Get Google Drive files attached to a specific task
   */
  static async getFilesByTaskId(taskId: string): Promise<GoogleDriveFile[]> {
    try {
      // Get attachments for this task that are Google Drive files
      const attachments = await prisma.attachment.findMany({
        where: {
          taskId,
          googleDriveFileId: { not: null }
        },
        include: {
          googleDriveFile: true
        }
      });
      
      // Extract Google Drive files
      return attachments
        .map(attachment => attachment.googleDriveFile)
        .filter((file): file is GoogleDriveFile => file !== null);
    } catch (error) {
      throw createDatabaseError('Failed to get Google Drive files by task ID', { taskId, error });
    }
  }

  /**
   * Create a new Google Drive file record
   */
  static async create(data: CreateGoogleDriveFileInput): Promise<GoogleDriveFile> {
    try {
      return await prisma.googleDriveFile.create({
        data: {
          googleFileId: data.googleFileId,
          name: data.name,
          mimeType: data.mimeType,
          webViewLink: data.webViewLink,
          iconLink: data.iconLink,
          thumbnailLink: data.thumbnailLink,
          size: data.size,
          createdTime: data.createdTime,
          modifiedTime: data.modifiedTime,
          userId: data.userId,
          lastSynced: new Date()
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle unique constraint violations
        if (error.code === 'P2002') {
          // Try to update if it already exists
          const existingFile = await prisma.googleDriveFile.findUnique({
            where: { googleFileId: data.googleFileId }
          });

          if (existingFile) {
            return await this.update(existingFile.id, data);
          }

          throw createDatabaseError('Google Drive file with this ID already exists', { 
            googleFileId: data.googleFileId,
            error
          });
        }
      }
      throw createDatabaseError('Failed to create Google Drive file', { data, error });
    }
  }

  /**
   * Update a Google Drive file record
   */
  static async update(
    id: string, 
    data: Partial<Omit<CreateGoogleDriveFileInput, 'googleFileId' | 'userId'>>
  ): Promise<GoogleDriveFile> {
    try {
      return await prisma.googleDriveFile.update({
        where: { id },
        data: {
          ...data,
          lastSynced: new Date()
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw createNotFoundError('Google Drive file', id);
        }
      }
      throw createDatabaseError('Failed to update Google Drive file', { id, data, error });
    }
  }

  /**
   * Delete a Google Drive file record
   */
  static async delete(id: string): Promise<GoogleDriveFile> {
    try {
      // Check if file is referenced by any attachments
      const attachmentsCount = await prisma.attachment.count({
        where: { googleDriveFileId: id }
      });
      
      if (attachmentsCount > 0) {
        throw createDatabaseError('Cannot delete - file is attached to tasks', { id, attachmentsCount });
      }
      
      return await prisma.googleDriveFile.delete({
        where: { id }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw createNotFoundError('Google Drive file', id);
        }
      }
      throw createDatabaseError('Failed to delete Google Drive file', { id, error });
    }
  }

  /**
   * Sync files from Google Drive for a user
   */
  static async syncFilesFromGoogleDrive(
    userId: string,
    options: GoogleDriveSearchOptions = {}
  ): Promise<GoogleDriveFile[]> {
    // Get user's Google Account
    const googleAccount = await prisma.googleAccount.findFirst({
      where: { userId }
    });

    if (!googleAccount || !googleAccount.accessToken) {
      throw createNotFoundError('Google account', userId);
    }

    try {
      // Fetch files from Google Drive
      const files = await GoogleApiService.getFiles(googleAccount.accessToken, {
        query: options.query,
        pageSize: options.maxResults || 100,
        orderBy: options.orderBy || 'modifiedTime desc'
      });
      
      // Upsert files in database
      const syncedFiles: GoogleDriveFile[] = [];
      
      for (const file of files) {
        try {
          // Create or update the file in database
          const existingFile = await prisma.googleDriveFile.findUnique({
            where: { googleFileId: file.id }
          });
          
          let googleDriveFile: GoogleDriveFile;
          
          if (existingFile) {
            // Update existing file
            googleDriveFile = await prisma.googleDriveFile.update({
              where: { id: existingFile.id },
              data: {
                name: file.name,
                mimeType: file.mimeType,
                webViewLink: file.webViewLink,
                iconLink: file.iconLink,
                thumbnailLink: file.thumbnailLink,
                size: file.size,
                modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : undefined,
                lastSynced: new Date()
              }
            });
          } else {
            // Create new file
            googleDriveFile = await prisma.googleDriveFile.create({
              data: {
                googleFileId: file.id,
                name: file.name,
                mimeType: file.mimeType,
                webViewLink: file.webViewLink,
                iconLink: file.iconLink,
                thumbnailLink: file.thumbnailLink,
                size: file.size,
                createdTime: file.createdTime ? new Date(file.createdTime) : new Date(),
                modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : new Date(),
                userId,
                lastSynced: new Date()
              }
            });
          }
          
          syncedFiles.push(googleDriveFile);
        } catch (error) {
          console.error(`Failed to sync file ${file.name}:`, error);
        }
      }
      
      // Update Google account's last sync time
      await prisma.googleAccount.update({
        where: { id: googleAccount.id },
        data: {
          lastDriveSync: new Date(),
          driveSynced: true
        }
      });
      
      return syncedFiles;
    } catch (error) {
      throw createGoogleApiError('Failed to sync files from Google Drive', { userId, options, error });
    }
  }

  /**
   * Attach a Google Drive file to a task
   */
  static async attachFileToTask(
    googleDriveFileId: string,
    taskId: string,
    userId: string
  ): Promise<Attachment> {
    try {
      // Check if the task exists
      const task = await prisma.task.findUnique({
        where: { id: taskId }
      });
      
      if (!task) {
        throw createNotFoundError('Task', taskId);
      }
      
      // Check if the Drive file exists in our database
      let googleDriveFile = await prisma.googleDriveFile.findUnique({
        where: { id: googleDriveFileId }
      });
      
      if (!googleDriveFile) {
        // Check if the file exists by Google file ID
        googleDriveFile = await prisma.googleDriveFile.findFirst({
          where: { googleFileId: googleDriveFileId }
        });
      }
      
      // If file still not found, try to fetch from Google Drive
      if (!googleDriveFile) {
        // Get user's Google Account
        const googleAccount = await prisma.googleAccount.findFirst({
          where: { userId }
        });
        
        if (!googleAccount || !googleAccount.accessToken) {
          throw createNotFoundError('Google account', userId);
        }
        
        // Fetch file details from Google Drive
        const googleFile = await GoogleApiService.getFile(googleAccount.accessToken, googleDriveFileId);
        
        // Create the file record in our database
        googleDriveFile = await this.create({
          googleFileId: googleFile.id,
          name: googleFile.name,
          mimeType: googleFile.mimeType,
          webViewLink: googleFile.webViewLink,
          iconLink: googleFile.iconLink,
          thumbnailLink: googleFile.thumbnailLink,
          size: googleFile.size,
          createdTime: googleFile.createdTime ? new Date(googleFile.createdTime) : undefined,
          modifiedTime: googleFile.modifiedTime ? new Date(googleFile.modifiedTime) : undefined,
          userId
        });
      }
      
      // Check if attachment already exists
      const existingAttachment = await prisma.attachment.findFirst({
        where: {
          taskId,
          googleDriveFileId: googleDriveFile.id
        }
      });
      
      if (existingAttachment) {
        return existingAttachment;
      }
      
      // Create the attachment
      return await prisma.attachment.create({
        data: {
          taskId,
          name: googleDriveFile.name,
          fileType: googleDriveFile.mimeType,
          size: Number(googleDriveFile.size) || 0,
          url: googleDriveFile.webViewLink,
          thumbnailUrl: googleDriveFile.thumbnailLink,
          source: 'google_drive',
          googleDriveFileId: googleDriveFile.id,
          createdAt: new Date()
        }
      });
    } catch (error) {
      throw createDatabaseError('Failed to attach Google Drive file to task', { googleDriveFileId, taskId, userId, error });
    }
  }

  /**
   * Remove a Google Drive file attachment from a task
   */
  static async removeFileFromTask(
    attachmentId: string
  ): Promise<boolean> {
    try {
      // Delete the attachment
      await prisma.attachment.delete({
        where: { id: attachmentId }
      });
      
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found errors
        if (error.code === 'P2025') {
          throw createNotFoundError('Attachment', attachmentId);
        }
      }
      throw createDatabaseError('Failed to remove Google Drive file from task', { attachmentId, error });
    }
  }

  /**
   * Get recently modified files from Google Drive
   */
  static async getRecentFiles(
    userId: string,
    options: {
      limit?: number;
      days?: number;
    } = {}
  ): Promise<GoogleDriveFile[]> {
    const { limit = 10, days = 7 } = options;
    
    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    
    try {
      return await prisma.googleDriveFile.findMany({
        where: {
          userId,
          modifiedTime: {
            gte: dateThreshold
          }
        },
        orderBy: { modifiedTime: 'desc' },
        take: limit
      });
    } catch (error) {
      throw createDatabaseError('Failed to get recent Google Drive files', { userId, options, error });
    }
  }
}