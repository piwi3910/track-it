/**
 * Shared permission checking utilities
 */

import { UserRole } from '../types/enums';

interface User {
  id: string;
  role: UserRole;
}

interface Resource {
  creatorId?: string;
  assigneeId?: string | null;
  userId?: string;
  authorId?: string;
}

/**
 * Check if a user has admin role
 */
export function isAdmin(user: User | null | undefined): boolean {
  return user?.role === 'admin';
}

/**
 * Check if a user is the creator of a resource
 */
export function isCreator(user: User | null | undefined, resource: Resource): boolean {
  if (!user) return false;
  
  // Check various property names for creator/owner
  if ('creatorId' in resource && resource.creatorId) {
    return user.id === resource.creatorId;
  }
  if ('userId' in resource && resource.userId) {
    return user.id === resource.userId;
  }
  if ('authorId' in resource && resource.authorId) {
    return user.id === resource.authorId;
  }
  
  return false;
}

/**
 * Check if a user is assigned to a resource
 */
export function isAssignee(user: User | null | undefined, resource: Resource): boolean {
  if (!user) return false;
  return 'assigneeId' in resource && resource.assigneeId === user.id;
}

/**
 * Check if a user can view a resource
 * Generally: admin, creator, or assignee can view
 */
export function canView(user: User | null | undefined, resource: Resource): boolean {
  if (!user) return false;
  return isAdmin(user) || isCreator(user, resource) || isAssignee(user, resource);
}

/**
 * Check if a user can edit a resource
 * Generally: admin, creator, or assignee can edit
 */
export function canEdit(user: User | null | undefined, resource: Resource): boolean {
  if (!user) return false;
  return isAdmin(user) || isCreator(user, resource) || isAssignee(user, resource);
}

/**
 * Check if a user can delete a resource
 * Generally: admin or creator can delete
 */
export function canDelete(user: User | null | undefined, resource: Resource): boolean {
  if (!user) return false;
  return isAdmin(user) || isCreator(user, resource);
}

/**
 * Check if a user can assign a resource to others
 * Generally: admin or creator can assign
 */
export function canAssign(user: User | null | undefined, resource: Resource): boolean {
  if (!user) return false;
  return isAdmin(user) || isCreator(user, resource);
}

/**
 * Generic permission check with custom logic
 */
export function hasPermission(
  user: User | null | undefined,
  resource: Resource,
  permission: 'view' | 'edit' | 'delete' | 'assign'
): boolean {
  switch (permission) {
    case 'view':
      return canView(user, resource);
    case 'edit':
      return canEdit(user, resource);
    case 'delete':
      return canDelete(user, resource);
    case 'assign':
      return canAssign(user, resource);
    default:
      return false;
  }
}