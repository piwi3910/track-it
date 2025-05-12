import { router } from './trpc';
import { tasksRouter } from '../routers/tasks.router';
import { usersRouter } from '../routers/users.router';
import { templatesRouter } from '../routers/templates.router';
import { commentsRouter } from '../routers/comments.router';
import { attachmentsRouter } from '../routers/attachments.router';
import { analyticsRouter } from '../routers/analytics.router';
import { googleIntegrationRouter } from '../routers/google-integration.router';
import { notificationsRouter } from '../routers/notifications.router';

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
});

// Export type definition of the API
export type AppRouter = typeof appRouter;