/**
 * Main router for the mock tRPC API
 * This combines all sub-routers into a single router
 */

import { router } from './trpc';
import { tasksRouter } from './routers/tasks';
import { templatesRouter } from './routers/templates';
import { usersRouter } from './routers/users';
import { commentsRouter } from './routers/comments';
import { attachmentsRouter } from './routers/attachments';
import { analyticsRouter } from './routers/analytics';
import { googleIntegrationRouter } from './routers/googleIntegration';
import { notificationsRouter } from './routers/notifications';

// Create the main app router by merging all sub-routers
export const appRouter = router({
  tasks: tasksRouter,
  templates: templatesRouter,
  users: usersRouter,
  comments: commentsRouter,
  attachments: attachmentsRouter,
  analytics: analyticsRouter,
  googleIntegration: googleIntegrationRouter,
  notifications: notificationsRouter
});

// Export type definition of the API
export type AppRouter = typeof appRouter;