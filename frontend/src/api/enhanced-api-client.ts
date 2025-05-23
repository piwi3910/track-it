/**
 * Enhanced API client with improved error handling and retry logic
 */
import { createTRPCProxyClient } from '@trpc/client';
import { trpcClientConfig } from '@/utils/trpc';
import { TRPCClientError } from '@trpc/client';
import { 
  AppError, 
  ErrorCode, 
  mapHttpStatusToErrorCode, 
  isRetryableError,
  parseErrorResponse
} from '@track-it/shared';
import type { Task } from '@/types/task';
import type { AppRouter } from '@track-it/shared/types/trpc';
import { errorLoggingService } from '@/services/error-logging.service';

// Create the actual tRPC client instance
const trpcClient = createTRPCProxyClient<AppRouter>(trpcClientConfig) as any;

// Retry options
interface RetryOptions {
  maxRetries: number;
  delayMs: number;
  backoffFactor: number;
  retryableErrors: ErrorCode[];
}

// Default retry configuration
const defaultRetryOptions: RetryOptions = {
  maxRetries: 3,
  delayMs: 500,
  backoffFactor: 1.5,
  retryableErrors: [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.API_UNAVAILABLE,
    ErrorCode.TIMEOUT_ERROR,
    ErrorCode.DATABASE_ERROR,
    ErrorCode.CACHE_ERROR
  ]
};

/**
 * Wrapper for API calls that provides consistent error handling and retries
 * 
 * @param apiCall - The API call function to execute
 * @param options - Optional retry configuration
 * @returns A promise with the API response
 */
export async function apiCall<T>(
  apiCall: () => Promise<T>,
  context: { endpoint?: string; method?: string } = {},
  options?: Partial<RetryOptions>
): Promise<{ data: T | null; error: AppError | null; statusCode?: number }> {
  const retryOptions = { ...defaultRetryOptions, ...options };
  let attemptCount = 0;
  let lastError: unknown = null;

  const startTime = Date.now();
  
  while (attemptCount <= retryOptions.maxRetries) {
    try {
      // Attempt the API call
      const data = await apiCall();
      
      // Log successful call duration for monitoring
      const duration = Date.now() - startTime;
      if (attemptCount > 0) {
        console.log(`API call succeeded after ${attemptCount} retries in ${duration}ms`, context);
      }
      
      return { data, error: null };
    } catch (error) {
      lastError = error;
      
      // Convert to AppError for consistent handling
      const appError = parseApiError(error, context);
      
      // Log the error
      errorLoggingService.logApiError(appError, context.endpoint || 'unknown', {
        attempt: attemptCount + 1,
        maxRetries: retryOptions.maxRetries
      });
      
      // Dispatch application-wide error event
      dispatchApiErrorEvent(appError);
      
      // Check if we should retry based on error type and attempt count
      const shouldRetry = 
        isRetryableError(appError.details.code) && 
        retryOptions.retryableErrors.includes(appError.details.code) &&
        attemptCount < retryOptions.maxRetries;
      
      if (!shouldRetry) {
        break;
      }
      
      // Calculate delay using exponential backoff
      const delay = retryOptions.delayMs * Math.pow(retryOptions.backoffFactor, attemptCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      attemptCount++;
    }
  }
  
  // Process the last error before returning
  const appError = parseApiError(lastError, context);
  const statusCode = appError.details.statusCode;

  // Dispatch additional events based on error type
  if (appError.details.code === ErrorCode.UNAUTHORIZED || 
      appError.details.code === ErrorCode.TOKEN_EXPIRED) {
    dispatchAuthErrorEvent();
  } else if (appError.details.code === ErrorCode.API_UNAVAILABLE ||
             appError.details.code === ErrorCode.NETWORK_ERROR) {
    dispatchApiUnavailableEvent();
  }
  
  return { data: null, error: appError, statusCode };
}

/**
 * Parse API errors into standardized AppError objects
 */
function parseApiError(error: unknown, context: { endpoint?: string; method?: string } = {}): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof TRPCClientError) {
    // Handle TRPC client errors
    
    // Check if the error is a network/connection error
    if (error.message.includes('fetch') || 
        error.message.includes('network') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('CORS') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('Unable to transform response')) {
      return AppError.create(
        ErrorCode.NETWORK_ERROR,
        'Cannot connect to the server. Please check your network connection.',
        {
          statusCode: 0,
          details: {
            originalError: error.message,
            endpoint: context.endpoint,
            method: context.method
          },
          retryable: true
        }
      );
    }
    
    // Check if it's an authorization error
    if (error.message === 'UNAUTHORIZED' || 
        error.data?.code === 'UNAUTHORIZED' ||
        error.message.includes('unauthorized') ||
        error.message.includes('not authenticated')) {
      return AppError.create(
        ErrorCode.UNAUTHORIZED,
        'Authentication required. Please log in again.',
        {
          statusCode: 401,
          details: { 
            originalError: error.message,
            endpoint: context.endpoint
          },
          retryable: false
        }
      );
    }
    
    // Parse API spec formatted errors (with message and code)
    if (error.data?.code && error.data?.message) {
      // API spec errors have a direct mapping to our error codes
      let errorCode: ErrorCode;
      
      // Map API spec error codes to our error codes - direct mapping for standard codes
      if (Object.values(ErrorCode).includes(error.data.code as ErrorCode)) {
        errorCode = error.data.code as ErrorCode;
      } else {
        // Fallback mapping if needed
        switch (error.data.code) {
          case 'VALIDATION_ERROR':
            errorCode = ErrorCode.VALIDATION_ERROR;
            break;
          case 'UNAUTHORIZED':
            errorCode = ErrorCode.UNAUTHORIZED;
            break;
          case 'FORBIDDEN':
            errorCode = ErrorCode.FORBIDDEN;
            break;
          case 'NOT_FOUND':
            errorCode = ErrorCode.NOT_FOUND;
            break;
          case 'INTERNAL_SERVER_ERROR':
            errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
            break;
          default:
            errorCode = ErrorCode.UNKNOWN_ERROR;
        }
      }
      
      return AppError.create(
        errorCode,
        error.data.message,
        {
          statusCode: error.data.httpStatus || 500,
          details: {
            originalCode: error.data.code,
            endpoint: context.endpoint
          }
        }
      );
    }
    
    // Fallback to HTTP status code if available
    if (error.data?.httpStatus) {
      const errorCode = mapHttpStatusToErrorCode(error.data.httpStatus);
      return AppError.create(
        errorCode,
        error.message,
        {
          statusCode: error.data.httpStatus,
          details: {
            originalError: error.message,
            endpoint: context.endpoint
          }
        }
      );
    }
  }
  
  // Use default error parsing for other types of errors
  return parseErrorResponse(error);
}

/**
 * Dispatch an API error event to notify the application
 */
function dispatchApiErrorEvent(error: AppError): void {
  // Create a custom event with error details
  const event = new CustomEvent('api_error', { 
    detail: { 
      error, 
      timestamp: new Date().toISOString() 
    } 
  });
  
  // Dispatch the event to the window
  window.dispatchEvent(event);
}

/**
 * Dispatch an authentication error event
 */
function dispatchAuthErrorEvent(): void {
  // Remove auth token
  localStorage.removeItem('token');
  
  // Create and dispatch auth error event
  const event = new CustomEvent('auth_error', {
    detail: { timestamp: new Date().toISOString() }
  });
  window.dispatchEvent(event);
}

/**
 * Dispatch an API unavailable event to trigger status checks
 */
function dispatchApiUnavailableEvent(): void {
  const event = new CustomEvent('check_api_availability', {
    detail: { timestamp: new Date().toISOString() }
  });
  window.dispatchEvent(event);
}

/**
 * Enhanced API client that uses the improved error handling
 */
export const enhancedApi = {
  auth: {
    /**
     * Login with email and password
     */
    login: async (email: string, password: string) => {
      return apiCall(
        () => trpcClient.users.login.mutate({ email, password }),
        { endpoint: 'users.login', method: 'mutate' }
      );
    },
    
    /**
     * Register a new user
     */
    register: async (name: string, email: string, password: string) => {
      return apiCall(
        () => trpcClient.users.register.mutate({
          name,
          email,
          password,
          passwordConfirm: password
        }),
        { endpoint: 'users.register', method: 'mutate' }
      );
    },
    
    /**
     * Get the current user
     */
    getCurrentUser: async () => {
      return apiCall(
        () => trpcClient.users.getCurrentUser.query(),
        { endpoint: 'users.getCurrentUser', method: 'query' }
      );
    },
    
    /**
     * Logout the current user
     */
    logout: () => {
      localStorage.removeItem('token');
      // Additional cleanup if needed
    },
    
    /**
     * Login with Google
     */
    loginWithGoogle: async (credential: string) => {
      return apiCall(
        () => trpcClient.users.loginWithGoogle.mutate({ credential }),
        { endpoint: 'users.loginWithGoogle', method: 'mutate' }
      );
    },
    
    /**
     * Verify a Google token
     */
    verifyGoogleToken: async (token: string) => {
      return apiCall(
        () => trpcClient.googleIntegration.verifyGoogleToken.query({ token }),
        { endpoint: 'googleIntegration.verifyGoogleToken', method: 'query' }
      );
    }
  },
  
  tasks: {
    /**
     * Get all tasks
     */
    getAll: async () => {
      return apiCall(
        () => trpcClient.tasks.getAll.query(),
        { endpoint: 'tasks.getAll', method: 'query' }
      );
    },
    
    /**
     * Get a task by ID
     */
    getById: async (id: string) => {
      return apiCall(
        () => trpcClient.tasks.getById.query({ id }),
        { endpoint: 'tasks.getById', method: 'query' }
      );
    },
    
    /**
     * Get tasks by status
     */
    getByStatus: async (status: string) => {
      return apiCall(
        () => trpcClient.tasks.getByStatus.query({ status }),
        { endpoint: 'tasks.getByStatus', method: 'query' }
      );
    },
    
    /**
     * Create a new task
     */
    create: async (taskData: {
      title: string;
      description?: string;
      status?: string;
      priority: string;
      tags?: string[];
      dueDate?: string | null;
      assigneeId?: string | null;
      estimatedHours?: number;
      subtasks?: { title: string; completed: boolean }[];
    }) => {
      return apiCall(
        () => trpcClient.tasks.create.mutate(taskData),
        { endpoint: 'tasks.create', method: 'mutate' }
      );
    },
    
    /**
     * Update a task
     */
    update: async (id: string, data: Partial<Task>) => {
      return apiCall(
        () => trpcClient.tasks.update.mutate({ id, data }),
        { endpoint: 'tasks.update', method: 'mutate' }
      );
    },
    
    /**
     * Delete a task
     */
    delete: async (id: string) => {
      return apiCall(
        () => trpcClient.tasks.delete.mutate({ id }),
        { endpoint: 'tasks.delete', method: 'mutate' }
      );
    },
    
    /**
     * Search for tasks
     */
    search: async (query: string) => {
      return apiCall(
        () => trpcClient.tasks.search.query({ query }),
        { endpoint: 'tasks.search', method: 'query' }
      );
    },
    
    /**
     * Save a task as a template
     */
    saveAsTemplate: async (taskId: string, templateName: string, isPublic: boolean = true) => {
      return apiCall(
        () => trpcClient.tasks.saveAsTemplate.mutate({ taskId, templateName, isPublic }),
        { endpoint: 'tasks.saveAsTemplate', method: 'mutate' }
      );
    },
    
    /**
     * Create a task from a template
     */
    createFromTemplate: async (templateId: string, taskData: Partial<Task>) => {
      return apiCall(
        () => trpcClient.tasks.createFromTemplate.mutate({ templateId, taskData }),
        { endpoint: 'tasks.createFromTemplate', method: 'mutate' }
      );
    }
  },
  
  // Add other API sections as needed (templates, comments, etc.)
  
  // Google integration API
  googleIntegration: {
    /**
     * Get Google account status
     */
    getGoogleAccountStatus: async () => {
      return apiCall(
        () => trpcClient.googleIntegration.getGoogleAccountStatus.query(),
        { endpoint: 'googleIntegration.getGoogleAccountStatus', method: 'query' }
      );
    },
    
    /**
     * Link Google account
     */
    linkGoogleAccount: async (authCode: string) => {
      return apiCall(
        () => trpcClient.googleIntegration.linkGoogleAccount.mutate({ authCode }),
        { endpoint: 'googleIntegration.linkGoogleAccount', method: 'mutate' }
      );
    },
    
    /**
     * Unlink Google account
     */
    unlinkGoogleAccount: async () => {
      return apiCall(
        () => trpcClient.googleIntegration.unlinkGoogleAccount.mutate(),
        { endpoint: 'googleIntegration.unlinkGoogleAccount', method: 'mutate' }
      );
    },
    
    /**
     * Sync Google Calendar
     */
    syncCalendar: async () => {
      return apiCall(
        () => trpcClient.googleIntegration.syncCalendar.mutate(),
        { endpoint: 'googleIntegration.syncCalendar', method: 'mutate' }
      );
    },
    
    /**
     * Import Google Tasks
     */
    importGoogleTasks: async () => {
      return apiCall(
        () => trpcClient.googleIntegration.importGoogleTasks.query(),
        { endpoint: 'googleIntegration.importGoogleTasks', method: 'query' }
      );
    },
    
    /**
     * Get Google Drive files
     */
    getGoogleDriveFiles: async () => {
      return apiCall(
        () => trpcClient.googleIntegration.getGoogleDriveFiles.query(),
        { endpoint: 'googleIntegration.getGoogleDriveFiles', method: 'query' }
      );
    },
    
    /**
     * Get Google Calendar events
     */
    getCalendarEvents: async () => {
      return apiCall(
        () => trpcClient.googleIntegration.getCalendarEvents.query(),
        { endpoint: 'googleIntegration.getCalendarEvents', method: 'query' }
      );
    }
  },
  
  // Notifications API
  notifications: {
    /**
     * Get all notifications
     */
    getAll: async () => {
      return apiCall(
        () => trpcClient.notifications.getAll.query(),
        { endpoint: 'notifications.getAll', method: 'query' }
      );
    },
    
    /**
     * Mark a notification as read
     */
    markAsRead: async (id: string) => {
      return apiCall(
        () => trpcClient.notifications.markAsRead.mutate({ id }),
        { endpoint: 'notifications.markAsRead', method: 'mutate' }
      );
    },
    
    /**
     * Mark all notifications as read
     */
    markAllAsRead: async () => {
      return apiCall(
        () => trpcClient.notifications.markAllAsRead.mutate(),
        { endpoint: 'notifications.markAllAsRead', method: 'mutate' }
      );
    }
  }
};