/**
 * API Health Utilities
 * 
 * Utilities for checking API health, error handling, and diagnostics during testing
 */

import fetch from 'cross-fetch';
import { TRPCClientError } from '@trpc/client';
import { API_CONFIG } from './api-test-utils';

// Console output styling
const consoleStyles = {
  info: (msg: string) => `\x1b[36m${msg}\x1b[0m`, // Cyan
  success: (msg: string) => `\x1b[32m${msg}\x1b[0m`, // Green
  warning: (msg: string) => `\x1b[33m${msg}\x1b[0m`, // Yellow
  error: (msg: string) => `\x1b[31m${msg}\x1b[0m`, // Red
  highlight: (msg: string) => `\x1b[35m${msg}\x1b[0m`, // Magenta
  dim: (msg: string) => `\x1b[2m${msg}\x1b[0m` // Dim
};

/**
 * Check if the backend API is available and healthy
 * @param verbose - Whether to log verbose output
 * @returns Promise resolving to a health status object
 */
export const checkApiHealth = async (verbose = false): Promise<{
  available: boolean;
  healthy: boolean;
  endpoints: {
    [key: string]: { status: number; ok: boolean; time: number };
  };
  responseTime: number;
  version?: string;
}> => {
  if (verbose) {
    console.log(consoleStyles.info('🔍 Checking API health...'));
  }
  
  const startTime = Date.now();
  const endpoints = {
    '/': { status: 0, ok: false, time: 0 },
    '/health': { status: 0, ok: false, time: 0 },
    '/trpc': { status: 0, ok: false, time: 0 }
  };
  
  // Set a base status
  let available = false;
  let healthy = false;
  let version = undefined;
  
  try {
    // Check root endpoint
    const rootStart = Date.now();
    try {
      const rootResponse = await fetch(`${API_CONFIG.baseUrl}/`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        timeout: 5000
      });
      
      endpoints['/'] = {
        status: rootResponse.status,
        ok: rootResponse.ok,
        time: Date.now() - rootStart
      };
      
      if (rootResponse.ok) {
        available = true;
        try {
          // Try to extract version if available
          const data = await rootResponse.json();
          version = data.version || data.apiVersion;
        } catch (e) {
          // Ignore JSON parsing errors
        }
      }
    } catch (error) {
      endpoints['/'] = {
        status: 0,
        ok: false,
        time: Date.now() - rootStart
      };
    }
    
    // Check health endpoint
    const healthStart = Date.now();
    try {
      const healthResponse = await fetch(`${API_CONFIG.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        timeout: 5000
      });
      
      endpoints['/health'] = {
        status: healthResponse.status,
        ok: healthResponse.ok,
        time: Date.now() - healthStart
      };
      
      if (healthResponse.ok) {
        healthy = true;
        available = true;
      }
    } catch (error) {
      endpoints['/health'] = {
        status: 0,
        ok: false,
        time: Date.now() - healthStart
      };
    }
    
    // Check tRPC endpoint
    const trpcStart = Date.now();
    try {
      const trpcResponse = await fetch(`${API_CONFIG.baseUrl}/trpc`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        timeout: 5000
      });
      
      endpoints['/trpc'] = {
        status: trpcResponse.status,
        ok: trpcResponse.status === 404, // tRPC actually returns 404 for GET requests
        time: Date.now() - trpcStart
      };
      
      if (trpcResponse.status === 404) {
        // tRPC endpoint typically returns 404 on GET requests, which is normal
        available = true;
      }
    } catch (error) {
      endpoints['/trpc'] = {
        status: 0,
        ok: false,
        time: Date.now() - trpcStart
      };
    }
    
    const responseTime = Date.now() - startTime;
    
    if (verbose) {
      if (available && healthy) {
        console.log(consoleStyles.success(`✅ API is available and healthy (${responseTime}ms)`));
      } else if (available) {
        console.log(consoleStyles.warning(`⚠️ API is available but health check failed (${responseTime}ms)`));
      } else {
        console.log(consoleStyles.error(`❌ API is not available (${responseTime}ms)`));
      }
      
      // Log endpoint details
      console.log(consoleStyles.dim('Endpoint checks:'));
      Object.entries(endpoints).forEach(([endpoint, status]) => {
        const statusStr = status.ok 
          ? consoleStyles.success(`OK (${status.status})`) 
          : consoleStyles.error(`Failed (${status.status})`);
        console.log(consoleStyles.dim(`  ${endpoint}: ${statusStr} in ${status.time}ms`));
      });
    }
    
    return {
      available,
      healthy,
      endpoints,
      responseTime,
      version
    };
  } catch (error) {
    if (verbose) {
      console.error(consoleStyles.error('❌ Error checking API health:'), error);
    }
    
    return {
      available: false,
      healthy: false,
      endpoints,
      responseTime: Date.now() - startTime
    };
  }
};

/**
 * Error categories for API error diagnosis
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTH = 'authentication',
  PERMISSION = 'permission',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

/**
 * Diagnose a tRPC API error into a categorized form
 * @param error - The error to diagnose
 * @returns Diagnostic information about the error
 */
export const diagnoseApiError = (error: unknown): {
  category: ErrorCategory;
  message: string;
  code?: string;
  status?: number;
  retriable: boolean;
  originalError: unknown;
} => {
  if (error instanceof TRPCClientError) {
    // Network/connection errors
    if (error.message.includes('fetch') || 
        error.message.includes('network') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('CORS') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('Unable to transform response')) {
      return {
        category: ErrorCategory.NETWORK,
        message: 'Network connection error',
        code: 'NETWORK_ERROR',
        status: 0,
        retriable: true,
        originalError: error
      };
    }
    
    // Timeout errors
    if (error.message.includes('timeout') || 
        error.message.includes('aborted')) {
      return {
        category: ErrorCategory.TIMEOUT,
        message: 'Request timed out',
        code: 'TIMEOUT_ERROR',
        retriable: true,
        originalError: error
      };
    }
    
    // Authentication errors
    if (error.message.includes('UNAUTHORIZED') || 
        error.message.includes('unauthorized') ||
        error.message.includes('not authenticated') ||
        error.data?.code === 'UNAUTHORIZED' ||
        error.data?.httpStatus === 401) {
      return {
        category: ErrorCategory.AUTH,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
        status: 401,
        retriable: false,
        originalError: error
      };
    }
    
    // Permission errors
    if (error.message.includes('FORBIDDEN') || 
        error.message.includes('permission') ||
        error.data?.code === 'FORBIDDEN' ||
        error.data?.httpStatus === 403) {
      return {
        category: ErrorCategory.PERMISSION,
        message: 'Permission denied',
        code: 'FORBIDDEN',
        status: 403,
        retriable: false,
        originalError: error
      };
    }
    
    // Not found errors
    if (error.message.includes('NOT_FOUND') || 
        error.message.includes('not found') ||
        error.data?.code === 'NOT_FOUND' ||
        error.data?.httpStatus === 404) {
      return {
        category: ErrorCategory.NOT_FOUND,
        message: 'Resource not found',
        code: 'NOT_FOUND',
        status: 404,
        retriable: false,
        originalError: error
      };
    }
    
    // Validation errors
    if (error.message.includes('BAD_REQUEST') || 
        error.message.includes('validation') ||
        error.data?.code === 'BAD_REQUEST' ||
        error.data?.httpStatus === 400) {
      return {
        category: ErrorCategory.VALIDATION,
        message: 'Invalid request data',
        code: 'BAD_REQUEST',
        status: 400,
        retriable: false,
        originalError: error
      };
    }
    
    // Server errors
    if (error.data?.httpStatus >= 500 || 
        error.message.includes('server error') ||
        error.message.includes('internal error') ||
        error.data?.code === 'INTERNAL_SERVER_ERROR') {
      return {
        category: ErrorCategory.SERVER,
        message: 'Server error occurred',
        code: 'SERVER_ERROR',
        status: error.data?.httpStatus || 500,
        retriable: true,
        originalError: error
      };
    }
    
    // If we got this far, it's an unknown type
    return {
      category: ErrorCategory.UNKNOWN,
      message: error.message,
      code: error.data?.code || 'UNKNOWN_ERROR',
      status: error.data?.httpStatus,
      retriable: false,
      originalError: error
    };
  }
  
  // Handle AbortError (timeout)
  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      category: ErrorCategory.TIMEOUT,
      message: 'Request timed out',
      code: 'ABORT_ERROR',
      retriable: true,
      originalError: error
    };
  }
  
  // Generic error
  return {
    category: ErrorCategory.UNKNOWN,
    message: error instanceof Error ? error.message : String(error),
    code: 'UNKNOWN_ERROR',
    retriable: false,
    originalError: error
  };
};

/**
 * Log detailed API error information to help with diagnostics
 * @param error - The error to log
 * @param context - Optional context about what operation was being performed
 */
export const logApiError = (error: unknown, context?: string): void => {
  const diagnosis = diagnoseApiError(error);
  
  console.error(consoleStyles.error('🚨 API Error:'), 
    context ? `[${context}] ` : '',
    diagnosis.message
  );
  
  console.error(consoleStyles.dim(`Category: ${diagnosis.category}`));
  if (diagnosis.code) console.error(consoleStyles.dim(`Code: ${diagnosis.code}`));
  if (diagnosis.status) console.error(consoleStyles.dim(`Status: ${diagnosis.status}`));
  console.error(consoleStyles.dim(`Retriable: ${diagnosis.retriable}`));
  
  if (error instanceof TRPCClientError && error.data) {
    console.error(consoleStyles.dim('TRPC Error Data:'), error.data);
  }
};