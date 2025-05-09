# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Track-It is a task tracking and collaboration application with Google Suite integration. It features:
- Dashboard for task overview
- Kanban-style board for weekly planning
- Calendar view for long-term planning
- Backlog tracking for unscheduled items

## Technology Stack

### Frontend
- Vite for build tooling
- React with TypeScript
- Mantine UI component library
- React Router for navigation
- Zustand for state management
- TanStack Query for data fetching
- tRPC for API integration (planned)

### Backend (planned)
- Fastify server
- PostgreSQL database
- Redis for caching
- tRPC for type-safe API

## Development Setup

### Frontend Development
```bash
# Install dependencies
cd frontend
npm install

# Start development server (port 3000)
npm run dev
```

### Database Services
```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Stop services
docker-compose down
```

## Port Configuration
- Frontend: 3000
- Backend API (future): 3001
- PostgreSQL: 5436
- Redis: 6381

## Architecture

The application follows a feature-based architecture:

### Frontend Structure
- `/src/components`: Reusable UI components
- `/src/features`: Feature-specific components and logic
- `/src/hooks`: Custom React hooks
- `/src/api`: API client and mock functions
- `/src/utils`: Utility functions
- `/src/types`: TypeScript type definitions
- `/src/pages`: Page components
- `/src/layouts`: Layout components
- `/src/context`: React context providers
- `/src/assets`: Static assets

## Notes for Claude

- The frontend initially uses mock data and mock API functions
- Future integration with backend will use tRPC for type-safe API calls
- Docker Compose manages PostgreSQL and Redis services