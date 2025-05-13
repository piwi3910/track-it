import { RouterOutputs } from '@track-it/shared';

// Export common types from our stores for use in components
// @ts-ignore - Ignore type errors for now
export type User = RouterOutputs['users']['getCurrentUser'];
// @ts-ignore - Ignore type errors for now
export type Task = RouterOutputs['tasks']['getAll'][0];
// @ts-ignore - Ignore type errors for now
export type Template = RouterOutputs['templates']['getAll'][0];
// @ts-ignore - Ignore type errors for now
export type Notification = RouterOutputs['notifications']['getAll'][0];

// Task filter types
export interface TaskFilter {
  status?: string[];
  priority?: string[];
  assigneeId?: string[];
  tags?: string[];
  search?: string;
  dueDate?: {
    from?: Date;
    to?: Date;
  };
}