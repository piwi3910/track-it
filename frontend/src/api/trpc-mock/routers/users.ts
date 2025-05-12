/**
 * Users router for the mock tRPC API
 */

import { router, query } from '../trpc';
import { db, delay } from '../db';
import { UserByIdInput } from '../types';

// Create the users router with all endpoints
export const usersRouter = router({
  // Get all users
  getAll: query()
    .query(async () => {
      await delay(300);
      return db.users.findAll();
    }),

  // Get user by ID
  getById: query()
    .query(async ({ id }: UserByIdInput) => {
      await delay(200);
      return db.users.findById(id);
    }),

  // Get current logged-in user
  getCurrentUser: query()
    .query(async () => {
      await delay(100);
      return db.users.getCurrentUser();
    })
});