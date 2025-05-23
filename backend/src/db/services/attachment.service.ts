/**
 * Attachment service for database operations on Attachment model
 */
import { Prisma } from '@prisma/client';
import prisma from '../client';
import { createDatabaseError } from '../../utils/error-handler';

/**
 * Get attachments by task ID
 */
export async function getAttachmentsByTaskId(taskId: string) {
  try {
    return await prisma.attachment.findMany({
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
 * Get attachment by ID
 */
export async function getAttachmentById(id: string) {
  try {
    return await prisma.attachment.findUnique({
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
 * Create a new attachment
 * @param data The attachment data
 */
export async function createAttachment(data: Prisma.AttachmentCreateInput) {
  try {
    return await prisma.attachment.create({
      data
    });
  } catch (error) {
    throw createDatabaseError('Failed to create attachment', { error });
  }
}

/**
 * Delete an attachment
 * @param id The attachment ID
 */
export async function deleteAttachment(id: string) {
  try {
    await prisma.attachment.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    throw createDatabaseError(`Failed to delete attachment with ID ${id}`, { error });
  }
}

/**
 * Generate a thumbnail URL for an image
 * In a real application, this would actually generate and store a thumbnail
 * @param fileName The original file name
 * @param fileType The file MIME type
 * @returns Thumbnail URL or null if not an image
 */
export function generateThumbnailUrl(fileName: string, fileType: string): string | null {
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
export function generateFileUrl(fileName: string): string {
  // In a real app, this would be a real URL to access the file
  // For now, we'll just return a mock URL
  const sanitizedName = fileName.toLowerCase().replace(/\s+/g, '-');
  return `https://example.com/files/${sanitizedName}`;
}