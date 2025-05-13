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
- TanStack Query for data fetching
- tRPC for type-safe API integration

### Backend
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

### Backend Development
```bash
# Install dependencies
cd backend
npm install

# Start development server (port 3001)
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
- Backend API: 3001
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

### Backend Structure
- `/src/server.ts`: Main server entry point
- `/src/routers/`: tRPC router definitions
- `/src/modules/`: Business logic modules
- `/src/db/`: Database models and connections
- `/src/utils/`: Utility functions
- `/src/types/`: TypeScript type definitions
- `/src/middleware/`: Request middleware

## Code Style and Best Practices

### TypeScript Best Practices

1. **Type Safety**
   - Always use explicit types for function parameters, return values, and variables
   - Avoid `any` type - use more specific types or `unknown` when necessary
   - Use interfaces for object structures and type unions for variants
   - Leverage TypeScript utility types (Partial, Pick, Omit, etc.)
   - Use type guards to narrow types in conditionals

2. **API Type Definitions**
   - Share types between frontend and backend using a shared package
   - Define comprehensive input/output types for API procedures
   - Use Zod for runtime validation of API inputs
   - Keep types in sync with database models

3. **Error Handling**
   - Use typed error responses
   - Implement consistent error handling with error boundaries
   - Provide informative error messages
   - Log errors appropriately

### React Component Architecture

1. **Component Structure**
   - Use functional components with hooks
   - Define prop interfaces for all components
   - Keep components focused on a single responsibility
   - Extract complex logic into custom hooks
   - Use composition over inheritance

2. **State Management**
   - Use React Context for global application state
   - Prefer local component state when possible
   - TanStack Query for server state management
   - Structure context providers hierarchically
   - Use context selectors to prevent unnecessary renders

3. **Performance Optimization**
   - Memoize expensive calculations with useMemo
   - Use useCallback for event handlers passed to child components
   - Implement virtual lists for long data sets
   - Use React.memo for pure components that render often
   - Leverage TanStack Query's caching capabilities

### tRPC Integration

1. **Router Design**
   - Organize routers by domain/feature
   - Use procedure input validation with Zod
   - Implement middleware for authentication and logging
   - Use proper error handling in procedures
   - Keep procedures focused on single operations

2. **Frontend Integration**
   - Use the exported API types for type safety
   - Leverage TanStack Query's caching and retrying capabilities
   - Handle loading and error states consistently
   - Implement optimistic updates for mutations
   - Properly invalidate queries after mutations

### Mantine UI Guidelines

1. **Component Usage**
   - Follow Mantine component API patterns consistently
   - Use Mantine theme settings for consistent styling
   - Extend components with styled-components or CSS modules as needed
   - Implement responsive designs using Mantine's responsive props
   - Use Mantine hooks for common UI patterns

2. **Theming**
   - Extend the base theme with custom colors and typography
   - Use theme variables instead of hardcoded values
   - Implement dark mode support
   - Keep spacing and sizing consistent
   - Use design tokens for colors, spacing, and typography

### Code Quality Standards

1. **Linting and Formatting**
   - Use ESLint with TypeScript and React plugins
   - Configure Prettier for consistent code formatting
   - Run linting as part of CI/CD pipeline
   - Address all warning and error messages
   - Use import sorting to maintain organization

2. **Testing**
   - Write unit tests for utilities and hooks
   - Implement component tests for UI logic
   - Use mock service worker for API testing
   - Maintain high test coverage for critical paths
   - Run tests before committing code

3. **Documentation**
   - Document complex logic with clear comments
   - Use JSDoc for public APIs and functions
   - Keep README and other documentation up to date
   - Add comments for non-obvious implementations
   - Document architectural decisions

### SOLID Principles in Frontend

1. **Single Responsibility Principle**
   - Each component, hook, or utility should have one reason to change
   - Split large components into smaller, focused ones
   - Extract reusable logic into custom hooks
   - Separate UI, state management, and business logic

2. **Open/Closed Principle**
   - Design components to be extended without modification
   - Use composition to add functionality
   - Implement generic components that can be specialized
   - Use render props or children patterns for flexible components

3. **Liskov Substitution Principle**
   - Design components to be interchangeable when they share an interface
   - Use consistent prop patterns across similar components
   - Ensure derived components don't change expected behavior
   - Implement proper type constraints on generics

4. **Interface Segregation Principle**
   - Create small, focused prop interfaces
   - Split large interfaces into smaller, specific ones
   - Avoid props that aren't used by the component
   - Use composition of hooks for complex functionality

5. **Dependency Inversion Principle**
   - Components should depend on abstractions, not concrete implementations
   - Use dependency injection for services and API calls
   - Implement provider patterns for configuration
   - Use context for sharing dependencies

## Git Workflow

1. **Branch Strategy**
   - `main`: Stable, production-ready code
   - `feature/*`: New features and enhancements
   - `bugfix/*`: Bug fixes
   - `hotfix/*`: Urgent production fixes
   - `release/*`: Release preparation

2. **Commit Guidelines**
   - Write descriptive commit messages
   - Use conventional commits format
   - Reference issue numbers in commits
   - Keep commits focused on single changes
   - Squash commits before merging
   - All commits must be authored by Pascal Watteel (pascal@watteel.com)
   - All commits should be GPG signed when possible

3. **Commit Authorship**
   - Committer name must be "Pascal Watteel"
   - Committer email must be "pascal@watteel.com"
   - This ensures consistent attribution and traceability

4. **Pull Request Process**
   - Create descriptive PR titles and descriptions
   - Add tests for new functionality
   - Address all review comments
   - Ensure CI checks pass
   - Squash and merge into the target branch

## Deployment

1. **Development Environment**
   - Uses mock API data for development
   - Can switch to real API with feature flag
   - Runs on localhost with hot reloading

2. **Production Environment**
   - Uses real API and database
   - Optimized bundle size
   - Served with proper caching headers

## CRITICAL RULES FOR CLAUDE

1. NEVER run `npm run dev` or any server/application startup command directly. Always ask the user to run these commands themselves.
2. NEVER disable or revert tRPC implementation in favor of mock data without explicit user permission.
3. Always maintain the established architecture and design patterns unless explicitly instructed otherwise.
4. Do not attempt to modify React Query and tRPC versions independently - they must remain compatible.
5. ALL git commits, pull requests, and merge requests MUST be authored by Pascal Watteel (pascal@watteel.com).

## Additional Resources

- [Mantine UI Documentation](https://mantine.dev/)
- [tRPC Documentation](https://trpc.io/)
- [TanStack Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [Fastify Documentation](https://www.fastify.io/docs/latest/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)