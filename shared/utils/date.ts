/**
 * Shared date utility functions for consistent date handling across the application
 */

/**
 * Normalize a date value to ISO string format
 * Handles both Date objects and string inputs
 */
export function normalizeDateToISO(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  
  if (date instanceof Date) {
    return date.toISOString();
  }
  
  // If it's already a string, ensure it's a valid date
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/**
 * Normalize an object with date fields to have ISO string dates
 * Commonly used for API responses
 */
export function normalizeDates<T extends Record<string, any>>(
  obj: T,
  dateFields: (keyof T)[] = ['createdAt', 'updatedAt', 'lastLogin', 'dueDate', 'completedAt']
): T {
  const normalized = { ...obj };
  
  dateFields.forEach(field => {
    if (field in normalized) {
      normalized[field] = normalizeDateToISO(normalized[field] as any) as any;
    }
  });
  
  return normalized;
}

/**
 * Format date for display in UI
 * @param date - Date to format
 * @param format - Format type: 'short', 'long', 'relative'
 */
export function formatDate(date: Date | string | null | undefined, format: 'short' | 'long' | 'relative' = 'short'): string {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString();
    case 'long':
      return dateObj.toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'relative':
      return getRelativeTime(dateObj);
    default:
      return dateObj.toLocaleDateString();
  }
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (Math.abs(diffDays) > 7) {
    return date.toLocaleDateString();
  }
  
  if (diffSeconds >= 0) {
    // Future
    if (diffDays > 0) return `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
    if (diffHours > 0) return `in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
    if (diffMinutes > 0) return `in ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
    return 'in a few seconds';
  } else {
    // Past
    const absDays = Math.abs(diffDays);
    const absHours = Math.abs(diffHours);
    const absMinutes = Math.abs(diffMinutes);
    
    if (absDays > 0) return `${absDays} day${absDays === 1 ? '' : 's'} ago`;
    if (absHours > 0) return `${absHours} hour${absHours === 1 ? '' : 's'} ago`;
    if (absMinutes > 0) return `${absMinutes} minute${absMinutes === 1 ? '' : 's'} ago`;
    return 'just now';
  }
}