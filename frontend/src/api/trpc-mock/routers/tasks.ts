/**
 * Tasks router for the mock tRPC API
 */

import { router, query, mutation } from '../trpc';
import { db, delay } from '../db';
import {
  TaskByIdInput,
  TasksByStatusInput,
  TaskCreateInput,
  TaskUpdateInput,
  TaskDeleteInput,
  TaskSearchInput,
  CreateFromTemplateInput,
  SaveAsTemplateInput
} from '../types';
import { Task, TaskTemplate } from '@/types/task';

// Create the tasks router with all endpoints
export const tasksRouter = router({
  // Get all tasks
  getAll: query()
    .query(async () => {
      await delay(300); // Simulate network latency
      return db.tasks.findAll();
    }),

  // Get task by ID
  getById: query()
    .query(async ({ id }: TaskByIdInput) => {
      await delay(200);
      return db.tasks.findById(id);
    }),

  // Get tasks by status
  getByStatus: query()
    .query(async ({ status }: TasksByStatusInput) => {
      await delay(300);
      return db.tasks.findByStatus(status);
    }),

  // Create a new task
  create: mutation()
    .mutation(async (input: TaskCreateInput) => {
      await delay(500);
      const taskData = {
        title: input.title,
        description: input.description || '',
        status: input.status || 'todo',
        priority: input.priority,
        tags: input.tags || [],
        dueDate: input.dueDate || null,
        assigneeId: input.assigneeId || null,
        estimatedHours: input.estimatedHours || 0,
        subtasks: input.subtasks ? input.subtasks.map((st, idx) => ({
          id: `subtask-${Date.now()}-${idx}`,
          title: st.title,
          completed: st.completed
        })) : []
      };
      
      return db.tasks.create(taskData);
    }),

  // Create a task from a template
  createFromTemplate: mutation()
    .mutation(async ({ templateId, taskData }: CreateFromTemplateInput) => {
      await delay(500);
      
      // Find the template
      const template = db.templates.findById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }
      
      // Increment template usage count
      db.templates.incrementUsage(templateId);
      
      // Create a new task based on the template and provided data
      const newTaskData = {
        title: taskData.title || template.name,
        description: taskData.description || template.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || template.priority,
        tags: taskData.tags || template.tags || [],
        dueDate: taskData.dueDate || null,
        estimatedHours: taskData.estimatedHours || template.estimatedHours,
        subtasks: template.subtasks ? [...template.subtasks] : [],
        assigneeId: taskData.assigneeId || null,
        ...taskData // Override with any additional task data
      };
      
      return db.tasks.create(newTaskData);
    }),

  // Update an existing task
  update: mutation()
    .mutation(async ({ id, data }: TaskUpdateInput) => {
      await delay(400);
      return db.tasks.update(id, data);
    }),

  // Delete a task
  delete: mutation()
    .mutation(async ({ id }: TaskDeleteInput) => {
      await delay(400);
      db.tasks.delete(id);
    }),

  // Search tasks
  search: query()
    .query(async ({ query }: TaskSearchInput) => {
      await delay(300);
      return db.tasks.search(query);
    }),

  // Save task as template
  saveAsTemplate: mutation()
    .mutation(async ({ taskId, templateName, isPublic = true }: SaveAsTemplateInput) => {
      await delay(500);
      const task = db.tasks.findById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }
      
      // Create a new template from the task
      const templateData: Omit<TaskTemplate, 'id' | 'createdAt' | 'usageCount'> = {
        name: templateName,
        description: task.description,
        priority: task.priority,
        tags: task.tags,
        estimatedHours: task.estimatedHours,
        subtasks: task.subtasks ? [...task.subtasks] : [],
        category: task.tags?.[0] || 'General',
        createdBy: task.assigneeId || task.reporterId || 'user1', // Default to current user
        isPublic: isPublic
      };
      
      return db.templates.create(templateData);
    })
});