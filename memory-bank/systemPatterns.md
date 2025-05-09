# System Patterns: Track-It

## 1. System Architecture Overview

Track-It is designed as a client-server application.

- **Frontend:** A single-page application (SPA) built with React and Vite, responsible for user interface and user interaction. It will initially use mock data and then transition to consuming a backend API.
- **Backend (Planned):** A Fastify server providing a tRPC API. It will handle business logic, data persistence, and integration with external services like Google Suite.
- **Database (Planned):** PostgreSQL will be used for storing application data (tasks, users, etc.).
- **Caching (Planned):** Redis will be employed for caching frequently accessed data to improve performance.
- **Containerization:** Docker (via `docker-compose.yml`) is used to manage development services like PostgreSQL and Redis.

## 2. Key Technical Decisions (from CLAUDE.md and initial setup)

**Frontend:**
- **Build Tool:** Vite for fast development and optimized builds.
- **UI Framework/Library:** React with TypeScript for a component-based architecture and type safety.
- **Component Library:** Mantine UI for a pre-built set of accessible and themeable components.
- **Routing:** React Router for client-side navigation.
- **State Management:** Zustand for a minimalistic and unopinionated global state management solution.
- **Data Fetching & Caching:** TanStack Query (React Query) for managing server state, caching, and background updates.
- **API Integration:** Initially mock APIs, with a plan to migrate to tRPC for end-to-end type-safe API communication with the backend.

**Backend (Planned):**
- **Framework:** Fastify for a high-performance, low-overhead Node.js web framework.
- **API:** tRPC to enable type-safe API routes and data exchange between frontend and backend.
- **Database:** PostgreSQL, a powerful open-source relational database.
- **Caching:** Redis, an in-memory data structure store, used as a cache.

## 3. Design Patterns in Use (or planned)

**Frontend:**
- **Component-Based Architecture:** Core to React, breaking down the UI into reusable components.
- **Feature-Based Directory Structure:** As outlined in `CLAUDE.md` (`/src/features`, `/src/components`, etc.) to organize code by functionality.
- **Hooks:** Custom React hooks (`/src/hooks`) to encapsulate and reuse stateful logic.
- **Context API:** (`/src/context`) For managing global concerns like theming or authentication state if Zustand isn't sufficient for all cases.
- **Provider Pattern:** Used with Mantine UI (ThemeProvider) and potentially for other global contexts.
- **Container/Presentational Components (Implicit):** Though not strictly enforced, features and pages might act as containers, while components in `/src/components` are more presentational.

**Backend (Planned):**
- **Service Layer:** (Anticipated) To separate business logic from API route handlers.
- **Repository Pattern:** (Anticipated) To abstract data access logic.

## 4. Component Relationships & Critical Implementation Paths

**Frontend:**
- `main.tsx` is the entry point, rendering the root `App.tsx` component.
- `App.tsx` likely sets up routing (React Router) and global providers (Mantine, Zustand, TanStack Query).
- `AppLayout.tsx` will define the main structure of the application (e.g., header, sidebar, content area).
- Page components (`/src/pages`) are rendered by the router and compose various feature components (`/src/features`) and shared components (`/src/components`).
- Feature components encapsulate specific functionalities (e.g., `KanbanBoard.tsx`, `TaskForm.tsx`).
- Data fetching logic will primarily reside within feature components or custom hooks using TanStack Query.
- State management with Zustand will provide global state accessible by any component.

**Critical Paths:**
1.  **Task Creation/Editing Flow:** Involves forms, state management, and API interaction (initially mock).
2.  **Data Display in Different Views:** Rendering tasks correctly in the Dashboard, Kanban, Calendar, and Backlog views.
3.  **State Synchronization:** Ensuring data consistency across different views and components.
4.  **API Integration (Future):** Transitioning from mock APIs to a live tRPC backend.

## 5. Data Flow

**Frontend (Current & Planned):**
1.  **User Interaction:** User interacts with UI elements (e.g., clicks a button, fills a form).
2.  **Component Handler:** Event handlers in React components trigger actions.
3.  **State Update (Zustand/Local State):** Local component state or global Zustand store is updated.
4.  **API Call (TanStack Query):**
    *   For reads: TanStack Query fetches data (from mock API or future tRPC endpoint), caches it, and provides it to components.
    *   For writes: TanStack Query sends mutations (to mock API or future tRPC endpoint) and handles cache invalidation/updates.
5.  **UI Re-render:** React re-renders components based on state and prop changes.

**Backend (Planned):**
1.  **API Request (tRPC):** Backend receives a request from the frontend.
2.  **Controller/Router Handler:** tRPC router directs the request to the appropriate handler.
3.  **Service Layer:** Business logic is executed.
4.  **Data Access (Repository):** Interacts with PostgreSQL (and Redis for caching).
5.  **API Response:** Backend sends a response back to the frontend.