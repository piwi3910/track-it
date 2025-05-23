/**
 * Type definitions for test clients
 * These types help avoid using 'any' in test files
 */

// Define common response types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  preferences: {
    theme?: string;
    defaultView?: string;
    notifications?: {
      email?: boolean;
      inApp?: boolean;
    };
  };
  googleConnected?: boolean;
  googleId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse extends User {
  token: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  tags?: string[];
  dueDate?: string | null;
  estimatedHours?: number | null;
  assigneeId?: string | null;
  creatorId: string;
  createdById?: string;
  subtasks?: Array<{ title: string; completed: boolean }>;
  timeTrackingActive?: boolean;
  trackingTimeSeconds?: number;
  deleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  text: string;
  taskId: string;
  authorId: string;
  parentId?: string | null;
  author?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  templateData: unknown;
  category?: string;
  isPublic: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type TestResponse<T = unknown> = Promise<T>;

export interface TestProcedure<TInput = unknown, TOutput = unknown> {
  query: (input?: TInput) => TestResponse<TOutput>;
  mutate: (input: TInput) => TestResponse<TOutput>;
}

export interface TestUserProcedures {
  ping: { query: () => TestResponse<{ message: string }> };
  login: { mutate: (input: { email: string; password: string }) => TestResponse<LoginResponse> };
  register: { mutate: (input: { name: string; email: string; password: string; passwordConfirm: string }) => TestResponse<User> };
  getCurrentUser: { query: () => TestResponse<User> };
  updateProfile: { mutate: (input: { name?: string; email?: string; avatarUrl?: string; preferences?: Partial<User['preferences']> }) => TestResponse<User> };
  getAllUsers: { query: () => TestResponse<User[]> };
  getUserDeletionStats: { query: (input: { startDate?: string; endDate?: string }) => TestResponse<{ deletedCount: number; period: string }> };
  createUser: { mutate: (input: { name: string; email: string; password: string; role: string }) => TestResponse<User> };
  updateUser: { mutate: (input: { userId: string; name?: string; email?: string; role?: string }) => TestResponse<User> };
  deleteUser: { mutate: (input: { userId: string }) => TestResponse<{ success: boolean }> };
  resetUserPassword: { mutate: (input: { userId: string; newPassword: string }) => TestResponse<{ success: boolean }> };
  updateUserRole: { mutate: (input: { userId: string; role: string }) => TestResponse<User> };
  loginWithGoogle: { mutate: (input: { idToken: string }) => TestResponse<LoginResponse> };
  verifyGoogleToken: { mutate: (input: { credential: string }) => TestResponse<{ valid: boolean; email?: string }> };
  updateUserPreferences: { mutate: (input: { theme?: string; defaultView?: string; notifications?: { email?: boolean; inApp?: boolean } }) => TestResponse<User> };
}

export interface TestTaskProcedures {
  ping: { query: () => TestResponse<{ message: string }> };
  create: { mutate: (input: { title: string; description?: string; status?: string; priority?: string; assigneeId?: string; tags?: string[]; dueDate?: string; estimatedHours?: number; subtasks?: Array<{ title: string; completed: boolean }> }) => TestResponse<Task> };
  getById: { query: (input: { id: string }) => TestResponse<Task> };
  update: { mutate: (input: { id: string; data: { title?: string; description?: string; status?: string; priority?: string; assigneeId?: string; tags?: string[]; dueDate?: string | null; estimatedHours?: number | null; subtasks?: Array<{ title: string; completed: boolean }> } }) => TestResponse<Task> };
  delete: { mutate: (input: { id: string }) => TestResponse<{ success: boolean; id?: string; deleted?: boolean }> };
  getMy: { query: () => TestResponse<Task[]> };
  getAll: { query: (input?: { status?: string; priority?: string; assigneeId?: string; tags?: string[]; search?: string; sortBy?: string; sortOrder?: string; limit?: number; offset?: number }) => TestResponse<Task[]> };
  getByStatus: { query: (input: { status: string }) => TestResponse<Task[]> };
  getByDateRange: { query: (input: { startDate: string; endDate: string }) => TestResponse<Task[]> };
  move: { mutate: (input: { id: string; status: string; position?: number }) => TestResponse<Task> };
  assign: { mutate: (input: { id: string; assigneeId: string | null }) => TestResponse<Task> };
  search: { query: (input: { query: string; filters?: { status?: string; priority?: string; assigneeId?: string; tags?: string[] } }) => TestResponse<Task[]> };
  bulkUpdate: { mutate: (input: { taskIds: string[]; updates: { status?: string; priority?: string; assigneeId?: string | null; tags?: string[] } }) => TestResponse<{ updated: number }> };
  getDeleted: { query: () => TestResponse<Task[]> };
  getDueSoon: { query: () => TestResponse<Task[]> };
  saveAsTemplate: { mutate: (input: { taskId: string; name: string; description?: string }) => TestResponse<Template> };
  createFromTemplate: { mutate: (input: { templateId: string; assigneeId?: string }) => TestResponse<Task> };
}

export interface TestCommentProcedures {
  create: { mutate: (input: { taskId: string; text: string; parentId?: string }) => TestResponse<Comment> };
  getByTask: { query: (input: { taskId: string }) => TestResponse<Comment[]> };
  getByTaskId: { query: (input: { taskId: string }) => TestResponse<Comment[]> };
  update: { mutate: (input: { id: string; text: string }) => TestResponse<Comment> };
  delete: { mutate: (input: { id: string }) => TestResponse<{ success: boolean }> };
  getCount: { query: (input: { taskId: string }) => TestResponse<{ count: number }> };
  getCommentCount: { query: (input: { taskId: string }) => TestResponse<{ count: number }> };
  getCommentReplies: { query: (input: { commentId: string }) => TestResponse<Comment[]> };
}

export interface TestTemplateProcedures {
  create: { mutate: (input: { name: string; description?: string; templateData: unknown; category?: string; isPublic?: boolean; tags?: string[] }) => TestResponse<Template> };
  getById: { query: (input: { id: string }) => TestResponse<Template> };
  update: { mutate: (input: { id: string; data: { name?: string; description?: string; templateData?: unknown; category?: string; isPublic?: boolean } }) => TestResponse<Template> };
  delete: { mutate: (input: { id: string }) => TestResponse<{ success: boolean }> };
  getMy: { query: () => TestResponse<Template[]> };
  getPublic: { query: () => TestResponse<Template[]> };
  createTaskFromTemplate: { mutate: (input: { templateId: string; assigneeId?: string }) => TestResponse<Task> };
  duplicate: { mutate: (input: { id: string; name: string }) => TestResponse<Template> };
}

export interface TestClient {
  users: TestUserProcedures;
  tasks: TestTaskProcedures;
  comments: TestCommentProcedures;
  templates: TestTemplateProcedures;
}

// Type guard to check if a value is a TestClient
export function isTestClient(value: unknown): value is TestClient {
  return value !== null && 
    typeof value === 'object' &&
    'users' in value &&
    'tasks' in value;
}