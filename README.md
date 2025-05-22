# Track-It v1.0.0

A comprehensive task tracking and collaboration application with Google Suite integration, featuring a modern React frontend and robust tRPC backend API.

## Features

### Core Functionality
- **Dashboard** for comprehensive task overview with analytics
- **Kanban Board** for weekly planning with drag-and-drop functionality
- **Calendar View** for long-term planning with multiple view modes
- **Backlog Management** for unscheduled task organization
- **Global Search** with support for task IDs, titles, and tags

### Task Management
- User-friendly task numbering system (TASK-1, TASK-2, etc.)
- Subtasks with progress tracking and completion visualization
- Recurring tasks (daily, weekly, monthly, quarterly, yearly)
- Real-time time tracking with start/stop functionality
- User assignments with role-based permissions
- Priority levels with visual indicators
- Tag-based organization and filtering
- Rich commenting system for collaboration
- File attachments support

### User Experience
- Modern, responsive UI with Mantine components
- Intuitive task card layout with corner-positioned elements
- Real-time updates and optimistic UI interactions
- Comprehensive error handling and loading states
- Keyboard shortcuts for power users (Ctrl+K for search)

### Technical Features
- Type-safe API with tRPC integration
- PostgreSQL database with Prisma ORM
- Redis caching for improved performance
- Comprehensive testing suite
- Google OAuth integration
- RESTful API design patterns

## Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for fast build tooling and hot module replacement
- **Mantine UI** component library for modern, accessible components
- **React Router v6** for client-side navigation
- **TanStack Query** for efficient data fetching and caching
- **React Context API** for app-wide state with **Zustand** for specific feature stores

### Backend
- **Express** server with TypeScript support
- **tRPC** for end-to-end type safety and API development
- **PostgreSQL** database for reliable data persistence
- **Prisma ORM** for type-safe database operations
- **Redis** for caching and session management
- **JWT** authentication with Google OAuth integration

## Setup and Installation

### Prerequisites
- Node.js (v18+)
- Docker and Docker Compose (for database services)

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/piwi3910/track-it.git
cd track-it
```

2. Start database services:
```bash
docker-compose up -d
```

3. Install and setup backend:
```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

4. Install and start frontend:
```bash
cd ../frontend
npm install
npm run dev
```

5. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Project Structure

### Frontend
- `/frontend/src/components`: Reusable UI components
- `/frontend/src/features`: Feature-specific components
- `/frontend/src/hooks`: Custom React hooks
- `/frontend/src/api`: API client and mock functions
- `/frontend/src/utils`: Utility functions
- `/frontend/src/types`: TypeScript type definitions
- `/frontend/src/pages`: Page components
- `/frontend/src/layouts`: Layout components
- `/frontend/src/context`: React context providers
- `/frontend/src/assets`: Static assets

## Port Configuration
- Frontend: 3000
- Backend API (future): 3001
- PostgreSQL: 5436
- Redis: 6381

## License

[MIT](LICENSE)