# Track-It User Flows

This document outlines the primary user flows within the Track-It application.

## 1. Authentication Flow

```mermaid
flowchart TD
    A[Start] --> B{User Registered?}
    B -->|Yes| C[Login Page]
    B -->|No| D[Registration Page]
    D --> E[Fill Registration Form]
    E --> F[Submit Registration]
    F --> G{Registration Successful?}
    G -->|No| E
    G -->|Yes| H[Redirect to Login]
    H --> C
    C --> I[Enter Credentials]
    I --> J[Submit Login]
    J --> K{Login Successful?}
    K -->|No| L[Show Error]
    L --> C
    K -->|Yes| M[Redirect to Dashboard]
    
    %% Google Auth Branch
    C --> N[Select Google Login]
    N --> O[Google OAuth Consent]
    O --> P{Google Auth Successful?}
    P -->|No| C
    P -->|Yes| Q{Google Account Linked?}
    Q -->|Yes| M
    Q -->|No| R[Link Google Account]
    R --> M
```

## 2. Task Creation and Management Flow

```mermaid
flowchart TD
    A[Dashboard] --> B[Click Create Task]
    B --> C[Task Form]
    C --> D[Fill Details]
    D --> E[Set Due Date]
    E --> F[Add Subtasks]
    F --> G[Assign to User]
    G --> H[Add Tags]
    H --> I[Submit Task]
    I --> J{Task Created Successfully?}
    J -->|No| K[Show Error]
    K --> C
    J -->|Yes| L[Task Added to Board]
    
    %% Quick Add Task Branch
    A --> M[Click Quick Add]
    M --> N[Enter Task Title]
    N --> O[Submit Quick Task]
    O --> P{Quick Task Created?}
    P -->|No| Q[Show Error]
    Q --> N
    P -->|Yes| L
    
    %% Template Usage Branch
    B --> R[Select From Template]
    R --> S[Choose Template]
    S --> T[Customize Template]
    T --> I
    
    %% Task Management
    L --> U[View Task Details]
    U --> V[Drag to New Status]
    U --> W[Edit Task]
    U --> X[Add Comment]
    U --> Y[Add Attachment]
    U --> Z[Track Time]
    U --> AA[Delete Task]
```

## 3. Dashboard and Views Navigation Flow

```mermaid
flowchart TD
    A[Login Success] --> B[Dashboard]
    B --> C[View Task Statistics]
    B --> D[View Recent Tasks]
    B --> E[View Upcoming Due Dates]
    
    B --> F[Navigate to Kanban Board]
    F --> G[View Tasks by Status]
    F --> H[Drag Tasks Between Columns]
    F --> I[Filter Tasks]
    
    B --> J[Navigate to Calendar]
    J --> K[Select View Mode]
    K --> L[Month View]
    K --> M[Week View]
    K --> N[Day View]
    J --> O[View Tasks by Date]
    J --> P[Create Task on Date]
    
    B --> Q[Navigate to Backlog]
    Q --> R[View Unscheduled Tasks]
    Q --> S[Move Tasks to Schedule]
    Q --> T[Prioritize Backlog]
```

## 4. Google Integration Flow

```mermaid
flowchart TD
    A[Settings Page] --> B[Google Integration Section]
    B --> C{Already Connected?}
    
    C -->|No| D[Connect Google Account]
    D --> E[OAuth Consent Screen]
    E --> F{Connection Successful?}
    F -->|No| G[Show Error]
    G --> D
    F -->|Yes| H[Google Account Connected]
    
    C -->|Yes| I[Manage Permissions]
    
    H --> J[Sync Options]
    I --> J
    J --> K[Toggle Calendar Sync]
    J --> L[Toggle Drive Integration]
    J --> M[Toggle Task Import]
    
    K --> N[Select Calendars to Sync]
    L --> O[Select Drive Folders]
    
    P[Task Details] --> Q[Link to Google Calendar]
    Q --> R[Create Calendar Event]
    
    P --> S[Link to Google Drive]
    S --> T[Attach Drive Files]
```

## 5. Notification Flow

```mermaid
flowchart TD
    A[System Event] --> B{Notification Type?}
    B --> C[Task Assignment]
    B --> D[Task Update]
    B --> E[Comment Added]
    B --> F[Due Date Reminder]
    B --> G[User Mention]
    
    C & D & E & F & G --> H[Create Notification]
    H --> I[Store in Database]
    I --> J[User Sessions Active?]
    
    J -->|Yes| K[Real-time Notification]
    J -->|No| L[Pending Notification]
    
    M[User Logs In] --> N[Fetch Pending Notifications]
    N --> O[Display Notification Count]
    
    P[User Opens Notification Menu] --> Q[Mark as Read]
    P --> R[Navigate to Related Item]
```

## 6. Template Management Flow

```mermaid
flowchart TD
    A[Templates Page] --> B[View Templates]
    B --> C[Filter by Category]
    B --> D[Search Templates]
    
    A --> E[Create New Template]
    E --> F[Enter Template Details]
    F --> G[Define Subtasks]
    G --> H[Save Template]
    
    B --> I[Use Template]
    I --> J[Select Template]
    J --> K[Customize Task Details]
    K --> L[Create Task from Template]
    
    B --> M[Edit Template]
    M --> N[Update Template Details]
    N --> O[Save Changes]
    
    B --> P[Delete Template]
    P --> Q{Confirm Delete?}
    Q -->|No| B
    Q -->|Yes| R[Remove Template]
    
    S[Task Detail] --> T[Save as Template]
    T --> U[Enter Template Name]
    U --> V[Set Privacy]
    V --> W[Save]
```

## 7. Search and Filter Flow

```mermaid
flowchart TD
    A[Any Page] --> B[Global Search Bar]
    B --> C[Enter Search Query]
    C --> D[Submit Search]
    D --> E[Display Results]
    E --> F[Filter Results]
    F --> G[By Status]
    F --> H[By Priority]
    F --> I[By Assignee]
    F --> J[By Tag]
    F --> K[By Date Range]
    
    E --> L[Select Result]
    L --> M[Navigate to Item]
```

## 8. Analytics Flow

```mermaid
flowchart TD
    A[Dashboard] --> B[View Analytics]
    B --> C[Select Time Period]
    C --> D[View Task Completion Stats]
    C --> E[View User Workload]
    C --> F[View Task Distribution]
    F --> G[By Priority]
    F --> H[By Status]
    F --> I[By Tag]
    
    B --> J[Export Analytics]
    J --> K[Select Format]
    K --> L[CSV]
    K --> M[PDF]
    K --> N[Excel]
    J --> O[Download Report]
```