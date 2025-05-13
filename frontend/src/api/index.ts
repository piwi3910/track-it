/**
 * API entry point
 * This file exports the tRPC API client for use throughout the application
 */

// Import the tRPC API client
import * as trpcApi from './trpc-api-client';

// Export the API directly (no more conditional mock API)
export const api = trpcApi;

// Export types from the shared package for type consistency
export type { RouterInputs, RouterOutputs } from '@track-it/shared';