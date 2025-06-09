# Track-It v1.0.0

A comprehensive task tracking and collaboration application with Google Suite integration, featuring a modern React frontend and robust Fastify backend API with tRPC.

## Features

### Core Functionality
- **Dashboard** for comprehensive task overview with analytics
- **Kanban Board** for weekly planning with drag-and-drop functionality
- **Calendar View** for long-term planning with multiple view modes (month, week, day)
- **Backlog Management** for unscheduled task organization
- **Global Search** with support for task IDs, titles, and tags
- **Template System** for rapid task creation with categories

### Task Management
- User-friendly task numbering system (TASK-1, TASK-2, etc.)
- **Subtasks** with parent-child relationships and progress tracking
- **Time tracking** with start/stop functionality and duration logging
- User assignments with role-based permissions (admin, member, guest)
- Priority levels (Low, Medium, High, Urgent) with visual indicators
- Task status management (Backlog, Todo, In Progress, Review, Done, Archived)
- Tag-based organization and filtering
- **Rich commenting system** with threaded discussions and @mentions
- **File attachments** support with Google Drive integration

### Collaboration Features
- **Real-time notifications** for task assignments, comments, and updates
- **@mentions** in comments with instant notifications
- **Comment threads** with reply support
- **Activity tracking** for all task changes
- **User role management** with permission-based access control

### Google Workspace Integration
- **Google OAuth** authentication for secure sign-in
- **Google Calendar** synchronization (bidirectional sync)
- **Google Calendar events** import and management
- **Google Drive** integration for file attachments (prepared)

### User Experience
- Modern, responsive UI with shadcn/ui components
- **Light/dark theme** toggle with system preference detection
- Real-time updates and optimistic UI interactions
- Comprehensive error handling and loading states
- Keyboard shortcuts for power users (Ctrl+K for search)
- **Notification center** with unread counts and management

### Analytics and Insights
- **Task completion statistics** with timeframe analysis
- **User workload visualization** and metrics
- **Priority distribution** analysis
- **Performance insights** and trends
- Dashboard widgets with interactive charts

## Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for fast build tooling and hot module replacement
- **shadcn/ui** components built on Radix UI primitives
- **React Router v6** for client-side navigation
- **TanStack Query v5** for efficient data fetching and caching
- **Zustand** for state management with Redux DevTools support
- **tRPC React Query** for end-to-end type safety
- **Tailwind CSS** for utility-first styling

### Backend
- **Fastify** server with TypeScript support and performance optimizations
- **tRPC v11** for end-to-end type safety and API development
- **PostgreSQL** database for reliable data persistence
- **Prisma ORM** for type-safe database operations and migrations
- **Redis** for caching and session management
- **JWT** authentication with Google OAuth integration
- **Zod** for runtime validation and schema definitions

### Development Tools
- **TypeScript** across the entire stack for type safety
- **ESLint** and **Prettier** for code quality and formatting
- **Jest** with React Testing Library for comprehensive testing
- **Docker Compose** for local development services
- **GitHub Actions** ready for CI/CD workflows

## Architecture

Track-It follows a clean architecture pattern with clear separation of concerns:

### Key Architectural Decisions
- **Repository Pattern**: Backend uses repositories for data access, separating business logic from database operations
- **Type-Safe API**: tRPC provides end-to-end type safety without code generation
- **State Management**: Zustand stores provide centralized state management with minimal boilerplate
- **Component Architecture**: UI components are built with shadcn/ui for full control and customization
- **Shared Types**: Monorepo structure with shared types package ensures consistency

### Recent Improvements
- **Migrated from Mantine to shadcn/ui**: Better performance and full control over components
- **Implemented Repository Pattern**: Cleaner backend architecture with better testability
- **Consolidated State Management**: Migrated from multiple Context providers to Zustand stores
- **Type System Overhaul**: Simplified enum handling and removed manual type conversions
- **Component Refactoring**: Large components broken down into focused, reusable pieces

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Setup and Installation

### Prerequisites
- Node.js (v18+)
- Docker and Docker Compose (for database services)
- Git

### Development Setup

1. **Clone the repository:**
```bash
git clone https://github.com/piwi3910/track-it.git
cd track-it
```

2. **Start database services:**
```bash
docker-compose up -d
```
This starts PostgreSQL (port 5436) and Redis (port 6381)

3. **Setup and start backend:**
```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```
The backend will be available at http://localhost:3001

4. **Setup and start frontend:**
```bash
cd ../frontend
npm install
npm run dev
```
The frontend will be available at http://localhost:3000

5. **Access the application:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/trpc
- **PostgreSQL**: localhost:5436
- **Redis**: localhost:6381

### Environment Configuration

Create `.env` files in both `frontend` and `backend` directories based on the provided `.env.example` files.

#### Backend Environment Variables
```env
DATABASE_URL="postgresql://user:password@localhost:5436/trackit"
REDIS_URL="redis://localhost:6381"
JWT_SECRET="your-jwt-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

#### Frontend Environment Variables
```env
VITE_API_URL="http://localhost:3001/trpc"
```

## Project Structure

### Root Directory
```
track-it/
├── frontend/          # React frontend application
├── backend/           # Fastify backend with tRPC
├── shared/            # Shared TypeScript types and utilities
├── docs/              # Project documentation
├── memory-bank/       # Development context and progress tracking
└── docker-compose.yml # Local development services
```

### Frontend Structure
```
frontend/src/
├── components/        # Reusable UI components
├── pages/            # Page components (Dashboard, Kanban, Calendar, etc.)
├── stores/           # Zustand state management stores
├── api/              # tRPC client and API utilities
├── hooks/            # Custom React hooks
├── utils/            # Utility functions and helpers
├── types/            # TypeScript type definitions
├── styles/           # CSS and theme files
└── __tests__/        # Test files and test utilities
```

### Backend Structure
```
backend/src/
├── routers/          # tRPC router definitions
├── repositories/     # Repository pattern data access layer
├── db/               # Database client and migrations
│   └── services/     # Legacy service layer
├── trpc/             # tRPC configuration and context
├── utils/            # Utility functions and error handling
├── cache/            # Redis caching utilities
└── __tests__/        # Backend test suites
```

## Testing

### Frontend Testing
```bash
cd frontend
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:coverage      # Run with coverage report
npm run test:watch         # Watch mode for development
```

### Backend Testing
```bash
cd backend
npm test                    # Run all tests with coverage
npm run test:watch         # Watch mode for development
```

### Test Coverage Targets
- **Frontend**: 70% coverage across statements, branches, functions, and lines
- **Backend**: 60% coverage across statements, branches, functions, and lines

## API Documentation

The application uses tRPC for type-safe API development. Key API endpoints include:

- **Authentication**: `/auth` - User registration, login, profile management
- **Tasks**: `/tasks` - CRUD operations, assignments, status updates
- **Comments**: `/comments` - Task comments, replies, mentions
- **Templates**: `/templates` - Task template management
- **Notifications**: `/notifications` - Real-time notification system
- **Analytics**: `/analytics` - Task statistics and insights
- **Google Integration**: `/google` - OAuth, calendar sync, drive integration

API documentation is automatically generated from tRPC schemas and available during development.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the established patterns
4. Add tests for new functionality
5. Ensure all tests pass and coverage meets requirements
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices and maintain type safety
- Write comprehensive tests for new features
- Update documentation when adding new functionality
- Follow the established code style (ESLint/Prettier)
- Ensure all CI checks pass before submitting PRs

## Production Deployment

The application is designed for containerized deployment with:
- **Frontend**: Static build served by nginx or similar
- **Backend**: Node.js application with process management
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis for session and data caching
- **Environment**: Production environment variables and secrets

Refer to the deployment documentation in `/docs` for detailed deployment instructions.

## Current Status

**Track-It v1.0.0** is a **production-ready** application that includes:

✅ **Complete MVP Implementation** - All core features fully functional
✅ **Advanced Collaboration** - Comments, mentions, real-time notifications  
✅ **Google Integration** - OAuth, Calendar sync, Drive preparation
✅ **Modern Architecture** - Type-safe, tested, performant
✅ **Comprehensive Testing** - Unit, integration, and coverage reporting

The application significantly exceeds the original MVP scope and provides a robust foundation for task management and team collaboration.

## License

[MIT](LICENSE)

---

*For detailed feature documentation, see [docs/features-mvp.md](docs/features-mvp.md)*
*For API specifications, see [API_SPECIFICATION.md](API_SPECIFICATION.md)*