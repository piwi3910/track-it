import { router } from './trpc';
import { usersRouter } from '../routers/users.router';
import { tasksRouter } from '../routers/tasks.router';
import { templatesRouter } from '../routers/templates.router';
import { commentsRouter } from '../routers/comments.router';
import { notificationsRouter } from '../routers/notifications.router';
import { attachmentsRouter } from '../routers/attachments.router';
import { analyticsRouter } from '../routers/analytics.router';
import { googleIntegrationRouter } from '../routers/google-integration.router';
// These routers will be implemented later as needed
// import { cachedTasksRouter } from '../routers/cached-tasks.router';
// import { cacheAdminRouter } from '../routers/cache-admin.router';

export const appRouter = router({
  users: usersRouter,
  tasks: tasksRouter,
  templates: templatesRouter,
  comments: commentsRouter,
  notifications: notificationsRouter,
  attachments: attachmentsRouter,
  analytics: analyticsRouter,
  googleIntegration: googleIntegrationRouter,
  // These will be implemented later as needed
  // cachedTasks: cachedTasksRouter,
  // cacheAdmin: cacheAdminRouter,
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;