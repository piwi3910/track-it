/**
 * Rate limiting middleware for authentication endpoints
 */
import { TRPCError } from '@trpc/server';

interface RateLimitStore {
  attempts: Map<string, { count: number; resetTime: number }>;
}

// Simple in-memory rate limit store
const store: RateLimitStore = {
  attempts: new Map()
};

// Configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5; // 5 attempts per window

/**
 * Rate limit middleware for authentication procedures
 * Limits attempts per IP address
 */
export function rateLimitAuth(identifier: string) {
  const now = Date.now();
  const userAttempts = store.attempts.get(identifier);
  
  // Clean up expired entries
  if (userAttempts && userAttempts.resetTime < now) {
    store.attempts.delete(identifier);
  }
  
  const attempts = store.attempts.get(identifier);
  
  if (attempts) {
    if (attempts.count >= MAX_ATTEMPTS) {
      const remainingTime = Math.ceil((attempts.resetTime - now) / 1000 / 60);
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Too many login attempts. Please try again in ${remainingTime} minutes.`
      });
    }
    
    attempts.count++;
  } else {
    store.attempts.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
  }
}

/**
 * Reset rate limit for a specific identifier (e.g., after successful login)
 */
export function resetRateLimit(identifier: string) {
  store.attempts.delete(identifier);
}

/**
 * Cleanup function to remove expired entries periodically
 */
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, value] of store.attempts.entries()) {
    if (value.resetTime < now) {
      store.attempts.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);