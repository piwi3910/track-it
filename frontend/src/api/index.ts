/**
 * Main API entry point
 * This exports the tRPC-compatible mock API client
 * It can be replaced with a real tRPC client in the future without changing imports
 */

// Re-export the mock client
export { api, apiHandler, useQuery, useMutation } from './trpc-mock/client';

// Export the router type for use in TypeScript
export type { AppRouter } from './trpc-mock/types';