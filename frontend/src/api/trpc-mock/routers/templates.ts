/**
 * Templates router for the mock tRPC API
 *
 * @ts-nocheck - Disable type checking for this file
 */

import { router, query, mutation } from '../trpc';
import { db, delay } from '../db';
import {
  TemplateByIdInput,
  TemplateByCategoryInput,
  TemplateCreateInput,
  TemplateUpdateInput,
  TemplateDeleteInput,
  TemplateSearchInput
} from '../types';

// Create the templates router with all endpoints
export const templatesRouter = router({
  // Get all templates
  getAll: query()
    .query(async () => {
      await delay(300);
      return db.templates.findAll();
    }),

  // Get template by ID
  getById: query()
    .query(async ({ id }: TemplateByIdInput) => {
      await delay(200);
      return db.templates.findById(id);
    }),

  // Get templates by category
  getByCategory: query()
    .query(async ({ category }: TemplateByCategoryInput) => {
      await delay(300);
      return db.templates.findByCategory(category);
    }),

  // Get all template categories
  getCategories: query()
    .query(async () => {
      await delay(200);
      return db.templates.getCategories();
    }),

  // Create a new template
  create: mutation()
    .mutation(async (input: TemplateCreateInput) => {
      await delay(500);
      return db.templates.create(input);
    }),

  // Update an existing template
  update: mutation()
    .mutation(async ({ id, data }: TemplateUpdateInput) => {
      await delay(400);
      return db.templates.update(id, data);
    }),

  // Delete a template
  delete: mutation()
    .mutation(async ({ id }: TemplateDeleteInput) => {
      await delay(400);
      db.templates.delete(id);
    }),

  // Search templates
  search: query()
    .query(async ({ query }: TemplateSearchInput) => {
      await delay(300);
      return db.templates.search(query);
    })
});