/**
 * Type definitions for test clients
 * These types help avoid using 'any' in test files
 */

export type TestResponse<T = unknown> = Promise<T>;

export interface TestProcedure<TInput = unknown, TOutput = unknown> {
  query: (input?: TInput) => TestResponse<TOutput>;
  mutate: (input: TInput) => TestResponse<TOutput>;
}

export interface TestUserProcedures {
  ping: { query: () => TestResponse };
  login: { mutate: (input: { email: string; password: string }) => TestResponse };
  register: { mutate: (input: { name: string; email: string; password: string; passwordConfirm: string }) => TestResponse };
  getCurrentUser: { query: () => TestResponse };
  updateProfile: { mutate: (input: { name?: string; email?: string; avatarUrl?: string }) => TestResponse };
  getAllUsers: { query: () => TestResponse };
  getUserDeletionStats: { query: (input: { startDate?: string; endDate?: string }) => TestResponse };
  createUser: { mutate: (input: { name: string; email: string; password: string; role: string }) => TestResponse };
  updateUser: { mutate: (input: { userId: string; name?: string; email?: string; role?: string }) => TestResponse };
  deleteUser: { mutate: (input: { userId: string }) => TestResponse };
  resetUserPassword: { mutate: (input: { userId: string; newPassword: string }) => TestResponse };
  updateUserRole: { mutate: (input: { userId: string; role: string }) => TestResponse };
  loginWithGoogle: { mutate: (input: { idToken: string }) => TestResponse };
  verifyGoogleToken: { mutate: (input: { credential: string }) => TestResponse };
  updateUserPreferences: { mutate: (input: { theme?: string; defaultView?: string; notifications?: { email?: boolean; inApp?: boolean } }) => TestResponse };
}

export interface TestTaskProcedures {
  ping: { query: () => TestResponse };
  createTask: { mutate: (input: { title: string; description?: string; status?: string; priority?: string; assigneeId?: string; tags?: string[]; dueDate?: string; estimatedHours?: number }) => TestResponse };
  getTaskById: { query: (input: { id: string }) => TestResponse };
  updateTask: { mutate: (input: { id: string; data: { title?: string; description?: string; status?: string; priority?: string; assigneeId?: string; tags?: string[]; dueDate?: string | null; estimatedHours?: number | null } }) => TestResponse };
  deleteTask: { mutate: (input: { id: string }) => TestResponse };
  getMyTasks: { query: () => TestResponse };
  getAllTasks: { query: (input?: { status?: string; priority?: string; assigneeId?: string; tags?: string[]; search?: string; sortBy?: string; sortOrder?: string; limit?: number; offset?: number }) => TestResponse };
  getTasksByStatus: { query: (input: { status: string }) => TestResponse };
  getTasksByDateRange: { query: (input: { startDate: string; endDate: string }) => TestResponse };
  moveTask: { mutate: (input: { id: string; status: string; position?: number }) => TestResponse };
  assignTask: { mutate: (input: { id: string; assigneeId: string | null }) => TestResponse };
  searchTasks: { query: (input: { query: string; filters?: { status?: string; priority?: string; assigneeId?: string; tags?: string[] } }) => TestResponse };
  bulkUpdateTasks: { mutate: (input: { taskIds: string[]; updates: { status?: string; priority?: string; assigneeId?: string | null; tags?: string[] } }) => TestResponse };
  getDeletedTasks: { query: () => TestResponse };
  getDueSoonTasks: { query: () => TestResponse };
}

export interface TestCommentProcedures {
  createComment: { mutate: (input: { taskId: string; text: string; parentId?: string }) => TestResponse };
  getCommentsByTask: { query: (input: { taskId: string }) => TestResponse };
  updateComment: { mutate: (input: { id: string; text: string }) => TestResponse };
  deleteComment: { mutate: (input: { id: string }) => TestResponse };
  getCommentCount: { query: (input: { taskId: string }) => TestResponse };
}

export interface TestTemplateProcedures {
  createTemplate: { mutate: (input: { name: string; description?: string; templateData: unknown; category?: string; isPublic?: boolean; tags?: string[] }) => TestResponse };
  getTemplateById: { query: (input: { id: string }) => TestResponse };
  updateTemplate: { mutate: (input: { id: string; data: { name?: string; description?: string; templateData?: unknown; category?: string; isPublic?: boolean } }) => TestResponse };
  deleteTemplate: { mutate: (input: { id: string }) => TestResponse };
  getMyTemplates: { query: () => TestResponse };
  getPublicTemplates: { query: () => TestResponse };
  createTaskFromTemplate: { mutate: (input: { templateId: string; assigneeId?: string }) => TestResponse };
  duplicateTemplate: { mutate: (input: { id: string; name: string }) => TestResponse };
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