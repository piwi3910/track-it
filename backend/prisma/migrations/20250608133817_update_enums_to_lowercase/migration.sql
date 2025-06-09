-- Step 1: Create new enum types with lowercase values
CREATE TYPE "UserRole_new" AS ENUM ('admin', 'member', 'guest');
CREATE TYPE "TaskStatus_new" AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done', 'archived');
CREATE TYPE "TaskPriority_new" AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE "NotificationType_new" AS ENUM ('task_assigned', 'task_updated', 'comment_added', 'due_date_reminder', 'mention', 'system');

-- Step 2: Remove default values temporarily
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "tasks" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "tasks" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "task_templates" ALTER COLUMN "priority" DROP DEFAULT;

-- Step 3: Update columns using CASE statements to map old values to new ones
ALTER TABLE "users" 
  ALTER COLUMN "role" TYPE "UserRole_new" 
  USING CASE "role"::text
    WHEN 'ADMIN' THEN 'admin'::"UserRole_new"
    WHEN 'MEMBER' THEN 'member'::"UserRole_new"
    WHEN 'GUEST' THEN 'guest'::"UserRole_new"
  END;

ALTER TABLE "tasks" 
  ALTER COLUMN "status" TYPE "TaskStatus_new" 
  USING CASE "status"::text
    WHEN 'BACKLOG' THEN 'backlog'::"TaskStatus_new"
    WHEN 'TODO' THEN 'todo'::"TaskStatus_new"
    WHEN 'IN_PROGRESS' THEN 'in_progress'::"TaskStatus_new"
    WHEN 'REVIEW' THEN 'review'::"TaskStatus_new"
    WHEN 'DONE' THEN 'done'::"TaskStatus_new"
    WHEN 'ARCHIVED' THEN 'archived'::"TaskStatus_new"
  END;

ALTER TABLE "tasks" 
  ALTER COLUMN "priority" TYPE "TaskPriority_new" 
  USING CASE "priority"::text
    WHEN 'LOW' THEN 'low'::"TaskPriority_new"
    WHEN 'MEDIUM' THEN 'medium'::"TaskPriority_new"
    WHEN 'HIGH' THEN 'high'::"TaskPriority_new"
    WHEN 'URGENT' THEN 'urgent'::"TaskPriority_new"
  END;

ALTER TABLE "task_templates" 
  ALTER COLUMN "priority" TYPE "TaskPriority_new" 
  USING CASE "priority"::text
    WHEN 'LOW' THEN 'low'::"TaskPriority_new"
    WHEN 'MEDIUM' THEN 'medium'::"TaskPriority_new"
    WHEN 'HIGH' THEN 'high'::"TaskPriority_new"
    WHEN 'URGENT' THEN 'urgent'::"TaskPriority_new"
  END;

ALTER TABLE "notifications" 
  ALTER COLUMN "type" TYPE "NotificationType_new" 
  USING CASE "type"::text
    WHEN 'TASK_ASSIGNED' THEN 'task_assigned'::"NotificationType_new"
    WHEN 'TASK_UPDATED' THEN 'task_updated'::"NotificationType_new"
    WHEN 'COMMENT_ADDED' THEN 'comment_added'::"NotificationType_new"
    WHEN 'DUE_DATE_REMINDER' THEN 'due_date_reminder'::"NotificationType_new"
    WHEN 'MENTION' THEN 'mention'::"NotificationType_new"
    WHEN 'SYSTEM' THEN 'system'::"NotificationType_new"
  END;

-- Step 4: Drop old enum types
DROP TYPE "UserRole";
DROP TYPE "TaskStatus";
DROP TYPE "TaskPriority";
DROP TYPE "NotificationType";

-- Step 5: Rename new enum types to original names
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
ALTER TYPE "TaskPriority_new" RENAME TO "TaskPriority";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";

-- Step 6: Re-add default values with new enum values
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'member'::"UserRole";
ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'todo'::"TaskStatus";
ALTER TABLE "tasks" ALTER COLUMN "priority" SET DEFAULT 'medium'::"TaskPriority";
ALTER TABLE "task_templates" ALTER COLUMN "priority" SET DEFAULT 'medium'::"TaskPriority";