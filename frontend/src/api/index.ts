/**
 * API entry point
 * This file controls which API implementation is used (mock or real)
 */

// Import the real tRPC API client
import * as trpcApi from './trpc-api-client';

// Import the mock API for development/testing
import * as mockApi from './trpc-mock/client';

// Environment check to determine which API to use
import { env } from '@/utils/env';

// Use mock API if VITE_USE_MOCK_API is set to 'true'
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

// For development, we'll use mock API if explicitly set
// For production, always use real API
const useMockApi = env.MODE === 'production' ? false : USE_MOCK_API;

// Export the appropriate API based on the environment
export const api = useMockApi ? mockApi : trpcApi;

// Export types from the shared package for type consistency
export type { RouterInputs, RouterOutputs } from '@track-it/shared';