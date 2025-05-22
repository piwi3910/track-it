# Tech Context: Track-It

## 1. Technologies Used (from CLAUDE.md)

**Frontend:**
- **Build Tool:** Vite
- **Language:** TypeScript
- **UI Library/Framework:** React
- **Component Library:** Mantine UI
- **Routing:** React Router
- **State Management:** Zustand
- **Data Fetching/Server State:** TanStack Query (React Query)
- **Planned API Integration:** tRPC

**Backend (Planned):**
- **Framework:** Fastify (Node.js)
- **Language:** TypeScript (implied by tRPC and modern Node.js practices)
- **Database:** PostgreSQL
- **Caching:** Redis
- **API:** tRPC

**Development Environment & Tooling:**
- **Package Manager:** npm (as per `frontend/package.json` and `npm install` commands in `CLAUDE.md`)
- **Containerization:** Docker, Docker Compose (for PostgreSQL and Redis services)
- **Version Control:** Git (implied by repository context)
- **Linting/Formatting:** ESLint (as per `frontend/eslint.config.js`), Prettier (common practice, to be confirmed if explicitly configured)
- **UI Icons:** Tabler Icons (@tabler/icons-react) for consistent iconography
- **Date Handling:** Mantine Dates (@mantine/dates) for date pickers and calendar functionality
- **Notifications:** Mantine Notifications (@mantine/notifications) for toast notifications
- **Testing:** Jest and React Testing Library (configured but not yet implemented)

## 2. Development Setup & Commands (from CLAUDE.md)

**Frontend Development:**
- Navigate to the `frontend` directory: `cd frontend`
- Install dependencies: `npm install`
- Start development server: `npm run dev` (runs on port 3000)

**Database Services (Docker):**
- Start PostgreSQL and Redis: `docker-compose up -d`
- Stop services: `docker-compose down`

## 3. Technical Constraints & Considerations

- **Initial Mock Data:** The frontend development will start with mock data and mock API functions before backend integration. This is specified in `CLAUDE.md`.
- **Type Safety:** Emphasis on TypeScript and planned tRPC integration highlights a goal for end-to-end type safety.
- **Google Suite Integration:** This is a key feature requirement, and its technical implementation details will need to be defined for the backend.
- **Port Configuration:**
    - Frontend: 3000
    - Backend API (future): 3001
    - PostgreSQL: 5436
    - Redis: 6381
- **Node.js Version:** (To be specified, ensure compatibility with dependencies like Vite, Fastify)
- **Browser Compatibility:** (To be specified, typically modern evergreen browsers for React/Vite projects)

## 4. Dependencies (Key Frontend Dependencies from `frontend/package.json` - if available, or from CLAUDE.md)

Based on the examined code and open files:
- `react` and `react-dom`: Core React libraries
- `typescript`: TypeScript language support
- `@vitejs/plugin-react`: Vite plugin for React
- `vite`: Build tool and development server
- `@mantine/core`: UI component library
- `@mantine/hooks`: Custom React hooks from Mantine
- `@mantine/dates`: Date picker components
- `@mantine/notifications`: Toast notification system
- `react-router-dom`: Routing library
- `zustand`: State management
- `@tanstack/react-query`: Data fetching and caching
- `@tabler/icons-react`: Icon library
- `eslint`: Code linting
- `jest` and `@testing-library/react`: Testing framework (configured)
- `@trpc/client` and `@trpc/server`: Type-safe API client and server

## 5. Tool Usage Patterns

- **Vite:** Used for frontend development server, HMR (Hot Module Replacement), and production builds.
- **npm:** Used for managing frontend dependencies and running scripts defined in `package.json`.
- **Docker Compose:** Used to orchestrate and manage development instances of PostgreSQL and Redis.
- **ESLint:** Used for static code analysis to find problems and enforce coding standards in the frontend.
- **TypeScript Compiler (`tsc`):** Used for type checking (as per `frontend/tsconfig.json` files).
- **React Router:** Used for client-side routing and navigation.
- **Zustand:** Used for global state management with multiple specialized stores.
- **TanStack Query:** Used for data fetching, caching, and state management for server data.
- **tRPC:** Used for type-safe API communication between frontend and backend.
- **Mantine UI:** Used for UI components, theming, and styling.
- **Jest:** Configured for unit and integration testing.