import { AppError, AppErrorDetails, ErrorCode, ErrorSeverity } from '@track-it/shared';

/**
 * Configuration for error logging
 */
interface ErrorLoggingConfig {
  /**
   * Whether to log all errors to console in development mode
   */
  logToConsole: boolean;
  
  /**
   * Whether to send errors to a backend service
   */
  sendToBackend: boolean;
  
  /**
   * Maximum number of errors to store in memory
   */
  maxErrorsInMemory: number;
  
  /**
   * Endpoint for sending errors to the backend
   */
  apiEndpoint?: string;
}

/**
 * Structure of an error log entry
 */
export interface ErrorLogEntry {
  /**
   * The error message
   */
  message: string;
  
  /**
   * The error code
   */
  code?: ErrorCode;
  
  /**
   * The error severity
   */
  severity?: ErrorSeverity;
  
  /**
   * Additional error details
   */
  details?: Record<string, unknown>;
  
  /**
   * Component where the error occurred
   */
  component?: string;
  
  /**
   * Error stack trace
   */
  stack?: string;
  
  /**
   * Timestamp when the error occurred
   */
  timestamp: string;
  
  /**
   * Browser and environment information
   */
  environment?: Record<string, string | number | boolean>;
  
  /**
   * User ID if available
   */
  userId?: string;
  
  /**
   * Session ID if available
   */
  sessionId?: string;
  
  /**
   * URL where the error occurred
   */
  url?: string;
}

// Default configuration
const defaultConfig: ErrorLoggingConfig = {
  logToConsole: import.meta.env.DEV,
  sendToBackend: import.meta.env.PROD,
  maxErrorsInMemory: 50,
  apiEndpoint: '/api/logs/error'
};

/**
 * Service for logging errors consistently across the application
 */
class ErrorLoggingService {
  private config: ErrorLoggingConfig;
  private errorLog: ErrorLogEntry[] = [];
  private sessionId: string;
  
  constructor(config: Partial<ErrorLoggingConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    // Generate a random session ID
    this.sessionId = Math.random().toString(36).substring(2, 15);
    
    // Listen for unhandled errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError);
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    }
  }
  
  /**
   * Set the current user ID
   */
  setUserId(userId: string | undefined): void {
    this.userId = userId;
  }
  
  /**
   * Clear the current user ID
   */
  clearUserId(): void {
    this.userId = undefined;
  }
  
  /**
   * Current user ID
   */
  private userId?: string;
  
  /**
   * Handle global window errors
   */
  private handleGlobalError = (event: ErrorEvent): void => {
    this.logError(event.error || event.message, { 
      type: 'window.error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  };
  
  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    this.logError(event.reason, { type: 'unhandledrejection' });
  };
  
  /**
   * Get environment information
   */
  private getEnvironment(): Record<string, string | number | boolean> {
    if (typeof window === 'undefined') {
      return { environment: 'server' };
    }
    
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      url: window.location.href,
      referrer: document.referrer,
      environment: import.meta.env.MODE || 'development'
    };
  }
  
  /**
   * Format an error for logging
   */
  private formatError(error: unknown, context: Record<string, unknown> = {}): ErrorLogEntry {
    let errorLog: ErrorLogEntry = {
      message: 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: this.getEnvironment(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      sessionId: this.sessionId,
      userId: this.userId
    };
    
    // Add context
    if (Object.keys(context).length > 0) {
      errorLog.details = context;
    }
    
    // Extract error information
    if (error instanceof AppError) {
      errorLog = {
        ...errorLog,
        message: error.message,
        code: error.details.code,
        severity: error.details.severity,
        details: {
          ...errorLog.details,
          ...error.details
        },
        stack: error.stack
      };
    } else if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      // It's an AppErrorDetails-like object
      const errorDetails = error as AppErrorDetails;
      errorLog = {
        ...errorLog,
        message: errorDetails.message,
        code: errorDetails.code,
        severity: 'severity' in errorDetails ? (errorDetails as AppErrorDetails & { severity?: ErrorSeverity }).severity : undefined,
        details: {
          ...errorLog.details,
          ...errorDetails.details
        }
      };
    } else if (error instanceof Error) {
      errorLog = {
        ...errorLog,
        message: error.message,
        stack: error.stack,
        details: {
          ...errorLog.details,
          name: error.name
        }
      };
    } else if (typeof error === 'string') {
      errorLog.message = error;
    } else if (error !== null && error !== undefined) {
      errorLog = {
        ...errorLog,
        message: 'Non-error object thrown',
        details: {
          ...errorLog.details,
          value: String(error),
          type: typeof error
        }
      };
    }
    
    return errorLog;
  }
  
  /**
   * Log an error to the console and/or backend
   */
  logError(error: unknown, context: Record<string, unknown> = {}): void {
    const errorLog = this.formatError(error, context);
    
    // Add to in-memory log
    this.errorLog.push(errorLog);
    
    // Trim log if it's too large
    if (this.errorLog.length > this.config.maxErrorsInMemory) {
      this.errorLog = this.errorLog.slice(-this.config.maxErrorsInMemory);
    }
    
    // Log to console in development
    if (this.config.logToConsole) {
      console.error('Error logged:', errorLog);
    }
    
    // Send to backend in production
    if (this.config.sendToBackend && this.config.apiEndpoint) {
      try {
        fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(errorLog),
          // Don't wait for response or handle errors
          keepalive: true
        }).catch(() => {
          // Ignore fetch errors to prevent infinite loops
        });
      } catch {
        // Ignore errors in the error logger to prevent infinite loops
      }
    }
  }
  
  /**
   * Log an API error specifically
   */
  logApiError(error: unknown, endpoint: string, params?: unknown): void {
    this.logError(error, {
      type: 'api_error',
      endpoint,
      params,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Get all logged errors
   */
  getErrors(): ReadonlyArray<ErrorLogEntry> {
    return [...this.errorLog];
  }
  
  /**
   * Clear all logged errors
   */
  clearErrors(): void {
    this.errorLog = [];
  }
  
  /**
   * Clean up event listeners
   */
  cleanup(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', this.handleGlobalError);
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    }
  }
}

// Create a singleton instance
export const errorLoggingService = new ErrorLoggingService();