# Task Schema Documentation

This document defines the complete task schema for the Track-It application, ensuring consistency between frontend, backend, and database implementations.

## Core Task Interface

```typescript
interface Task {
  // === CORE IDENTIFICATION ===
  id: string;                          // UUID primary key (required)
  taskNumber: number;                  // Auto-increment display number (auto-generated)
  
  // === BASIC PROPERTIES ===
  title: string;                       // Task title (required, min length: 1)
  description?: string;                // Task description (optional, markdown supported)
  status: TaskStatus;                  // Task status (required, enum)
  priority: TaskPriority;              // Task priority (required, enum) 
  weight?: number;                     // Task weight 0-10 (optional, for estimation)
  tags?: string[];                     // Array of tag strings (optional)
  
  // === DATE MANAGEMENT ===
  dueDate?: string | null;             // Due date as ISO string (optional)
  startDate?: string | null;           // Start date for multi-day tasks (optional)
  endDate?: string | null;             // End date for multi-day tasks (optional)
  isMultiDay?: boolean;                // Flag indicating multi-day task (optional)
  createdAt?: string;                  // Creation timestamp (auto-generated)
  updatedAt?: string;                  // Last update timestamp (auto-generated)
  
  // === USER RELATIONSHIPS ===
  assigneeId?: string | null;          // UUID of assigned user (optional)
  reporterId?: string | null;          // UUID of reporting user (optional, future)
  creatorId: string;                   // UUID of creator (required, set on creation)
  
  // === TIME TRACKING ===
  estimatedHours?: number | null;      // Estimated hours for completion (optional)
  actualHours?: number | null;         // Actual hours spent (optional)
  timeTrackingActive?: boolean;        // Currently tracking time flag (default: false)
  trackingTimeSeconds?: number;        // Current tracking session seconds (default: 0)
  trackingStartTime?: string | null;   // When current tracking started (optional)
  lastTrackedTimestamp?: string;       // Last tracking session end (optional, future)
  lastSavedTimestamp?: string;         // Last save timestamp (optional, future)
  
  // === TASK HIERARCHY ===
  subtasks?: Subtask[];                // Array of subtask objects (optional)
  parentTaskId?: string | null;        // Parent task UUID for hierarchies (optional)
  childTaskIds?: string[];             // Array of child task UUIDs (optional, computed)
  isSubtask?: boolean;                 // Flag if this appears as separate task (optional)
  
  // === METADATA ===
  source?: 'app' | 'google' | 'import'; // Task origin (optional, default: 'app')
  archived?: boolean;                  // Archived status (default: false)
  savedAsTemplate?: boolean;           // Template save status (default: false)
  
  // === RECURRENCE (Future) ===
  recurrence?: TaskRecurrence | null;  // Recurrence configuration (optional)
  isRecurrenceInstance?: boolean;      // Instance of recurring task (optional)
  originalTaskId?: string;             // Original recurring task UUID (optional)
}
```

## Supporting Types

### TaskStatus Enum
```typescript
type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'archived';
```
**Database Mapping**: `BACKLOG | TODO | IN_PROGRESS | REVIEW | DONE | ARCHIVED`

### TaskPriority Enum  
```typescript
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
```
**Database Mapping**: `LOW | MEDIUM | HIGH | URGENT`

### Subtask Interface
```typescript
interface Subtask {
  id: string;                          // Unique identifier (UUID or temp ID)
  title: string;                       // Subtask description (required)
  completed: boolean;                  // Completion status (required)
}
```

### TaskRecurrence Interface (Future Implementation)
```typescript
interface TaskRecurrence {
  pattern: RecurrencePattern;          // How often to repeat (required)
  interval?: number;                   // Every X periods (default: 1)
  endDate?: string | null;            // When to stop recurring (optional)
  daysOfWeek?: number[];              // For weekly: 0 (Sun) to 6 (Sat)
  dayOfMonth?: number;                // For monthly (1-31)
  monthOfYear?: number;               // For yearly (1-12)
}

type RecurrencePattern = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
```

## Database Schema (Prisma)

### Current Implementation
The database implements the core task fields with these key characteristics:

- **Primary Key**: `id` (UUID)
- **Display Number**: `taskNumber` (auto-increment)
- **Required Fields**: `title`, `status`, `priority`, `creatorId`
- **Timestamps**: `createdAt`, `updatedAt` (auto-managed)
- **Time Tracking**: `timeTrackingActive`, `trackingStartTime`, `trackingTimeSeconds`
- **Hierarchy**: `parentId` → `subtasks` relation
- **Tags**: `String[]` array field

### Missing Database Fields
The following frontend fields need database implementation:
- `startDate`, `endDate`, `isMultiDay` (multi-day task support)
- `weight` (task estimation)
- `reporterId` (reporting user)
- `source` (task origin tracking)
- `lastTrackedTimestamp`, `lastSavedTimestamp` (enhanced time tracking)
- `isSubtask` (hierarchy flag)
- Full recurrence support

## API Data Flow

### Frontend → Backend Mapping
1. **Enum Case Transformation**: Frontend lowercase → Backend UPPERCASE
2. **Subtask Handling**: Frontend array → Backend relation or JSON
3. **Date Format**: ISO strings maintained throughout
4. **Null Handling**: Frontend `null` values preserved

### Update Request Format
```typescript
// tRPC API expects:
{
  id: string,           // Task UUID
  data: Partial<Task>   // Only fields being updated
}
```

### Response Format
```typescript
// Backend returns normalized task:
{
  id: string,
  taskNumber: number,
  title: string,
  // ... all fields with frontend-compatible formats
  status: 'in_progress',  // Lowercase
  priority: 'high',       // Lowercase
  createdAt: '2024-01-01T00:00:00.000Z',  // ISO string
  // ...
}
```

## Validation Rules

### Required Fields (Creation)
- `title` (min length: 1)
- `priority` (enum value)
- `status` (defaults to 'todo')

### Optional Fields
- All other fields are optional
- Null values are explicitly allowed for: `dueDate`, `startDate`, `endDate`, `assigneeId`, `estimatedHours`, `actualHours`, `recurrence`

### Field Constraints
- `estimatedHours`, `actualHours`: Positive numbers or null
- `weight`: 0-10 integer or null
- `tags`: Array of non-empty strings
- `subtasks`: Array of valid Subtask objects
- Date fields: ISO 8601 strings or null

## Implementation Status

### ✅ Completed
- Core CRUD operations
- Basic task properties
- Time tracking foundation
- Enum transformations
- Subtask display (read-only)

### 🔄 In Progress  
- Subtask editing
- Multi-day task support
- Enhanced time tracking

### 📋 Planned
- Full recurrence system
- Task hierarchy management
- Advanced time tracking history
- Task templates integration
- Google Calendar sync

## Frontend Usage Patterns

### TaskModal
- Full task editing interface
- Handles all implemented fields
- Multi-day task toggles
- Subtask management
- Time tracking controls

### TaskCard
- Inline editing for title, priority
- Time tracking display/controls
- Subtask progress indicators
- Comment integration

### QuickAddTask
- Rapid task creation
- Essential fields only
- Smart defaults

## Backend API Compliance

The backend API ensures:
1. **Type Safety**: Zod validation matches TypeScript interfaces
2. **Data Integrity**: Database constraints prevent invalid states  
3. **Consistent Formatting**: Response normalization for frontend consumption
4. **Error Handling**: Descriptive validation and database errors
5. **Performance**: Optimized queries with proper includes/selects

---

*Last Updated: 2024-01-22*
*Schema Version: 1.0*