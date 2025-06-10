/**
 * Shared validation schemas and utilities
 * Provides consistent validation across the application
 */

import { z } from 'zod';

// Common field validations
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
export const nameSchema = z.string().min(2, 'Name must be at least 2 characters');
export const idSchema = z.string().uuid('Invalid ID format');

// User validation schemas
export const userLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export const userRegisterSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  passwordConfirm: passwordSchema
}).refine(data => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ["passwordConfirm"]
});

export const updatePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
  confirmPassword: passwordSchema
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Task validation schemas
export const taskStatusSchema = z.enum(['backlog', 'todo', 'in_progress', 'review', 'done', 'archived']);
export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: taskStatusSchema.default('todo'),
  priority: taskPrioritySchema,
  tags: z.array(z.string()).optional(),
  dueDate: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  estimatedHours: z.number().optional(),
  subtasks: z.array(z.object({
    title: z.string(),
    completed: z.boolean().default(false)
  })).optional()
});

// Common pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: "Start date must be before end date",
  path: ["endDate"]
});

// Search schema
export const searchSchema = z.object({
  query: z.string().min(1),
  fields: z.array(z.string()).optional(),
  fuzzy: z.boolean().default(false)
});

/**
 * Validate data against a schema and return formatted errors
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean; 
  data?: T; 
  errors?: Record<string, string[]> 
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Format errors for easier consumption
  const errors: Record<string, string[]> = {};
  result.error.errors.forEach(err => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(err.message);
  });
  
  return { success: false, errors };
}