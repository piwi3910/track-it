import { PrismaClient, UserRole, TaskStatus, TaskPriority, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear database if needed in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Cleaning database for development seed...');
    await prisma.notification.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.taskTemplate.deleteMany();
    await prisma.googleCalendarEvent.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create users
  console.log('Creating users...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: 'hashed_password123', // In real app, use bcrypt
      role: UserRole.ADMIN,
      avatarUrl: 'https://i.pravatar.cc/150?u=admin',
      preferences: {
        theme: 'dark',
        defaultView: 'dashboard'
      }
    }
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      name: 'John Doe',
      passwordHash: 'hashed_password123',
      role: UserRole.MEMBER,
      avatarUrl: 'https://i.pravatar.cc/150?u=john',
      preferences: {
        theme: 'light',
        defaultView: 'kanban'
      }
    }
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      passwordHash: 'hashed_password123',
      role: UserRole.MEMBER,
      avatarUrl: 'https://i.pravatar.cc/150?u=jane',
      preferences: {
        theme: 'auto',
        defaultView: 'calendar'
      }
    }
  });

  // Create task templates
  console.log('Creating task templates...');
  const bugTemplate = await prisma.taskTemplate.create({
    data: {
      name: 'Bug Report Template',
      description: 'Template for bug reports',
      priority: TaskPriority.MEDIUM,
      estimatedHours: 2,
      tags: ['bug', 'fix'],
      isPublic: true,
      category: 'Bug Reports',
      templateData: {
        title: 'Fix bug in [Component]',
        description: '## Bug Description\n\n## Steps to Reproduce\n\n## Expected Behavior\n\n## Actual Behavior\n\n## Screenshots/Logs',
        subtasks: [
          { title: 'Reproduce bug', estimatedHours: 0.5 },
          { title: 'Identify root cause', estimatedHours: 0.5 },
          { title: 'Implement fix', estimatedHours: 1 },
          { title: 'Add tests', estimatedHours: 0.5 },
          { title: 'Document fix', estimatedHours: 0.5 }
        ]
      }
    }
  });

  const featureTemplate = await prisma.taskTemplate.create({
    data: {
      name: 'Feature Implementation Template',
      description: 'Template for new feature implementation',
      priority: TaskPriority.HIGH,
      estimatedHours: 8,
      tags: ['feature', 'implementation'],
      isPublic: true,
      category: 'Feature Development',
      templateData: {
        title: 'Implement [Feature]',
        description: '## Feature Description\n\n## Requirements\n\n## Implementation Plan\n\n## Acceptance Criteria',
        subtasks: [
          { title: 'Design feature', estimatedHours: 2 },
          { title: 'Implement backend', estimatedHours: 2 },
          { title: 'Implement frontend', estimatedHours: 2 },
          { title: 'Write tests', estimatedHours: 1 },
          { title: 'Document feature', estimatedHours: 1 }
        ]
      }
    }
  });

  // Create tasks
  console.log('Creating tasks...');
  const task1 = await prisma.task.create({
    data: {
      title: 'Implement Google OAuth',
      description: 'Implement Google OAuth for user authentication in the application.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      creatorId: admin.id,
      assigneeId: user1.id,
      estimatedHours: 4,
      tags: ['authentication', 'google', 'oauth'],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    }
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Design and implement dashboard widgets',
      description: 'Create reusable widget components for the dashboard.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      creatorId: admin.id,
      assigneeId: user2.id,
      estimatedHours: 6,
      tags: ['frontend', 'dashboard', 'widgets'],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
    }
  });

  // Create subtasks
  console.log('Creating subtasks...');
  const subtask1 = await prisma.task.create({
    data: {
      title: 'Configure Google API credentials',
      description: 'Set up OAuth2 credentials in Google Developer Console.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      creatorId: user1.id,
      assigneeId: user1.id,
      parentId: task1.id,
      estimatedHours: 1,
      tags: ['google', 'api', 'configuration'],
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 day from now
    }
  });

  const subtask2 = await prisma.task.create({
    data: {
      title: 'Implement OAuth flow in backend',
      description: 'Create API endpoints for Google OAuth flow.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      creatorId: user1.id,
      assigneeId: user1.id,
      parentId: task1.id,
      estimatedHours: 2,
      tags: ['backend', 'authentication'],
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    }
  });

  // Create comments
  console.log('Creating comments...');
  const comment1 = await prisma.comment.create({
    data: {
      text: 'I\'ve created the Google API credentials. The client ID and secret are stored in the .env file.',
      taskId: task1.id,
      authorId: user1.id
    }
  });

  const comment2 = await prisma.comment.create({
    data: {
      text: 'Great! Make sure to follow OAuth best practices for security.',
      taskId: task1.id,
      authorId: admin.id
    }
  });

  const reply1 = await prisma.comment.create({
    data: {
      text: 'Will do! I\'ll implement PKCE for added security.',
      taskId: task1.id,
      authorId: user1.id,
      parentId: comment2.id
    }
  });

  // Create attachments
  console.log('Creating attachments...');
  const attachment1 = await prisma.attachment.create({
    data: {
      fileName: 'google-oauth-flow.png',
      fileSize: 1024 * 50, // 50KB
      fileType: 'image/png',
      filePath: '/uploads/google-oauth-flow.png',
      taskId: task1.id
    }
  });

  // Create notifications
  console.log('Creating notifications...');
  const notification1 = await prisma.notification.create({
    data: {
      type: NotificationType.TASK_ASSIGNED,
      title: 'Task Assigned',
      message: 'You have been assigned to implement Google OAuth.',
      userId: user1.id,
      resourceType: 'task',
      resourceId: task1.id
    }
  });

  const notification2 = await prisma.notification.create({
    data: {
      type: NotificationType.COMMENT_ADDED,
      title: 'New Comment',
      message: 'Admin commented on a task you\'re assigned to.',
      userId: user1.id,
      resourceType: 'comment',
      resourceId: comment2.id
    }
  });

  // Create Google Calendar events
  console.log('Creating Google Calendar events...');
  const event1 = await prisma.googleCalendarEvent.create({
    data: {
      googleEventId: 'google_event_id_1',
      title: 'OAuth Implementation Review',
      description: 'Review the OAuth implementation and discuss next steps.',
      startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hour duration
      location: 'Conference Room A',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      userId: admin.id,
      taskId: task1.id
    }
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });