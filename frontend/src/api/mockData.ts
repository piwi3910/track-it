import { Task, User, Comment, Attachment } from '@/types/task';

// Mock users data
export const mockUsers: User[] = [
  {
    id: 'user1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=user1',
    role: 'admin'
  },
  {
    id: 'user2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=user2',
    role: 'member'
  },
  {
    id: 'user3',
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=user3',
    role: 'member'
  },
  {
    id: 'user4',
    name: 'Alice Williams',
    email: 'alice.williams@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=user4',
    role: 'member'
  },
  {
    id: 'user5',
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?u=user5',
    role: 'member'
  }
];

// Mock tasks data
export const mockTasks: Task[] = [
  {
    id: 'task1',
    title: 'Implement dashboard',
    description: 'Create the dashboard view with stats and recent activity',
    status: 'in_progress',
    priority: 'high',
    tags: ['frontend', 'ui'],
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
    assigneeId: 'user1',
    reporterId: 'user2',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    estimatedHours: 8,
    actualHours: 3,
    subtasks: [
      { id: 'subtask1-1', title: 'Design stats cards', completed: true },
      { id: 'subtask1-2', title: 'Implement charts', completed: false },
      { id: 'subtask1-3', title: 'Add recent activity section', completed: false }
    ]
  },
  {
    id: 'task2',
    title: 'Create task form',
    description: 'Implement form for creating new tasks with validation',
    status: 'todo',
    priority: 'medium',
    tags: ['frontend', 'forms'],
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // 3 days from now
    assigneeId: 'user3',
    reporterId: 'user1',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    estimatedHours: 5,
    actualHours: 0,
    subtasks: [
      { id: 'subtask2-1', title: 'Create form layout', completed: false },
      { id: 'subtask2-2', title: 'Add validation logic', completed: false }
    ]
  },
  {
    id: 'task3',
    title: 'Design UI components',
    description: 'Create reusable UI components for the application',
    status: 'done',
    priority: 'medium',
    tags: ['design', 'ui'],
    dueDate: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0], // 1 day ago
    assigneeId: 'user2',
    reporterId: 'user1',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    estimatedHours: 12,
    actualHours: 10,
    subtasks: [
      { id: 'subtask3-1', title: 'Design buttons and inputs', completed: true },
      { id: 'subtask3-2', title: 'Create card components', completed: true },
      { id: 'subtask3-3', title: 'Design modals and dialogs', completed: true }
    ]
  },
  {
    id: 'task4',
    title: 'Connect to API',
    description: 'Set up API integration for tasks and users',
    status: 'backlog',
    priority: 'low',
    tags: ['backend', 'api'],
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // 7 days from now
    assigneeId: null,
    reporterId: 'user1',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    estimatedHours: 8,
    actualHours: 0,
    subtasks: []
  },
  {
    id: 'task5',
    title: 'Add drag and drop',
    description: 'Implement drag and drop for Kanban view',
    status: 'todo',
    priority: 'high',
    tags: ['frontend', 'ux'],
    dueDate: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0], // 1 day from now
    assigneeId: 'user1',
    reporterId: 'user4',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    estimatedHours: 6,
    actualHours: 0,
    subtasks: [
      { id: 'subtask5-1', title: 'Research drag and drop libraries', completed: true },
      { id: 'subtask5-2', title: 'Implement basic drag functionality', completed: false }
    ]
  },
  {
    id: 'task6',
    title: 'Create calendar view',
    description: 'Implement calendar view for tasks with due dates',
    status: 'in_progress',
    priority: 'medium',
    tags: ['frontend', 'ui'],
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0], // 4 days from now
    assigneeId: 'user3',
    reporterId: 'user1',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(), // 4 days ago
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    estimatedHours: 10,
    actualHours: 4,
    subtasks: [
      { id: 'subtask6-1', title: 'Design calendar layout', completed: true },
      { id: 'subtask6-2', title: 'Implement month view', completed: true },
      { id: 'subtask6-3', title: 'Add week view', completed: false },
      { id: 'subtask6-4', title: 'Create task popover for calendar', completed: false }
    ]
  },
  {
    id: 'task7',
    title: 'Fix responsive layout',
    description: 'Make the application fully responsive for mobile devices',
    status: 'todo',
    priority: 'low',
    tags: ['frontend', 'responsive'],
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], // 5 days from now
    assigneeId: 'user5',
    reporterId: 'user2',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    estimatedHours: 8,
    actualHours: 0,
    subtasks: []
  },
  {
    id: 'task8',
    title: 'User authentication',
    description: 'Implement user authentication with JWT',
    status: 'backlog',
    priority: 'urgent',
    tags: ['security', 'backend'],
    dueDate: null,
    assigneeId: null,
    reporterId: 'user1',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    estimatedHours: 12,
    actualHours: 0,
    subtasks: []
  },
  {
    id: 'task9',
    title: 'Create documentation',
    description: 'Write documentation for the application',
    status: 'backlog',
    priority: 'low',
    tags: ['docs'],
    dueDate: null,
    assigneeId: null,
    reporterId: 'user1',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(), // 15 days ago
    updatedAt: new Date(Date.now() - 86400000 * 15).toISOString(), // 15 days ago
    estimatedHours: 6,
    actualHours: 0,
    subtasks: []
  },
  {
    id: 'task10',
    title: 'Add user settings page',
    description: 'Create a page for user profile and preferences',
    status: 'in_review',
    priority: 'medium',
    tags: ['frontend', 'settings'],
    dueDate: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0], // 1 day ago
    assigneeId: 'user4',
    reporterId: 'user1',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(), // 8 days ago
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    estimatedHours: 8,
    actualHours: 7,
    subtasks: [
      { id: 'subtask10-1', title: 'Create profile section', completed: true },
      { id: 'subtask10-2', title: 'Implement theme switching', completed: true },
      { id: 'subtask10-3', title: 'Add notification preferences', completed: true }
    ]
  },
];

// Mock comments data
export const mockComments: Comment[] = [
  {
    id: 'comment1',
    taskId: 'task1',
    authorId: 'user2',
    text: 'I think we should add a chart showing task completion over time.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    updatedAt: null
  },
  {
    id: 'comment2',
    taskId: 'task1',
    authorId: 'user1',
    text: 'Good idea! I\'ll add that to the implementation.',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    updatedAt: null
  },
  {
    id: 'comment3',
    taskId: 'task3',
    authorId: 'user1',
    text: 'The UI components look great! Can we add a dark mode variant?',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    updatedAt: null
  },
  {
    id: 'comment4',
    taskId: 'task3',
    authorId: 'user2',
    text: 'I\'ve added dark mode variants for all components.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    updatedAt: null
  },
  {
    id: 'comment5',
    taskId: 'task6',
    authorId: 'user3',
    text: 'Making progress on the calendar view. Need some help with the date picker component.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    updatedAt: null
  },
  {
    id: 'comment6',
    taskId: 'task10',
    authorId: 'user4',
    text: 'User settings page is ready for review.',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    updatedAt: null
  },
  {
    id: 'comment7',
    taskId: 'task10',
    authorId: 'user1',
    text: 'Looks good! Just a few minor UI adjustments needed.',
    createdAt: new Date(Date.now() - 86400000 * 0.5).toISOString(), // 12 hours ago
    updatedAt: null
  }
];

// Mock attachments data
export const mockAttachments: Attachment[] = [
  {
    id: 'attachment1',
    taskId: 'task1',
    name: 'dashboard-mockup.png',
    fileType: 'image/png',
    size: 256000,
    url: 'https://example.com/mock-files/dashboard-mockup.png',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString() // 3 days ago
  },
  {
    id: 'attachment2',
    taskId: 'task1',
    name: 'requirements.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 35840,
    url: 'https://example.com/mock-files/requirements.docx',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString() // 5 days ago
  },
  {
    id: 'attachment3',
    taskId: 'task3',
    name: 'ui-components.sketch',
    fileType: 'application/octet-stream',
    size: 1500000,
    url: 'https://example.com/mock-files/ui-components.sketch',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString() // 6 days ago
  },
  {
    id: 'attachment4',
    taskId: 'task6',
    name: 'calendar-design.png',
    fileType: 'image/png',
    size: 425000,
    url: 'https://example.com/mock-files/calendar-design.png',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString() // 4 days ago
  }
];

// Mock task templates data
import { TaskTemplate } from '@/types/task';

export const mockTemplates: TaskTemplate[] = [
  {
    id: 'template1',
    name: 'Bug Fix',
    description: 'Template for typical bug fixes',
    priority: 'high',
    tags: ['bug', 'fix'],
    estimatedHours: 3,
    category: 'Development',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    createdBy: 'user1',
    isPublic: true,
    usageCount: 15,
    subtasks: [
      { id: 'subtask-t1-1', title: 'Reproduce the issue', completed: false },
      { id: 'subtask-t1-2', title: 'Identify root cause', completed: false },
      { id: 'subtask-t1-3', title: 'Implement fix', completed: false },
      { id: 'subtask-t1-4', title: 'Add unit tests', completed: false },
      { id: 'subtask-t1-5', title: 'Update documentation', completed: false }
    ]
  },
  {
    id: 'template2',
    name: 'Feature Implementation',
    description: 'New feature development process',
    priority: 'medium',
    tags: ['feature', 'development'],
    estimatedHours: 8,
    category: 'Development',
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    createdBy: 'user1',
    isPublic: true,
    usageCount: 8,
    subtasks: [
      { id: 'subtask-t2-1', title: 'Create technical design', completed: false },
      { id: 'subtask-t2-2', title: 'Get design approval', completed: false },
      { id: 'subtask-t2-3', title: 'Implement feature', completed: false },
      { id: 'subtask-t2-4', title: 'Write unit tests', completed: false },
      { id: 'subtask-t2-5', title: 'Document the feature', completed: false },
      { id: 'subtask-t2-6', title: 'Peer review', completed: false }
    ]
  },
  {
    id: 'template3',
    name: 'Sprint Planning',
    description: 'Tasks for sprint planning meetings',
    priority: 'medium',
    tags: ['meeting', 'planning'],
    estimatedHours: 2,
    category: 'Meetings',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    createdBy: 'user2',
    isPublic: true,
    usageCount: 12,
    subtasks: [
      { id: 'subtask-t3-1', title: 'Review previous sprint', completed: false },
      { id: 'subtask-t3-2', title: 'Discuss blockers', completed: false },
      { id: 'subtask-t3-3', title: 'Prioritize backlog', completed: false },
      { id: 'subtask-t3-4', title: 'Assign tasks', completed: false },
      { id: 'subtask-t3-5', title: 'Define sprint goals', completed: false }
    ]
  },
  {
    id: 'template4',
    name: 'Design Review',
    description: 'Template for design review meetings',
    priority: 'medium',
    tags: ['design', 'review', 'meeting'],
    estimatedHours: 1.5,
    category: 'Meetings',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    createdBy: 'user4',
    isPublic: true,
    usageCount: 6,
    subtasks: [
      { id: 'subtask-t4-1', title: 'Present design concepts', completed: false },
      { id: 'subtask-t4-2', title: 'Collect feedback', completed: false },
      { id: 'subtask-t4-3', title: 'Discuss technical feasibility', completed: false },
      { id: 'subtask-t4-4', title: 'Plan iterations', completed: false }
    ]
  },
  {
    id: 'template5',
    name: 'Documentation Task',
    description: 'Standard documentation updates',
    priority: 'low',
    tags: ['documentation'],
    estimatedHours: 4,
    category: 'Documentation',
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    createdBy: 'user3',
    isPublic: true,
    usageCount: 3,
    subtasks: [
      { id: 'subtask-t5-1', title: 'Review existing documentation', completed: false },
      { id: 'subtask-t5-2', title: 'Identify gaps', completed: false },
      { id: 'subtask-t5-3', title: 'Write new content', completed: false },
      { id: 'subtask-t5-4', title: 'Add illustrations/diagrams', completed: false },
      { id: 'subtask-t5-5', title: 'Get peer review', completed: false },
      { id: 'subtask-t5-6', title: 'Publish updates', completed: false }
    ]
  }
];