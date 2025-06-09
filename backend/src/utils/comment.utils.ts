import prisma from '../db/client';
import { createDatabaseError } from './unified-error-handler';

/**
 * Extract mentions from comment text
 * @param text Comment text
 * @returns Array of usernames mentioned
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentionMatches = [...text.matchAll(mentionRegex)];
  return mentionMatches.map(match => match[1]);
}

/**
 * Resolve user IDs from usernames
 * @param usernames Array of usernames 
 * @returns Array of user IDs
 */
export async function resolveUserIds(usernames: string[]): Promise<string[]> {
  try {
    if (usernames.length === 0) return [];
    
    const users = await prisma.user.findMany({
      where: {
        OR: usernames.map(name => ({
          name: {
            equals: name,
            mode: 'insensitive'
          }
        }))
      },
      select: {
        id: true
      }
    });
    
    return users.map(user => user.id);
  } catch (error) {
    throw createDatabaseError('Failed to resolve user IDs from usernames', { error });
  }
}