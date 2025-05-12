/**
 * Types for the mock tRPC API implementation
 */

import { Task, User, Comment, Attachment, TaskTemplate, TaskStatus, TaskPriority, TaskFilter } from '@/types/task';

// Generic procedure types
export type ProcedureType = 'query' | 'mutation' | 'subscription';

// Input and output types for procedures
export interface ProcedureOptions<TInput = any, TOutput = any> {
  type: ProcedureType;
  input?: TInput;
  output: TOutput;
}

// Mock Procedure that simulates tRPC procedure
export interface MockProcedure<TInput = any, TOutput = any> {
  _def: ProcedureOptions<TInput, TOutput>;
  query: <T extends TOutput>(handler: (input: TInput) => Promise<T>) => MockProcedureEndpoint<TInput, T>;
  mutation: <T extends TOutput>(handler: (input: TInput) => Promise<T>) => MockProcedureEndpoint<TInput, T>;
}

// Mock Router that simulates tRPC router
export type MockRouter = Record<string, MockProcedure | MockRouter>;

// Mock Procedure Endpoint (the actual callable function)
export interface MockProcedureEndpoint<TInput, TOutput> {
  (input: TInput): Promise<TOutput>;
  _def: ProcedureOptions<TInput, TOutput>;
}

// Simulated tRPC caller
export type Caller<T extends MockRouter> = {
  [K in keyof T]: T[K] extends MockProcedureEndpoint<infer I, infer O>
    ? (input: I) => Promise<O>
    : T[K] extends MockRouter
    ? Caller<T[K]>
    : never;
};

// Task router input/output types
export interface TaskByIdInput {
  id: string;
}

export interface TasksByStatusInput {
  status: TaskStatus;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority: TaskPriority;
  tags?: string[];
  dueDate?: string | null;
  assigneeId?: string | null;
  estimatedHours?: number;
  subtasks?: Array<{
    title: string;
    completed: boolean;
  }>;
}

export interface TaskUpdateInput {
  id: string;
  data: Partial<Task>;
}

export interface TaskDeleteInput {
  id: string;
}

export interface TaskSearchInput {
  query: string;
}

export interface CreateFromTemplateInput {
  templateId: string;
  taskData: Partial<Task>;
}

export interface SaveAsTemplateInput {
  taskId: string;
  templateName: string;
  isPublic?: boolean;
}

// Template router input/output types
export interface TemplateByIdInput {
  id: string;
}

export interface TemplateByCategoryInput {
  category: string;
}

export interface TemplateCreateInput {
  name: string;
  description?: string;
  priority: TaskPriority;
  tags?: string[];
  estimatedHours?: number;
  subtasks?: Array<{
    title: string;
    completed: boolean;
  }>;
  category?: string;
  isPublic?: boolean;
}

export interface TemplateUpdateInput {
  id: string;
  data: Partial<TaskTemplate>;
}

export interface TemplateDeleteInput {
  id: string;
}

export interface TemplateSearchInput {
  query: string;
}

// Comment router input/output types
export interface CommentsByTaskIdInput {
  taskId: string;
}

export interface CommentCountByTaskIdInput {
  taskId: string;
}

export interface CommentCreateInput {
  taskId: string;
  authorId: string;
  text: string;
}

export interface CommentUpdateInput {
  id: string;
  text: string;
}

export interface CommentDeleteInput {
  id: string;
}

// Attachment router input/output types
export interface AttachmentsByTaskIdInput {
  taskId: string;
}

export interface AttachmentUploadInput {
  taskId: string;
  file: {
    name: string;
    type: string;
    size: number;
  };
}

export interface AttachmentDeleteInput {
  id: string;
}

// User router input/output types
export interface UserByIdInput {
  id: string;
}

// Analytics router input/output types
export interface TaskCompletionStatsInput {
  timeframe: 'week' | 'month' | 'year';
}

// The shape of the mock tRPC API
export interface AppRouter {
  tasks: {
    getAll: MockProcedureEndpoint<void, Task[]>;
    getById: MockProcedureEndpoint<TaskByIdInput, Task | null>;
    getByStatus: MockProcedureEndpoint<TasksByStatusInput, Task[]>;
    create: MockProcedureEndpoint<TaskCreateInput, Task>;
    createFromTemplate: MockProcedureEndpoint<CreateFromTemplateInput, Task>;
    update: MockProcedureEndpoint<TaskUpdateInput, Task>;
    delete: MockProcedureEndpoint<TaskDeleteInput, void>;
    search: MockProcedureEndpoint<TaskSearchInput, Task[]>;
    saveAsTemplate: MockProcedureEndpoint<SaveAsTemplateInput, TaskTemplate>;
  };
  templates: {
    getAll: MockProcedureEndpoint<void, TaskTemplate[]>;
    getById: MockProcedureEndpoint<TemplateByIdInput, TaskTemplate | null>;
    getByCategory: MockProcedureEndpoint<TemplateByCategoryInput, TaskTemplate[]>;
    getCategories: MockProcedureEndpoint<void, string[]>;
    create: MockProcedureEndpoint<TemplateCreateInput, TaskTemplate>;
    update: MockProcedureEndpoint<TemplateUpdateInput, TaskTemplate>;
    delete: MockProcedureEndpoint<TemplateDeleteInput, void>;
    search: MockProcedureEndpoint<TemplateSearchInput, TaskTemplate[]>;
  };
  users: {
    getAll: MockProcedureEndpoint<void, User[]>;
    getById: MockProcedureEndpoint<UserByIdInput, User | null>;
    getCurrentUser: MockProcedureEndpoint<void, User>;
  };
  comments: {
    getByTaskId: MockProcedureEndpoint<CommentsByTaskIdInput, Comment[]>;
    getCommentCount: MockProcedureEndpoint<CommentCountByTaskIdInput, number>;
    create: MockProcedureEndpoint<CommentCreateInput, Comment>;
    update: MockProcedureEndpoint<CommentUpdateInput, Comment>;
    delete: MockProcedureEndpoint<CommentDeleteInput, void>;
  };
  attachments: {
    getByTaskId: MockProcedureEndpoint<AttachmentsByTaskIdInput, Attachment[]>;
    upload: MockProcedureEndpoint<AttachmentUploadInput, Attachment>;
    delete: MockProcedureEndpoint<AttachmentDeleteInput, void>;
  };
  analytics: {
    getTasksCompletionStats: MockProcedureEndpoint<TaskCompletionStatsInput, { date: string; completed: number }[]>;
    getUserWorkload: MockProcedureEndpoint<void, { userId: string; taskCount: number }[]>;
    getTasksByPriority: MockProcedureEndpoint<void, { priority: TaskPriority; count: number }[]>;
  };
  googleIntegration: {
    syncCalendar: MockProcedureEndpoint<void, boolean>;
    importGoogleTasks: MockProcedureEndpoint<void, Task[]>;
    getGoogleDriveFiles: MockProcedureEndpoint<void, { id: string; name: string; url: string }[]>;
  };
  notifications: {
    getAll: MockProcedureEndpoint<void, { id: string; message: string; createdAt: string; read: boolean }[]>;
    markAsRead: MockProcedureEndpoint<{ id: string }, void>;
  };
}