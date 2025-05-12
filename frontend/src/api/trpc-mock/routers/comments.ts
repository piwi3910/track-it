/**
 * Comments router for the mock tRPC API
 */

import { router, query, mutation } from '../trpc';
import { db, delay } from '../db';
import {
  CommentsByTaskIdInput,
  CommentCountByTaskIdInput,
  CommentCreateInput,
  CommentUpdateInput,
  CommentDeleteInput
} from '../types';

// Create the comments router with all endpoints
export const commentsRouter = router({
  // Get comments by task ID
  getByTaskId: query()
    .query(async ({ taskId }: CommentsByTaskIdInput) => {
      await delay(300);
      return db.comments.findByTaskId(taskId);
    }),

  // Get comment count by task ID
  getCommentCount: query()
    .query(async ({ taskId }: CommentCountByTaskIdInput) => {
      await delay(100);
      return db.comments.countByTaskId(taskId);
    }),

  // Create a new comment
  create: mutation()
    .mutation(async (input: CommentCreateInput) => {
      await delay(400);
      return db.comments.create({
        taskId: input.taskId,
        authorId: input.authorId,
        text: input.text,
        createdAt: new Date().toISOString()
      });
    }),

  // Update an existing comment
  update: mutation()
    .mutation(async ({ id, text }: CommentUpdateInput) => {
      await delay(300);
      return db.comments.update(id, text);
    }),

  // Delete a comment
  delete: mutation()
    .mutation(async ({ id }: CommentDeleteInput) => {
      await delay(300);
      db.comments.delete(id);
    })
});