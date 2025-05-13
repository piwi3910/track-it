/**
 * API entry point
 * This file controls which API implementation is used (mock or real)
 */

// Use this import for the real tRPC API (v11 compatible)
import * as trpcApi from './trpc-client';

// Use this import for the mock API
import * as mockApi from './trpc-mock/client';

// SWITCH BETWEEN MOCK AND REAL API HERE
const USE_REAL_API = true; // Use the real API with tRPC

// Export the appropriate API based on the USE_REAL_API flag
export const api = USE_REAL_API ? trpcApi : mockApi;

// Always export types from the real API for type consistency
export type { RouterInputs, RouterOutputs } from './trpc-server-types-v11';