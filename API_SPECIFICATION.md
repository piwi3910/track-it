# Track-It API Specification v2.0

This document defines the complete API specification for the Track-It application, detailing all endpoints, request/response formats, and authentication requirements.

## Base URL

- Development: `http://localhost:3001/trpc`
- Production: TBD

## Authentication

The API uses JWT (JSON Web Token) for authentication.

- Tokens should be included in the `Authorization` header as `Bearer {token}`
- All endpoints except public ones (login, register, health checks) require authentication
- JWT tokens expire after 7 days (configurable)
- Tokens include user ID and role information for authorization

## Error Handling

All errors follow a consistent tRPC format:

```json
{
  "error": {
    "message": "Error message describing what went wrong",
    "code": "TRPC_ERROR_CODE",
    "data": {
      "code": "APP_ERROR_CODE",
      "httpStatus": 400
    }
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Authentication required or failed
- `FORBIDDEN`: User doesn't have permission
- `NOT_FOUND`: Requested resource doesn't exist
- `BAD_REQUEST`: Invalid input data (validation errors)
- `INTERNAL_SERVER_ERROR`: Server encountered an error

## API Endpoints

### Health Check

#### GET /health (Non-tRPC)

Used to check if the API is running.

**Authentication:** Public

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-20T12:34:56.789Z",
  "api": "track-it-backend",
  "version": "1.0.0"
}
```

---

## Users Router (`/trpc/users.*`)

### Public Endpoints

#### users.ping (Query)

Health check for tRPC endpoints.

**Authentication:** Public

**Response:**
```json
"pong"
```

#### users.login (Mutation)

Log in a user with email and password.

**Authentication:** Public

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "id": "user1",
  "name": "John Doe",
  "email": "user@example.com",
  "role": "admin",
  "token": "jwt-token-string"
}
```

#### users.loginWithGoogle (Mutation)

Log in a user with Google OAuth ID token.

**Authentication:** Public

**Request:**
```json
{
  "idToken": "google-id-token-string"
}
```

**Response:**
```json
{
  "id": "user1",
  "name": "John Doe",
  "email": "user@example.com",
  "role": "member",
  "token": "jwt-token-string",
  "googleConnected": true
}
```

#### users.verifyGoogleToken (Mutation)

Verify Google ID token and check if user exists.

**Authentication:** Public

**Request:**
```json
{
  "credential": "google-credential-string"
}
```

**Response:**
```json
{
  "valid": true,
  "email": "user@gmail.com",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/...",
  "userExists": true
}
```

#### users.register (Mutation)

Register a new user.

**Authentication:** Public

**Request:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "passwordConfirm": "password123"
}
```

**Response:**
```json
{
  "id": "user1",
  "name": "John Doe",
  "email": "user@example.com"
}
```

### Protected Endpoints

#### users.getCurrentUser (Query)

Get the currently logged-in user's profile.

**Authentication:** Required

**Response:**
```json
{
  "id": "user1",
  "name": "John Doe",
  "email": "user@example.com",
  "role": "admin",
  "avatarUrl": "https://example.com/avatar.jpg",
  "preferences": {
    "theme": "dark",
    "defaultView": "kanban",
    "notifications": {
      "email": true,
      "inApp": true
    }
  },
  "googleConnected": true,
  "googleEmail": "user@gmail.com",
  "googleProfile": {
    "name": "John Doe",
    "picture": "https://lh3.googleusercontent.com/..."
  },
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-20T12:34:56.789Z",
  "lastLogin": "2025-01-20T12:00:00.000Z"
}
```

#### users.updateProfile (Mutation)

Update the user's profile.

**Authentication:** Required

**Request:**
```json
{
  "name": "New Name",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "preferences": {
    "theme": "dark",
    "defaultView": "kanban",
    "notifications": {
      "email": false,
      "inApp": true
    }
  }
}
```

**Response:**
```json
{
  "id": "user1",
  "name": "New Name",
  "email": "user@example.com",
  "role": "admin",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "preferences": {
    "theme": "dark",
    "defaultView": "kanban",
    "notifications": {
      "email": false,
      "inApp": true
    }
  },
  "googleConnected": true,
  "googleEmail": "user@gmail.com"
}
```

#### users.disconnectGoogleAccount (Mutation)

Disconnect user's Google account.

**Authentication:** Required

**Response:**
```json
{
  "success": true
}
```

#### users.updateGoogleIntegration (Mutation)

Update Google integration settings.

**Authentication:** Required

**Request:**
```json
{
  "googleRefreshToken": "refresh-token-string",
  "googleEnabled": true
}
```

**Response:**
```json
{
  "success": true
}
```

### Admin Endpoints

#### users.getAllUsers (Query)

Get all users (admin only).

**Authentication:** Admin required

**Response:**
```json
[
  {
    "id": "user1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "avatarUrl": "https://example.com/avatar1.jpg",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "lastLogin": "2025-01-20T12:00:00.000Z"
  },
  {
    "id": "user2",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "member",
    "avatarUrl": "https://example.com/avatar2.jpg",
    "createdAt": "2025-01-16T14:20:00.000Z",
    "lastLogin": "2025-01-19T16:45:00.000Z"
  }
]
```

#### users.updateUserRole (Mutation)

Update a user's role (admin only).

**Authentication:** Admin required

**Request:**
```json
{
  "userId": "user2",
  "role": "admin"
}
```

**Response:**
```json
{
  "id": "user2",
  "name": "Jane Smith",
  "role": "admin"
}
```

---

## Tasks Router (`/trpc/tasks.*`)

All task endpoints require authentication.

#### tasks.getAll (Query)

Get all tasks for the current user.

**Authentication:** Required

**Response:**
```json
[
  {
    "id": "task1",
    "taskNumber": "TASK-1",
    "title": "Complete API Implementation",
    "description": "Implement all API endpoints and test with Postman",
    "status": "in_progress",
    "priority": "high",
    "tags": ["backend", "api"],
    "dueDate": "2025-01-27T00:00:00.000Z",
    "createdAt": "2025-01-10T00:00:00.000Z",
    "updatedAt": "2025-01-20T00:00:00.000Z",
    "createdById": "user1",
    "assigneeId": "user1",
    "estimatedHours": 8,
    "actualHours": 4,
    "timeTrackingActive": false,
    "trackingTimeSeconds": 0,
    "subtasks": [
      { "id": "subtask1", "title": "Define API routes", "completed": true },
      { "id": "subtask2", "title": "Implement auth endpoints", "completed": true },
      { "id": "subtask3", "title": "Implement task endpoints", "completed": false },
      { "id": "subtask4", "title": "Write tests", "completed": false }
    ],
    "parentTaskId": null,
    "commentCount": 3
  }
]
```

#### tasks.getById (Query)

Get a specific task by ID.

**Authentication:** Required

**Request:**
```json
{
  "id": "task1"
}
```

**Response:** Same as individual task object above.

#### tasks.getByStatus (Query)

Get tasks filtered by status.

**Authentication:** Required

**Request:**
```json
{
  "status": "in_progress"
}
```

**Response:** Array of task objects filtered by status.

#### tasks.create (Mutation)

Create a new task.

**Authentication:** Required

**Request:**
```json
{
  "title": "Implement Task Filtering",
  "description": "Add ability to filter tasks by multiple criteria",
  "status": "todo",
  "priority": "medium",
  "tags": ["frontend", "feature"],
  "dueDate": "2025-02-10T00:00:00.000Z",
  "assigneeId": "user1",
  "estimatedHours": 4,
  "subtasks": [
    { "title": "Design filter UI", "completed": false },
    { "title": "Implement filter logic", "completed": false }
  ]
}
```

**Response:**
```json
{
  "id": "task4",
  "taskNumber": "TASK-4",
  "title": "Implement Task Filtering",
  "description": "Add ability to filter tasks by multiple criteria",
  "status": "todo",
  "priority": "medium",
  "tags": ["frontend", "feature"],
  "dueDate": "2025-02-10T00:00:00.000Z",
  "createdAt": "2025-01-20T12:34:56.789Z",
  "updatedAt": "2025-01-20T12:34:56.789Z",
  "createdById": "user1",
  "assigneeId": "user1",
  "estimatedHours": 4,
  "actualHours": 0,
  "timeTrackingActive": false,
  "trackingTimeSeconds": 0,
  "subtasks": [
    { "id": "subtask5", "title": "Design filter UI", "completed": false },
    { "id": "subtask6", "title": "Implement filter logic", "completed": false }
  ]
}
```

#### tasks.update (Mutation)

Update an existing task.

**Authentication:** Required

**Request:**
```json
{
  "id": "task1",
  "data": {
    "status": "done",
    "actualHours": 8,
    "subtasks": [
      { "id": "subtask1", "title": "Define API routes", "completed": true },
      { "id": "subtask2", "title": "Implement auth endpoints", "completed": true },
      { "id": "subtask3", "title": "Implement task endpoints", "completed": true },
      { "id": "subtask4", "title": "Write tests", "completed": true }
    ]
  }
}
```

**Response:** Updated task object.

#### tasks.delete (Mutation)

Delete a task.

**Authentication:** Required

**Request:**
```json
{
  "id": "task1"
}
```

**Response:**
```json
{
  "id": "task1",
  "deleted": true
}
```

#### tasks.search (Query)

Search for tasks.

**Authentication:** Required

**Request:**
```json
{
  "query": "api"
}
```

**Response:** Array of matching task objects.

#### tasks.saveAsTemplate (Mutation)

Save a task as a template.

**Authentication:** Required

**Request:**
```json
{
  "taskId": "task1",
  "templateName": "API Implementation Template",
  "isPublic": true
}
```

**Response:**
```json
{
  "id": "template1",
  "name": "API Implementation Template",
  "taskId": "task1"
}
```

#### tasks.createFromTemplate (Mutation)

Create a task from a template.

**Authentication:** Required

**Request:**
```json
{
  "templateId": "template1",
  "taskData": {
    "title": "New API Project",
    "dueDate": "2025-02-15T00:00:00.000Z",
    "assigneeId": "user2"
  }
}
```

**Response:** Complete task object created from template.

---

## Templates Router (`/trpc/templates.*`)

All template endpoints require authentication.

#### templates.getAll (Query)

Get all templates accessible to the user.

**Authentication:** Required

**Response:**
```json
[
  {
    "id": "template1",
    "name": "API Implementation Template",
    "description": "Implement all API endpoints and test with Postman",
    "priority": "high",
    "tags": ["backend", "api"],
    "estimatedHours": 8,
    "subtasks": [
      { "id": "subtask1", "title": "Define API routes", "completed": false },
      { "id": "subtask2", "title": "Implement auth endpoints", "completed": false },
      { "id": "subtask3", "title": "Implement task endpoints", "completed": false },
      { "id": "subtask4", "title": "Write tests", "completed": false }
    ],
    "category": "backend",
    "createdAt": "2025-01-20T12:34:56.789Z",
    "createdById": "user1",
    "isPublic": true,
    "usageCount": 5
  }
]
```

#### templates.getById (Query)

Get a specific template by ID.

**Authentication:** Required

**Request:**
```json
{
  "id": "template1"
}
```

**Response:** Template object as shown above.

#### templates.getByCategory (Query)

Get templates filtered by category.

**Authentication:** Required

**Request:**
```json
{
  "category": "backend"
}
```

**Response:** Array of template objects in the specified category.

#### templates.getCategories (Query)

Get all template categories.

**Authentication:** Required

**Response:**
```json
["backend", "frontend", "design", "testing", "bug-fix", "feature"]
```

#### templates.create (Mutation)

Create a new template.

**Authentication:** Required

**Request:**
```json
{
  "name": "Bug Fix Template",
  "description": "Standard template for bug fixes",
  "priority": "high",
  "tags": ["bug"],
  "estimatedHours": 2,
  "subtasks": [
    { "title": "Reproduce bug", "completed": false },
    { "title": "Fix issue", "completed": false },
    { "title": "Write tests", "completed": false },
    { "title": "Document fix", "completed": false }
  ],
  "category": "bug-fix",
  "isPublic": true
}
```

**Response:** Complete template object.

#### templates.update (Mutation)

Update an existing template.

**Authentication:** Required (owner or admin)

**Request:**
```json
{
  "id": "template1",
  "data": {
    "name": "Updated API Template",
    "isPublic": false
  }
}
```

**Response:** Updated template object.

#### templates.delete (Mutation)

Delete a template.

**Authentication:** Required (owner or admin)

**Request:**
```json
{
  "id": "template1"
}
```

**Response:**
```json
{
  "success": true
}
```

#### templates.search (Query)

Search for templates.

**Authentication:** Required

**Request:**
```json
{
  "query": "api"
}
```

**Response:** Array of matching template objects.

---

## Comments Router (`/trpc/comments.*`)

All comment endpoints require authentication.

#### comments.getByTaskId (Query)

Get all comments for a task.

**Authentication:** Required

**Request:**
```json
{
  "taskId": "task1"
}
```

**Response:**
```json
[
  {
    "id": "comment1",
    "taskId": "task1",
    "authorId": "user1",
    "text": "I've started working on this. @user2 let me know if you have any feedback.",
    "createdAt": "2025-01-15T12:34:56.789Z",
    "updatedAt": "2025-01-15T12:34:56.789Z",
    "parentId": null,
    "author": {
      "id": "user1",
      "name": "John Doe",
      "avatarUrl": "https://example.com/avatar1.jpg"
    },
    "mentions": ["user2"],
    "replies": [
      {
        "id": "comment2",
        "taskId": "task1",
        "parentId": "comment1",
        "authorId": "user2",
        "text": "Looks good! Let me know if you need help.",
        "createdAt": "2025-01-16T09:12:34.567Z",
        "author": {
          "id": "user2",
          "name": "Jane Smith",
          "avatarUrl": "https://example.com/avatar2.jpg"
        }
      }
    ]
  }
]
```

#### comments.getCommentCount (Query)

Get the comment count for a task.

**Authentication:** Required

**Request:**
```json
{
  "taskId": "task1"
}
```

**Response:**
```json
3
```

#### comments.create (Mutation)

Create a new comment.

**Authentication:** Required

**Request:**
```json
{
  "taskId": "task1",
  "text": "I've completed the first subtask. @user2 ready for review."
}
```

**Response:**
```json
{
  "id": "comment3",
  "taskId": "task1",
  "authorId": "user1",
  "text": "I've completed the first subtask. @user2 ready for review.",
  "createdAt": "2025-01-20T12:34:56.789Z",
  "mentions": ["user2"]
}
```

#### comments.update (Mutation)

Update an existing comment.

**Authentication:** Required (author only)

**Request:**
```json
{
  "id": "comment3",
  "text": "I've completed the first and second subtasks. @user2 ready for review."
}
```

**Response:** Updated comment object.

#### comments.delete (Mutation)

Delete a comment.

**Authentication:** Required (author or admin)

**Request:**
```json
{
  "id": "comment3"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Notifications Router (`/trpc/notifications.*`)

All notification endpoints require authentication.

#### notifications.getAll (Query)

Get all notifications for the current user.

**Authentication:** Required

**Response:**
```json
[
  {
    "id": "notification1",
    "userId": "user1",
    "type": "assignment",
    "message": "You have been assigned to task 'Fix Login Issues'",
    "relatedTaskId": "task3",
    "createdAt": "2025-01-19T12:34:56.789Z",
    "read": false
  },
  {
    "id": "notification2",
    "userId": "user1",
    "type": "mention",
    "message": "user2 mentioned you in a comment",
    "relatedTaskId": "task1",
    "relatedCommentId": "comment2",
    "createdAt": "2025-01-16T09:12:34.567Z",
    "read": true
  },
  {
    "id": "notification3",
    "userId": "user1",
    "type": "due_soon",
    "message": "Task 'Complete API Implementation' is due tomorrow",
    "relatedTaskId": "task1",
    "createdAt": "2025-01-19T08:00:00.000Z",
    "read": false
  },
  {
    "id": "notification4",
    "userId": "user1",
    "type": "status_change",
    "message": "Task 'Fix Login Issues' status changed to 'done'",
    "relatedTaskId": "task3",
    "createdAt": "2025-01-18T16:45:12.345Z",
    "read": true
  }
]
```

#### notifications.getUnreadCount (Query)

Get the count of unread notifications.

**Authentication:** Required

**Response:**
```json
2
```

#### notifications.markAsRead (Mutation)

Mark a notification as read.

**Authentication:** Required

**Request:**
```json
{
  "id": "notification1"
}
```

**Response:**
```json
{
  "success": true
}
```

#### notifications.markAllAsRead (Mutation)

Mark all notifications as read.

**Authentication:** Required

**Response:**
```json
{
  "success": true
}
```

---

## Attachments Router (`/trpc/attachments.*`)

All attachment endpoints require authentication.

#### attachments.getByTaskId (Query)

Get all attachments for a task.

**Authentication:** Required

**Request:**
```json
{
  "taskId": "task1"
}
```

**Response:**
```json
[
  {
    "id": "attachment1",
    "taskId": "task1",
    "name": "api-design.pdf",
    "fileType": "application/pdf",
    "size": 2048576,
    "url": "https://example.com/files/api-design.pdf",
    "createdAt": "2025-01-15T12:34:56.789Z",
    "thumbnailUrl": "https://example.com/thumbnails/api-design.jpg",
    "uploadedById": "user1"
  }
]
```

#### attachments.upload (Mutation)

Upload an attachment to a task.

**Authentication:** Required

**Request:**
```json
{
  "taskId": "task1",
  "file": {
    "name": "requirements.docx",
    "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "size": 1024000
  }
}
```

**Response:**
```json
{
  "id": "attachment2",
  "taskId": "task1",
  "name": "requirements.docx",
  "fileType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "size": 1024000,
  "url": "https://example.com/files/requirements.docx",
  "createdAt": "2025-01-20T12:34:56.789Z",
  "uploadedById": "user1"
}
```

#### attachments.delete (Mutation)

Delete an attachment.

**Authentication:** Required (uploader or admin)

**Request:**
```json
{
  "id": "attachment2"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Analytics Router (`/trpc/analytics.*`)

All analytics endpoints require authentication.

#### analytics.getTasksCompletionStats (Query)

Get task completion statistics.

**Authentication:** Required

**Request:**
```json
{
  "timeframe": "week"
}
```

**Response:**
```json
[
  { "date": "2025-01-14", "completed": 3 },
  { "date": "2025-01-15", "completed": 5 },
  { "date": "2025-01-16", "completed": 2 },
  { "date": "2025-01-17", "completed": 0 },
  { "date": "2025-01-18", "completed": 1 },
  { "date": "2025-01-19", "completed": 4 },
  { "date": "2025-01-20", "completed": 2 }
]
```

#### analytics.getUserWorkload (Query)

Get workload by user.

**Authentication:** Required

**Response:**
```json
[
  { "userId": "user1", "name": "John Doe", "taskCount": 7, "hoursEstimated": 32 },
  { "userId": "user2", "name": "Jane Smith", "taskCount": 5, "hoursEstimated": 20 },
  { "userId": "user3", "name": "Bob Wilson", "taskCount": 3, "hoursEstimated": 12 }
]
```

#### analytics.getTasksByPriority (Query)

Get task counts by priority.

**Authentication:** Required

**Response:**
```json
[
  { "priority": "low", "count": 4 },
  { "priority": "medium", "count": 6 },
  { "priority": "high", "count": 3 },
  { "priority": "urgent", "count": 2 }
]
```

#### analytics.getCompletionTimeByPriority (Query)

Get average completion time by priority.

**Authentication:** Required

**Response:**
```json
[
  { "priority": "low", "avgHours": 2.5 },
  { "priority": "medium", "avgHours": 4.2 },
  { "priority": "high", "avgHours": 6.8 },
  { "priority": "urgent", "avgHours": 1.5 }
]
```

---

## Google Integration Router (`/trpc/googleIntegration.*`)

All Google integration endpoints require authentication.

#### googleIntegration.getGoogleAccountStatus (Query)

Get Google account connection status.

**Authentication:** Required

**Response:**
```json
{
  "connected": true,
  "email": "user@gmail.com",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/...",
  "calendarEnabled": true,
  "driveEnabled": true
}
```

#### googleIntegration.getConnectionStatus (Query)

Get detailed connection status.

**Authentication:** Required

**Response:**
```json
{
  "googleConnected": true,
  "calendarSyncEnabled": true,
  "lastSync": "2025-01-20T10:30:00.000Z",
  "permissions": ["calendar", "drive.readonly"]
}
```

#### googleIntegration.getCalendarEvents (Query)

Get Google Calendar events.

**Authentication:** Required

**Response:**
```json
[
  {
    "id": "event1",
    "summary": "Project Meeting",
    "description": "Weekly project sync",
    "location": "Conference Room A",
    "start": "2025-01-21T14:00:00.000Z",
    "end": "2025-01-21T15:00:00.000Z",
    "attendees": ["user@example.com", "colleague@example.com"]
  }
]
```

#### googleIntegration.createCalendarEvent (Mutation)

Create a Google Calendar event.

**Authentication:** Required

**Request:**
```json
{
  "summary": "Task Review Meeting",
  "description": "Review completed tasks and plan next sprint",
  "location": "Zoom",
  "start": "2025-01-22T10:00:00.000Z",
  "end": "2025-01-22T11:00:00.000Z",
  "attendees": ["user@example.com", "manager@example.com"]
}
```

**Response:**
```json
{
  "id": "event2",
  "summary": "Task Review Meeting",
  "description": "Review completed tasks and plan next sprint",
  "location": "Zoom",
  "start": "2025-01-22T10:00:00.000Z",
  "end": "2025-01-22T11:00:00.000Z",
  "attendees": ["user@example.com", "manager@example.com"],
  "createdAt": "2025-01-20T12:34:56.789Z"
}
```

#### googleIntegration.updateCalendarEvent (Mutation)

Update a Google Calendar event.

**Authentication:** Required

**Request:**
```json
{
  "eventId": "event2",
  "data": {
    "summary": "Updated Task Review Meeting",
    "start": "2025-01-22T10:30:00.000Z",
    "end": "2025-01-22T11:30:00.000Z"
  }
}
```

**Response:** Updated event object.

#### googleIntegration.deleteCalendarEvent (Mutation)

Delete a Google Calendar event.

**Authentication:** Required

**Request:**
```json
{
  "eventId": "event2"
}
```

**Response:**
```json
{
  "success": true
}
```

#### googleIntegration.syncCalendar (Mutation)

Sync tasks with Google Calendar.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "eventsCreated": 3,
  "eventsUpdated": 1,
  "lastSync": "2025-01-20T12:34:56.789Z"
}
```

#### googleIntegration.importGoogleTasks (Query)

Import tasks from Google Tasks.

**Authentication:** Required

**Response:**
```json
[
  {
    "id": "google-task-1",
    "title": "Review presentation",
    "description": "Review marketing presentation",
    "status": "needsAction",
    "due": "2025-01-25T00:00:00.000Z",
    "updated": "2025-01-20T12:34:56.789Z"
  }
]
```

#### googleIntegration.importGoogleTaskAsTask (Mutation)

Import a specific Google Task as a Track-It task.

**Authentication:** Required

**Request:**
```json
{
  "googleTaskId": "google-task-1"
}
```

**Response:**
```json
{
  "id": "task6",
  "taskNumber": "TASK-6",
  "title": "Review presentation",
  "description": "Review marketing presentation",
  "status": "todo",
  "priority": "medium",
  "dueDate": "2025-01-25T00:00:00.000Z",
  "createdAt": "2025-01-20T12:34:56.789Z",
  "updatedAt": "2025-01-20T12:34:56.789Z",
  "createdById": "user1",
  "assigneeId": "user1",
  "source": "google"
}
```

#### googleIntegration.getGoogleDriveFiles (Query)

Get Google Drive files.

**Authentication:** Required

**Response:**
```json
[
  {
    "id": "file1",
    "name": "Project Plan.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "webViewLink": "https://drive.google.com/file/d/abc123/view",
    "thumbnailLink": "https://drive.google.com/thumbnail?id=abc123",
    "size": 1048576,
    "modifiedTime": "2025-01-19T14:30:00.000Z"
  },
  {
    "id": "file2",
    "name": "Budget.xlsx",
    "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "webViewLink": "https://drive.google.com/file/d/def456/view",
    "size": 524288,
    "modifiedTime": "2025-01-18T16:45:00.000Z"
  }
]
```

---

## Data Types

### Task Status

Valid task statuses:
- `backlog`: Not started, no immediate plans
- `todo`: Planned, but not started  
- `in_progress`: Currently being worked on
- `blocked`: Cannot proceed due to an issue
- `in_review`: Work completed, under review
- `done`: Completed
- `archived`: Completed and archived

### Task Priority

Valid task priorities:
- `low`: Low importance, can be deferred
- `medium`: Standard importance
- `high`: Important, should be prioritized
- `urgent`: Requires immediate attention

### User Roles

Valid user roles:
- `admin`: Can manage all tasks and users
- `member`: Regular user, can manage own tasks
- `guest`: Limited permissions (view only)

### Notification Types

Valid notification types:
- `assignment`: Task assignment notification
- `mention`: User mentioned in comment
- `due_soon`: Task due date approaching
- `status_change`: Task status updated
- `comment`: New comment on task

### Template Categories

Common template categories:
- `backend`: Backend development tasks
- `frontend`: Frontend development tasks  
- `design`: Design and UX tasks
- `testing`: Testing and QA tasks
- `bug-fix`: Bug fixing templates
- `feature`: Feature development templates

---

## Implementation Notes

### Input Validation
- All endpoints use Zod schemas for comprehensive input validation
- Type safety enforced throughout the entire stack
- Runtime validation ensures data integrity

### Authorization
- JWT tokens include user ID and role for authorization checks
- Role-based access control implemented for admin endpoints
- Resource ownership validated for update/delete operations

### Error Handling
- Consistent error format across all endpoints
- Detailed error codes for different failure scenarios
- Proper HTTP status codes in tRPC responses

### Performance
- Caching implemented for frequently accessed data
- Database queries optimized with proper indexing
- Response pagination for large data sets

### Security
- Rate limiting implemented for public endpoints
- Sensitive operations logged for audit trail
- Input sanitization prevents injection attacks
- CORS properly configured for frontend access

### Google Integration
- OAuth 2.0 flow for secure authentication
- Refresh tokens handled automatically
- Scoped permissions for calendar and drive access
- Error handling for API rate limits

---

*API Specification Version 2.0 - Last updated: January 2025*
*This document reflects the complete implementation of Track-It v1.0.0*