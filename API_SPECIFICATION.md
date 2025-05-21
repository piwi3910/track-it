# Track-It API Specification

This document defines the API requirements for the Track-It application, detailing the endpoints, request/response formats, and authentication requirements.

## Base URL

- Development: `http://localhost:3001`
- Production: TBD

## Authentication

The API uses JWT (JSON Web Token) for authentication.

- Tokens should be included in the `Authorization` header as `Bearer {token}`
- All endpoints except the public ones (login, register) require authentication
- JWT tokens should expire after the configured time (default: 7 days)

## Error Handling

All errors follow a consistent format:

```json
{
  "message": "Error message describing what went wrong",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `UNAUTHORIZED`: Authentication required or failed
- `FORBIDDEN`: User doesn't have permission
- `NOT_FOUND`: Requested resource doesn't exist
- `VALIDATION_ERROR`: Invalid input data
- `INTERNAL_SERVER_ERROR`: Server encountered an error

## API Endpoints

### Health Check

#### GET /health

Used to check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2023-06-20T12:34:56.789Z",
  "api": "track-it-backend",
  "version": "1.0.0"
}
```

### Users

#### POST /trpc/users.login

Log in a user with email and password.

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
  "role": "admin|member|guest",
  "token": "jwt-token"
}
```

#### POST /trpc/users.register

Register a new user.

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

#### GET /trpc/users.getCurrentUser

Get the currently logged-in user's profile.

**Response:**
```json
{
  "id": "user1",
  "name": "John Doe",
  "email": "user@example.com",
  "role": "admin|member|guest",
  "avatarUrl": "https://example.com/avatar.jpg",
  "preferences": {
    "theme": "light|dark|auto",
    "defaultView": "dashboard|kanban|calendar|backlog",
    "notifications": {
      "email": true|false,
      "inApp": true|false
    }
  },
  "googleConnected": true|false,
  "googleEmail": "user@gmail.com"
}
```

#### PATCH /trpc/users.updateProfile

Update the user's profile.

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
  "role": "admin|member|guest",
  "avatarUrl": "https://example.com/new-avatar.jpg",
  "preferences": {
    "theme": "dark",
    "defaultView": "kanban",
    "notifications": {
      "email": false,
      "inApp": true
    }
  },
  "googleConnected": true|false,
  "googleEmail": "user@gmail.com"
}
```

#### GET /trpc/users.getAllUsers

Get all users (admin only).

**Response:**
```json
[
  {
    "id": "user1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "avatarUrl": "https://example.com/avatar1.jpg"
  },
  {
    "id": "user2",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "member",
    "avatarUrl": "https://example.com/avatar2.jpg"
  }
]
```

#### PATCH /trpc/users.updateUserRole

Update a user's role (admin only).

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

### Tasks

#### GET /trpc/tasks.getAll

Get all tasks for the current user.

**Response:**
```json
[
  {
    "id": "task1",
    "title": "Complete API Implementation",
    "description": "Implement all API endpoints and test with Postman",
    "status": "in_progress",
    "priority": "high",
    "tags": ["backend", "api"],
    "dueDate": "2023-06-27T00:00:00.000Z",
    "createdAt": "2023-06-10T00:00:00.000Z",
    "updatedAt": "2023-06-20T00:00:00.000Z",
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
    ]
  }
]
```

#### GET /trpc/tasks.getById?input={"id":"task1"}

Get a specific task by ID.

**Response:**
```json
{
  "id": "task1",
  "title": "Complete API Implementation",
  "description": "Implement all API endpoints and test with Postman",
  "status": "in_progress",
  "priority": "high",
  "tags": ["backend", "api"],
  "dueDate": "2023-06-27T00:00:00.000Z",
  "createdAt": "2023-06-10T00:00:00.000Z",
  "updatedAt": "2023-06-20T00:00:00.000Z",
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
  ]
}
```

#### GET /trpc/tasks.getByStatus?input={"status":"in_progress"}

Get tasks filtered by status.

**Response:**
```json
[
  {
    "id": "task1",
    "title": "Complete API Implementation",
    "description": "Implement all API endpoints and test with Postman",
    "status": "in_progress",
    "priority": "high",
    "tags": ["backend", "api"],
    "dueDate": "2023-06-27T00:00:00.000Z",
    "createdAt": "2023-06-10T00:00:00.000Z",
    "updatedAt": "2023-06-20T00:00:00.000Z",
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
    ]
  }
]
```

#### POST /trpc/tasks.create

Create a new task.

**Request:**
```json
{
  "title": "Implement Task Filtering",
  "description": "Add ability to filter tasks by multiple criteria",
  "status": "todo",
  "priority": "medium",
  "tags": ["frontend", "feature"],
  "dueDate": "2023-07-10T00:00:00.000Z",
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
  "title": "Implement Task Filtering",
  "description": "Add ability to filter tasks by multiple criteria",
  "status": "todo",
  "priority": "medium",
  "tags": ["frontend", "feature"],
  "dueDate": "2023-07-10T00:00:00.000Z",
  "createdAt": "2023-06-20T00:00:00.000Z",
  "updatedAt": "2023-06-20T00:00:00.000Z",
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

#### PATCH /trpc/tasks.update

Update an existing task.

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

**Response:**
```json
{
  "id": "task1",
  "title": "Complete API Implementation",
  "description": "Implement all API endpoints and test with Postman",
  "status": "done",
  "priority": "high",
  "tags": ["backend", "api"],
  "dueDate": "2023-06-27T00:00:00.000Z",
  "createdAt": "2023-06-10T00:00:00.000Z",
  "updatedAt": "2023-06-20T12:34:56.789Z",
  "createdById": "user1",
  "assigneeId": "user1",
  "estimatedHours": 8,
  "actualHours": 8,
  "timeTrackingActive": false,
  "trackingTimeSeconds": 0,
  "subtasks": [
    { "id": "subtask1", "title": "Define API routes", "completed": true },
    { "id": "subtask2", "title": "Implement auth endpoints", "completed": true },
    { "id": "subtask3", "title": "Implement task endpoints", "completed": true },
    { "id": "subtask4", "title": "Write tests", "completed": true }
  ]
}
```

#### DELETE /trpc/tasks.delete

Delete a task.

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

#### GET /trpc/tasks.search?input={"query":"api"}

Search for tasks.

**Response:**
```json
[
  {
    "id": "task1",
    "title": "Complete API Implementation",
    "description": "Implement all API endpoints and test with Postman",
    "status": "in_progress",
    "priority": "high",
    "tags": ["backend", "api"],
    "dueDate": "2023-06-27T00:00:00.000Z",
    "createdAt": "2023-06-10T00:00:00.000Z",
    "updatedAt": "2023-06-20T00:00:00.000Z",
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
    ]
  }
]
```

#### POST /trpc/tasks.saveAsTemplate

Save a task as a template.

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

#### POST /trpc/tasks.createFromTemplate

Create a task from a template.

**Request:**
```json
{
  "templateId": "template1",
  "taskData": {
    "title": "New API Project",
    "dueDate": "2023-07-15T00:00:00.000Z",
    "assigneeId": "user2"
  }
}
```

**Response:**
```json
{
  "id": "task5",
  "title": "New API Project",
  "description": "Implement all API endpoints and test with Postman",
  "status": "todo",
  "priority": "high",
  "tags": ["backend", "api"],
  "dueDate": "2023-07-15T00:00:00.000Z",
  "createdAt": "2023-06-20T12:34:56.789Z",
  "updatedAt": "2023-06-20T12:34:56.789Z",
  "createdById": "user1",
  "assigneeId": "user2",
  "estimatedHours": 8,
  "actualHours": 0,
  "timeTrackingActive": false,
  "trackingTimeSeconds": 0,
  "subtasks": [
    { "id": "subtask7", "title": "Define API routes", "completed": false },
    { "id": "subtask8", "title": "Implement auth endpoints", "completed": false },
    { "id": "subtask9", "title": "Implement task endpoints", "completed": false },
    { "id": "subtask10", "title": "Write tests", "completed": false }
  ]
}
```

### Templates

#### GET /trpc/templates.getAll

Get all templates accessible to the user.

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
    "createdAt": "2023-06-20T12:34:56.789Z",
    "createdById": "user1",
    "isPublic": true
  }
]
```

#### GET /trpc/templates.getById?input={"id":"template1"}

Get a specific template by ID.

**Response:**
```json
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
  "createdAt": "2023-06-20T12:34:56.789Z",
  "createdById": "user1",
  "isPublic": true
}
```

#### GET /trpc/templates.getByCategory?input={"category":"backend"}

Get templates filtered by category.

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
    "createdAt": "2023-06-20T12:34:56.789Z",
    "createdById": "user1",
    "isPublic": true
  }
]
```

#### GET /trpc/templates.getCategories

Get all template categories.

**Response:**
```json
["backend", "frontend", "design", "testing"]
```

#### POST /trpc/templates.create

Create a new template.

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
  "category": "development",
  "isPublic": true
}
```

**Response:**
```json
{
  "id": "template2",
  "name": "Bug Fix Template",
  "description": "Standard template for bug fixes",
  "priority": "high",
  "tags": ["bug"],
  "estimatedHours": 2,
  "subtasks": [
    { "id": "subtask11", "title": "Reproduce bug", "completed": false },
    { "id": "subtask12", "title": "Fix issue", "completed": false },
    { "id": "subtask13", "title": "Write tests", "completed": false },
    { "id": "subtask14", "title": "Document fix", "completed": false }
  ],
  "category": "development",
  "createdAt": "2023-06-20T12:34:56.789Z",
  "createdById": "user1",
  "isPublic": true
}
```

#### PATCH /trpc/templates.update

Update an existing template.

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

**Response:**
```json
{
  "id": "template1",
  "name": "Updated API Template",
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
  "createdAt": "2023-06-20T12:34:56.789Z",
  "updatedAt": "2023-06-21T09:12:34.567Z",
  "createdById": "user1",
  "isPublic": false
}
```

#### DELETE /trpc/templates.delete

Delete a template.

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

#### GET /trpc/templates.search?input={"query":"api"}

Search for templates.

**Response:**
```json
[
  {
    "id": "template1",
    "name": "Updated API Template",
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
    "createdAt": "2023-06-20T12:34:56.789Z",
    "updatedAt": "2023-06-21T09:12:34.567Z",
    "createdById": "user1",
    "isPublic": false
  }
]
```

### Comments

#### GET /trpc/comments.getByTaskId?input={"taskId":"task1"}

Get all comments for a task.

**Response:**
```json
[
  {
    "id": "comment1",
    "taskId": "task1",
    "authorId": "user1",
    "text": "I've started working on this",
    "createdAt": "2023-06-15T12:34:56.789Z"
  },
  {
    "id": "comment2",
    "taskId": "task1",
    "authorId": "user2",
    "text": "Let me know if you need help",
    "createdAt": "2023-06-16T09:12:34.567Z"
  }
]
```

#### GET /trpc/comments.getCommentCount?input={"taskId":"task1"}

Get the comment count for a task.

**Response:**
```json
2
```

#### POST /trpc/comments.create

Create a new comment.

**Request:**
```json
{
  "taskId": "task1",
  "text": "I've completed the first subtask"
}
```

**Response:**
```json
{
  "id": "comment3",
  "taskId": "task1",
  "authorId": "user1",
  "text": "I've completed the first subtask",
  "createdAt": "2023-06-20T12:34:56.789Z"
}
```

#### PATCH /trpc/comments.update

Update an existing comment.

**Request:**
```json
{
  "id": "comment3",
  "text": "I've completed the first and second subtasks"
}
```

**Response:**
```json
{
  "id": "comment3",
  "taskId": "task1",
  "authorId": "user1",
  "text": "I've completed the first and second subtasks",
  "createdAt": "2023-06-20T12:34:56.789Z",
  "updatedAt": "2023-06-20T12:45:12.345Z"
}
```

#### DELETE /trpc/comments.delete

Delete a comment.

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

### Attachments

#### GET /trpc/attachments.getByTaskId?input={"taskId":"task1"}

Get all attachments for a task.

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
    "createdAt": "2023-06-15T12:34:56.789Z",
    "thumbnailUrl": "https://example.com/thumbnails/api-design.jpg"
  }
]
```

#### POST /trpc/attachments.upload

Upload an attachment to a task.

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
  "createdAt": "2023-06-20T12:34:56.789Z"
}
```

#### DELETE /trpc/attachments.delete

Delete an attachment.

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

### Analytics

#### GET /trpc/analytics.getTasksCompletionStats?input={"timeframe":"week"}

Get task completion statistics.

**Response:**
```json
[
  { "date": "2023-06-14", "completed": 3 },
  { "date": "2023-06-15", "completed": 5 },
  { "date": "2023-06-16", "completed": 2 },
  { "date": "2023-06-17", "completed": 0 },
  { "date": "2023-06-18", "completed": 1 },
  { "date": "2023-06-19", "completed": 4 },
  { "date": "2023-06-20", "completed": 2 }
]
```

#### GET /trpc/analytics.getUserWorkload

Get workload by user.

**Response:**
```json
[
  { "userId": "user1", "taskCount": 7 },
  { "userId": "user2", "taskCount": 5 },
  { "userId": "user3", "taskCount": 3 }
]
```

#### GET /trpc/analytics.getTasksByPriority

Get task counts by priority.

**Response:**
```json
[
  { "priority": "low", "count": 4 },
  { "priority": "medium", "count": 6 },
  { "priority": "high", "count": 3 },
  { "priority": "urgent", "count": 2 }
]
```

### Notifications

#### GET /trpc/notifications.getAll

Get all notifications for the current user.

**Response:**
```json
[
  {
    "id": "notification1",
    "userId": "user1",
    "type": "assignment",
    "message": "You have been assigned to task 'Fix Login Issues'",
    "relatedTaskId": "task3",
    "createdAt": "2023-06-19T12:34:56.789Z",
    "read": false
  },
  {
    "id": "notification2",
    "userId": "user1",
    "type": "mention",
    "message": "User2 mentioned you in a comment",
    "relatedTaskId": "task1",
    "relatedCommentId": "comment2",
    "createdAt": "2023-06-16T09:12:34.567Z",
    "read": true
  }
]
```

#### PATCH /trpc/notifications.markAsRead

Mark a notification as read.

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

### Google Integration

#### POST /trpc/googleIntegration.syncCalendar

Sync tasks with Google Calendar.

**Response:**
```json
true
```

#### GET /trpc/googleIntegration.importGoogleTasks

Import tasks from Google Tasks.

**Response:**
```json
[
  {
    "id": "task6",
    "title": "Review presentation",
    "description": "Review marketing presentation",
    "status": "todo",
    "priority": "medium",
    "dueDate": "2023-06-25T00:00:00.000Z",
    "createdAt": "2023-06-20T12:34:56.789Z",
    "updatedAt": "2023-06-20T12:34:56.789Z",
    "createdById": "user1",
    "assigneeId": "user1",
    "source": "google"
  }
]
```

#### GET /trpc/googleIntegration.getGoogleDriveFiles

Get Google Drive files.

**Response:**
```json
[
  {
    "id": "file1",
    "name": "Project Plan.docx",
    "url": "https://drive.google.com/file/d/abc123"
  },
  {
    "id": "file2",
    "name": "Budget.xlsx",
    "url": "https://drive.google.com/file/d/def456"
  }
]
```

## Data Types

### Task Status

Valid task statuses:
- `backlog`: Not started, no immediate plans
- `todo`: Planned, but not started
- `in_progress`: Currently being worked on
- `blocked`: Cannot proceed due to an issue
- `in_review`: Work completed, under review
- `done`: Completed

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

## Implementation Notes

1. All endpoints should implement proper input validation
2. Proper authorization checks should be implemented for all protected routes
3. JWT tokens should include user ID and role information
4. Error responses should follow the standard format
5. Sensitive operations should be logged
6. Rate limiting should be implemented for public endpoints