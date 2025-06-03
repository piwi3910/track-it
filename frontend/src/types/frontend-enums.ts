/**
 * Frontend-compatible enum types that match the backend API expectations
 * The backend expects lowercase values and transforms them to uppercase for the database
 */

// Frontend task status types (lowercase, as expected by backend API)
export type FrontendTaskStatus = 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'in_review' | 'done' | 'archived';

// Frontend task priority types (lowercase, as expected by backend API)
export type FrontendTaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Frontend user role types (lowercase, as expected by backend API)
export type FrontendUserRole = 'admin' | 'member' | 'guest';

// Conversion utilities
export const convertToBackendStatus = (status: FrontendTaskStatus): string => {
  const statusMap: Record<FrontendTaskStatus, string> = {
    'backlog': 'BACKLOG',
    'todo': 'TODO',
    'in_progress': 'IN_PROGRESS',
    'blocked': 'TODO', // Fallback since BLOCKED doesn't exist in schema
    'in_review': 'REVIEW',
    'done': 'DONE',
    'archived': 'ARCHIVED'
  };
  return statusMap[status] || 'TODO';
};

export const convertToBackendPriority = (priority: FrontendTaskPriority): string => {
  const priorityMap: Record<FrontendTaskPriority, string> = {
    'low': 'LOW',
    'medium': 'MEDIUM',
    'high': 'HIGH',
    'urgent': 'URGENT'
  };
  return priorityMap[priority] || 'MEDIUM';
};

export const convertFromBackendStatus = (status: string): FrontendTaskStatus => {
  const statusMap: Record<string, FrontendTaskStatus> = {
    'BACKLOG': 'backlog',
    'TODO': 'todo',
    'IN_PROGRESS': 'in_progress',
    'REVIEW': 'in_review',
    'DONE': 'done',
    'ARCHIVED': 'archived'
  };
  return statusMap[status] || 'todo';
};

export const convertFromBackendPriority = (priority: string): FrontendTaskPriority => {
  const priorityMap: Record<string, FrontendTaskPriority> = {
    'LOW': 'low',
    'MEDIUM': 'medium',
    'HIGH': 'high',
    'URGENT': 'urgent'
  };
  return priorityMap[priority] || 'medium';
};