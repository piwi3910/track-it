import { router } from './trpc';
import { tasksRouter } from '../routers/tasks.router';
import { usersRouter } from '../routers/users.router';
import { templatesRouter } from '../routers/templates.router';
import { commentsRouter } from '../routers/comments.router';
import { attachmentsRouter } from '../routers/attachments.router';
import { analyticsRouter } from '../routers/analytics.router';
import { googleIntegrationRouter } from '../routers/google-integration.router';
import { notificationsRouter } from '../routers/notifications.router';
import { cachedTasksRouter } from '../routers/cached-tasks.router';
import { cacheAdminRouter } from '../routers/cache-admin.router';

// Create the main app router with sub-routers
export const appRouter = router({
  tasks: tasksRouter,
  users: usersRouter,
  templates: templatesRouter,
  comments: commentsRouter,
  attachments: attachmentsRouter,
  analytics: analyticsRouter,
  googleIntegration: googleIntegrationRouter,
  notifications: notificationsRouter,

  // Cached versions of routers (will eventually replace the non-cached versions)
  cachedTasks: cachedTasksRouter,

  // Admin routes for cache management
  cacheAdmin: cacheAdminRouter,
});

// Export type definition of the API
export type AppRouter = typeof appRouter;