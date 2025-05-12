/**
 * Google integration router for the mock tRPC API
 */

import { router, query, mutation } from '../trpc';
import { db, delay } from '../db';

// Create the Google integration router with all endpoints
export const googleIntegrationRouter = router({
  // Sync Google Calendar
  syncCalendar: mutation()
    .mutation(async () => {
      await delay(1000);
      return true; // Mock successful sync
    }),

  // Import tasks from Google Tasks
  importGoogleTasks: query()
    .query(async () => {
      await delay(1200);
      return db.googleIntegration.importGoogleTasks();
    }),

  // Get files from Google Drive
  getGoogleDriveFiles: query()
    .query(async () => {
      await delay(800);
      return db.googleIntegration.getGoogleDriveFiles();
    })
});