/**
 * Notifications router for the mock tRPC API
 */

import { router, query, mutation } from '../trpc';
import { db, delay } from '../db';

// Create the notifications router with all endpoints
export const notificationsRouter = router({
  // Get all notifications
  getAll: query()
    .query(async () => {
      await delay(300);
      return db.notifications.getAll();
    }),

  // Mark a notification as read
  markAsRead: mutation()
    .mutation(async ({ id }: { id: string }) => {
      await delay(200);
      db.notifications.markAsRead(id);
    })
});