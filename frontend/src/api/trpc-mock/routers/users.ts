/**
 * Users router for the mock tRPC API
 */

import { router, query, mutation } from '../trpc';
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
    }),
    
  // Login with email and password
  login: mutation()
    .mutation(async ({ email, password }: { email: string; password: string }) => {
      await delay(500);
      // In a mock environment, we'll just simulate a successful login with a fake token
      const user = db.users.findByEmail(email);
      
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      // Return a fake token and user data
      return {
        token: 'mock-jwt-token-' + Math.random().toString(36).substring(2),
        user
      };
    }),
    
  // Register a new user
  register: mutation()
    .mutation(async ({ name, email, password }: { name: string; email: string; password: string }) => {
      await delay(800);
      
      // Check if user already exists
      const existingUser = db.users.findByEmail(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      // Create new user
      const newUser = db.users.create({
        name,
        email,
        role: 'MEMBER'
      });
      
      // Return a fake token and user data
      return {
        token: 'mock-jwt-token-' + Math.random().toString(36).substring(2),
        user: newUser
      };
    }),
    
  // Update user profile
  updateProfile: mutation()
    .mutation(async ({ id, data }: { id: string; data: any }) => {
      await delay(400);
      return db.users.update(id, data);
    })
});