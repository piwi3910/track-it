import type { RouterOutputs } from '@track-it/shared';

// Export common types from our stores for use in components
export type User = RouterOutputs['users']['getCurrentUser'];
export type Task = RouterOutputs['tasks']['getAll'][0];
export type Template = RouterOutputs['templates']['getAll'][0];
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