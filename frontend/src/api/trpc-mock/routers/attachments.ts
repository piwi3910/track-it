/**
 * Attachments router for the mock tRPC API
 */

import { router, query, mutation } from '../trpc';
import { db, delay } from '../db';
import {
  AttachmentsByTaskIdInput,
  AttachmentUploadInput,
  AttachmentDeleteInput
} from '../types';

// Create the attachments router with all endpoints
export const attachmentsRouter = router({
  // Get attachments by task ID
  getByTaskId: query()
    .query(async ({ taskId }: AttachmentsByTaskIdInput) => {
      await delay(300);
      return db.attachments.findByTaskId(taskId);
    }),

  // Upload a new attachment
  upload: mutation()
    .mutation(async ({ taskId, file }: AttachmentUploadInput) => {
      await delay(1000); // Longer delay to simulate upload
      return db.attachments.create(taskId, file);
    }),

  // Delete an attachment
  delete: mutation()
    .mutation(async ({ id }: AttachmentDeleteInput) => {
      await delay(400);
      db.attachments.delete(id);
    })
});