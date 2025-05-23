/**
 * Template service for database operations on TaskTemplate model
 */
import { Prisma } from '../../generated/prisma';
import prisma from '../client';
import { createDatabaseError } from '../../utils/error-handler';

/**
 * Get all templates
 */
export async function getAllTemplates() {
  try {
    return await prisma.taskTemplate.findMany({
      where: {
        isPublic: true // For now, just return all public templates since createdById doesn't exist
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  } catch (error) {
    throw createDatabaseError('Failed to get templates', { error });
  }
}

/**
 * Get template by ID
 */
export async function getTemplateById(id: string) {
  try {
    return await prisma.taskTemplate.findUnique({
      where: { id }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to get template with ID ${id}`, { error });
  }
}

/**
 * Get templates by category
 */
export async function getTemplatesByCategory(category: string) {
  try {
    return await prisma.taskTemplate.findMany({
      where: {
        category,
        isPublic: true // For now, just return public templates since createdById doesn't exist
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to get templates in category ${category}`, { error });
  }
}

/**
 * Get all template categories
 */
export async function getTemplateCategories() {
  try {
    const categoriesResult = await prisma.taskTemplate.groupBy({
      by: ['category'],
      where: {
        category: {
          not: null
        }
      }
    });
    
    return categoriesResult
      .map(result => result.category)
      .filter((category): category is string => category !== null);
  } catch (error) {
    throw createDatabaseError('Failed to get template categories', { error });
  }
}

/**
 * Search templates
 */
export async function searchTemplates(query: string) {
  try {
    return await prisma.taskTemplate.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
          { category: { contains: query, mode: 'insensitive' } }
        ],
        AND: {
          isPublic: true // For now, just search public templates since createdById doesn't exist
        }
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to search templates with query ${query}`, { error });
  }
}

/**
 * Create a new template
 */
export async function createTemplate(data: Prisma.TaskTemplateCreateInput) {
  try {
    return await prisma.taskTemplate.create({
      data
    });
  } catch (error) {
    throw createDatabaseError('Failed to create template', { error });
  }
}

/**
 * Update a template
 */
export async function updateTemplate(id: string, data: Prisma.TaskTemplateUpdateInput) {
  try {
    return await prisma.taskTemplate.update({
      where: { id },
      data
    });
  } catch (error) {
    throw createDatabaseError(`Failed to update template with ID ${id}`, { error });
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string) {
  try {
    await prisma.taskTemplate.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    throw createDatabaseError(`Failed to delete template with ID ${id}`, { error });
  }
}

/**
 * Increment template usage count
 */
export async function incrementTemplateUsage(id: string) {
  try {
    return await prisma.taskTemplate.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1
        }
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to increment usage count for template with ID ${id}`, { error });
  }
}