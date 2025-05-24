/**
 * tRPC exports for type sharing
 * This file exports the AppRouter type for use in the frontend
 */

export type { AppRouter } from './router';
export { appRouter } from './router';
export { createContext } from './context';
export { publicProcedure, protectedProcedure, adminProcedure } from './trpc';