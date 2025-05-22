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
- **Context API:** (`/src/context`) For managing global concerns like theming or authentication state alongside Zustand for more complex state management.
- **Provider Pattern:** Implemented with multiple providers (ThemeProvider, ApiProvider, AuthProvider, AppProvider, NotificationProvider, GoogleProvider) to provide global functionality and state.
- **Container/Presentational Components:** Pages act as containers, while components in `/src/components` are more presentational and reusable.
- **Compound Components:** Complex UI elements like TaskModal use compound component patterns to organize related functionality.
- **Render Props & Conditional Rendering:** Used extensively for dynamic UI based on state (e.g., task status, authentication state).
- **Custom Hooks for API Integration:** Using hooks to encapsulate API calls and data fetching logic.
- **Protected Routes Pattern:** Using higher-order components to protect routes that require authentication.
- **Global Error Handling:** Implementing error boundaries and global error handlers for consistent error management.

**Backend (Planned):**
- **Service Layer:** (Anticipated) To separate business logic from API route handlers.
- **Repository Pattern:** (Anticipated) To abstract data access logic.

## 4. Component Relationships & Critical Implementation Paths

**Frontend:**
- `main.tsx` is the entry point, rendering the root `App.tsx` component with all necessary providers.
- `App.tsx` sets up routing (React Router) with protected and public routes.
- `AppLayout.tsx` defines the main structure of the application with header, sidebar, and content area.
- Page components (`/src/pages`) are rendered by the router and compose various feature components and shared components.
- Components in `/src/components` provide reusable UI elements and functionality.
- Data fetching logic resides within custom hooks and API client using TanStack Query.
- State management with Zustand provides global state through multiple specialized stores.
- Context providers wrap the application to provide global functionality and state.

**Critical Paths:**
1.  **Authentication Flow:** Login, session management, and protected routes.
2.  **Task Management Lifecycle:** Creation, editing, status updates, and deletion of tasks.
3.  **Data Display in Different Views:** Rendering tasks correctly in the Dashboard, Kanban, Calendar, and Backlog views.
4.  **State Synchronization:** Ensuring data consistency across different views and components.
5.  **Error Handling:** Graceful handling of API errors, authentication issues, and unexpected exceptions.
6.  **API Integration (Future):** Transitioning from mock APIs to a live tRPC backend.

## 5. Data Flow

**Frontend (Current & Implemented):**
1.  **User Interaction:** User interacts with UI elements (e.g., clicks a button, fills a form).
2.  **Component Handler:** Event handlers in React components trigger actions.
3.  **State Update (Zustand/Local State):** Local component state or global Zustand store is updated.
4.  **API Call (TanStack Query):**
    *   For reads: TanStack Query fetches data (from mock API or future tRPC endpoint), caches it, and provides it to components.
    *   For writes: TanStack Query sends mutations (to mock API or future tRPC endpoint) and handles cache invalidation/updates.
5.  **UI Re-render:** React re-renders components based on state and prop changes.
6.  **Error Handling:** Global error handlers catch and process any errors that occur during the flow.
7.  **Notification:** User is notified of the result of their action through the notification system.

**Backend (Planned):**
1.  **API Request (tRPC):** Backend receives a request from the frontend.
2.  **Controller/Router Handler:** tRPC router directs the request to the appropriate handler.
3.  **Service Layer:** Business logic is executed.
4.  **Data Access (Repository):** Interacts with PostgreSQL (and Redis for caching).
5.  **API Response:** Backend sends a response back to the frontend.

## 6. Development Process

✅ 1. Plan the App (Before Coding)

Deliverables:
	•	Feature list (MVP first!)
	•	Entity-relationship diagram (ERD)
	•	API design (endpoints or tRPC router structure)
	•	User flow diagrams (e.g., registration → login → dashboard)

Tools: Whimsical, Excalidraw, dbdiagram.io

⸻

✅ 2. Design Frontend Contracts (API-first or Schema-first)
	•	Define your zod schemas for both frontend and backend validation.
	•	Generate mock data that fits these schemas to use before backend is ready.
	•	Define your tRPC router interface and expected responses.

Tip: Use zod + @trpc/server + @trpc/client to enforce contracts.

⸻

✅ 3. Build Frontend with Mocked API
	•	Use tools like MSW (Mock Service Worker) to simulate API calls.
	•	Create reusable UI components using a consistent design system (e.g., Shadcn/UI, Mantine).
	•	Focus only on UI + logic, not backend connectivity yet.

⸻

✅ 4. Build Backend with Matching Contracts
	•	Scaffold Express + tRPC backend using the same Zod schemas.
	•	Implement each router in isolation using the frontend's expected shape.
	•	Use Prisma for database integration, matching your earlier ERD.

Tip: You can expose REST endpoints alongside tRPC for other integrations.

⸻

✅ 5. Test Integration Between Frontend and Backend
	•	Swap MSW with live tRPC calls.
	•	Start with one full flow (e.g., user registration → login).
	•	Log and inspect request/response payloads to debug mismatches.

⸻

✅ 6. Iterate and Add More Features
	•	Use Git branches for each new feature or route.
	•	Add unit and integration tests with Vitest (for frontend) and Jest or Supertest (for backend).
	•	Start working on deployment once the flows are stable.

⸻

✅ 7. Automate & Deploy
	•	Dockerize both backend and frontend.
	•	Use a CI pipeline to lint/test/build.
	•	Deploy to your local K8s cluster, or something like Railway/Render/VPS.

⸻

✅ Bonus: If You're Using AI to Help Build

Improve your prompts:
	•	Always provide: API design, Zod schema, feature goal, and existing file structure.
	•	Tell it to reuse existing schema instead of inventing new ones.
	•	Ask for unit tests with example inputs and outputs.