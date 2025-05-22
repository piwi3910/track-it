/**
 * User service for database operations on User model
 */
import { Prisma } from '../../generated/prisma';
import prisma from '../client';
import { createDatabaseError } from '../../utils/error-handler';
import bcrypt from 'bcrypt';
import { USER_ROLE } from '../../utils/constants';

/**
 * Get all users
 */
export async function getAllUsers() {
  try {
    return await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        googleId: true,
        _count: {
          select: {
            createdTasks: true,
            assignedTasks: true,
            notifications: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  } catch (error) {
    throw createDatabaseError('Failed to get users', { error });
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string) {
  try {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        preferences: true,
        googleId: true,
        googleToken: true,
        googleRefreshToken: true,
        googleProfile: true,
        _count: {
          select: {
            createdTasks: true,
            assignedTasks: true,
            notifications: true
          }
        }
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to get user with ID ${id}`, { error });
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  try {
    return await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        avatarUrl: true,
        lastLogin: true,
        preferences: true,
        googleId: true,
        googleToken: true,
        googleRefreshToken: true,
        googleProfile: true
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to get user with email ${email}`, { error });
  }
}

/**
 * Get user by Google ID
 */
export async function getUserByGoogleId(googleId: string) {
  try {
    return await prisma.user.findUnique({
      where: { googleId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        lastLogin: true,
        preferences: true,
        googleId: true,
        googleToken: true,
        googleRefreshToken: true,
        googleProfile: true
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to get user with Google ID ${googleId}`, { error });
  }
}

/**
 * Create a new user
 */
export async function createUser(data: any) {
  try {
    // Extract password from data if provided
    let userCreateData: any = { ...data };
    
    // Remove non-database fields
    const { password, passwordConfirm, ...cleanedData } = userCreateData;
    userCreateData = cleanedData;
    
    // If no passwordHash is provided but password is, hash the password
    if (userCreateData.passwordHash === undefined && password) {
      userCreateData.passwordHash = await bcrypt.hash(password, 10);
    }
    
    // For nested JSON fields, ensure they are properly formatted
    if (userCreateData.preferences && typeof userCreateData.preferences === 'object') {
      userCreateData.preferences = userCreateData.preferences;
    }
    
    // For Google profile data
    if (userCreateData.googleProfile && typeof userCreateData.googleProfile === 'object') {
      userCreateData.googleProfile = userCreateData.googleProfile;
    }
    
    return await prisma.user.create({
      data: userCreateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true
      }
    });
  } catch (error: any) {
    console.error('Error creating user:', error);

    // Check for Prisma unique constraint violation (P2002)
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      // Let this error propagate to the router where it will be handled
      throw new Error('Email already exists');
    }

    // For other errors, use standard database error
    throw createDatabaseError('Failed to create user', { error });
  }
}

/**
 * Update a user
 */
export async function updateUser(id: string, data: Prisma.UserUpdateInput) {
  try {
    return await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        preferences: true,
        googleId: true
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to update user with ID ${id}`, { error });
  }
}

/**
 * Delete a user
 */
export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    throw createDatabaseError(`Failed to delete user with ID ${id}`, { error });
  }
}

/**
 * Update user role
 */
export async function updateUserRole(id: string, role: string) {
  try {
    return await prisma.user.update({
      where: { id },
      data: {
        role: role.toUpperCase() as Prisma.EnumUserRoleFieldUpdateOperationsInput
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to update role for user with ID ${id}`, { error });
  }
}

/**
 * Verify user password
 */
export async function verifyPassword(providedPassword: string, passwordHash: string) {
  try {
    return await bcrypt.compare(providedPassword, passwordHash);
  } catch (error) {
    throw createDatabaseError('Failed to verify password', { error });
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(id: string, newPassword: string) {
  try {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    return await prisma.user.update({
      where: { id },
      data: {
        passwordHash
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to update password for user with ID ${id}`, { error });
  }
}

/**
 * Update user login timestamp
 */
export async function updateLoginTimestamp(id: string) {
  try {
    return await prisma.user.update({
      where: { id },
      data: {
        lastLogin: new Date()
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to update login timestamp for user with ID ${id}`, { error });
  }
}

/**
 * Connect Google account to user
 */
export async function connectGoogleAccount(
  id: string, 
  googleId: string, 
  googleToken?: string,
  googleRefreshToken?: string,
  googleProfile?: any
) {
  try {
    return await prisma.user.update({
      where: { id },
      data: {
        googleId,
        googleToken,
        googleRefreshToken,
        googleProfile: googleProfile ? { set: googleProfile } : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        googleId: true
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to connect Google account for user with ID ${id}`, { error });
  }
}

/**
 * Disconnect Google account from user
 */
export async function disconnectGoogleAccount(id: string) {
  try {
    return await prisma.user.update({
      where: { id },
      data: {
        googleId: null,
        googleToken: null,
        googleRefreshToken: null,
        googleProfile: Prisma.DbNull
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to disconnect Google account for user with ID ${id}`, { error });
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(id: string, preferences: any) {
  try {
    // Get current preferences
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        preferences: true
      }
    });

    // Merge with new preferences
    const updatedPreferences = {
      ...(user?.preferences as object || {}),
      ...preferences
    };

    return await prisma.user.update({
      where: { id },
      data: {
        preferences: updatedPreferences
      },
      select: {
        id: true,
        preferences: true
      }
    });
  } catch (error) {
    throw createDatabaseError(`Failed to update preferences for user with ID ${id}`, { error });
  }
}

/**
 * Update user avatar
 */
export async function updateUserAvatar(id: string, avatarUrl: string | null) {
  try {
    // Validate base64 data URL if provided
    if (avatarUrl) {
      // Check if it's a data URL (base64 encoded image)
      if (avatarUrl.startsWith('data:image/')) {
        // Validate it's a supported image format
        const supportedFormats = ['data:image/jpeg;base64,', 'data:image/png;base64,', 'data:image/gif;base64,'];
        const isValidFormat = supportedFormats.some(format => avatarUrl.startsWith(format));
        
        if (!isValidFormat) {
          throw new Error('Unsupported image format. Please use JPEG, PNG, or GIF.');
        }

        // Check approximate file size (base64 is ~4/3 of original size)
        const base64Data = avatarUrl.split(',')[1];
        const approximateSize = (base64Data.length * 3) / 4;
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (approximateSize > maxSize) {
          throw new Error('Image size too large. Please use an image smaller than 5MB.');
        }
      }
      // If it's not a data URL, assume it's a regular URL (for external avatars)
    }

    return await prisma.user.update({
      where: { id },
      data: {
        avatarUrl
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        preferences: true,
        googleId: true
      }
    });
  } catch (error: any) {
    // Handle specific validation errors
    if (error.message?.includes('Unsupported image format') || error.message?.includes('Image size too large')) {
      throw error; // Re-throw validation errors as-is
    }
    
    throw createDatabaseError(`Failed to update avatar for user with ID ${id}`, { error });
  }
}