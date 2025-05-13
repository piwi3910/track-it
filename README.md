# Track-It

A task tracking and collaboration application with Google Suite integration, featuring a Kanban-style board for weekly planning and a calendar view for long-term planning.

## Features

- Dashboard for task overview
- Kanban board for weekly planning
- Calendar view for long-term planning
  - Month, week, and day views
  - Detailed hover overlays
  - Drag-and-drop task scheduling
- Backlog management for unscheduled items
- Task management features:
  - Subtasks with progress tracking
  - Recurring tasks (daily, weekly, monthly, etc.)
  - Time tracking with start/stop functionality
  - User assignments with role information
- Google Suite integration (Docs, Drive, Calendar)

## Technology Stack

### Frontend
- Vite for build tooling
- React with TypeScript
- Mantine UI component library
- React Router for navigation
- Zustand for state management
- TanStack Query for data fetching

### Backend (Planned)
- Fastify server
- PostgreSQL database
- Redis for caching
- tRPC for type-safe API

## Setup and Installation

### Prerequisites
- Node.js (v18+)
- Docker and Docker Compose (for database services)

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/track-it.git
cd track-it
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Start database services (when backend is implemented):
```bash
docker-compose up -d
```

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

## Contributing

All contributions to this project must adhere to our contribution guidelines, including the requirement for GPG signed commits. Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for details on the process and requirements.

### Commit Signing Requirements

This project enforces GPG commit signing for all contributions:
- All commits must be GPG signed by Pascal Watteel (pascal@watteel.com)
- Unsigned commits or commits signed by other parties will not be accepted
- See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions

## License

[MIT](LICENSE)