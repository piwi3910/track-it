# Active Context: Track-It (Frontend Scaffolding)

## 1. Current Work Focus

- **Current Task:** Building the basic frontend application shell after deleting the old frontend. This includes setting up Vite, core dependencies, directory structure, basic routing, and initial UI components (`MantineProvider`, `AppLayout`).
- **Next Major Task:** Implementing placeholder pages for core features (Kanban, Calendar, Backlog) and ensuring the basic navigation and layout are functional.

## 2. Recent Changes

- **Memory Bank Initialized:** All core Memory Bank files (`projectbrief.md`, `productContext.md`, `systemPatterns.md`, `techContext.md`, `activeContext.md`, `progress.md`) were created.
- **Frontend Directory Cleared:** Contents of `frontend/` were deleted.
- **New Frontend Project Initialized:**
    - A new Vite + React + TypeScript project was created in `frontend/` using `npm create vite@latest . -- --template react-ts`.
    - Default npm dependencies were installed (`npm install`).
    - Core project dependencies were installed: `@mantine/core`, `@mantine/hooks`, `react-router-dom`, `zustand`, `@tanstack/react-query`.
- **Directory Structure Created:** Standard project directories (`components`, `features`, `hooks`, `api`, `utils`, `types`, `pages`, `layouts`, `context`) were created within `frontend/src/`.
- **Mantine & Router Setup in `main.tsx`:**
    - `frontend/src/main.tsx` updated to include `MantineProvider` (with a basic theme and core styles import) and `BrowserRouter`.
    - Resolved an issue with `MantineProvider` props by consulting documentation via Context7 MCP.
- **Basic App Shell Created:**
    - `frontend/src/layouts/AppLayout.tsx` created with a basic `AppShell` structure (header, navbar, main content area with `Outlet`).
    - `frontend/src/pages/DashboardPage.tsx` created as a placeholder page.
    - `frontend/src/App.tsx` updated to implement basic routing using `Routes`, `Route`, and `Navigate`, rendering `AppLayout` and `DashboardPage`.

- **Error Resolution (Module Imports & TypeScript):**
    - Implemented path aliasing (`@` pointing to `src/`) in `vite.config.ts` and `tsconfig.app.json`.
    - Installed `@types/node` to resolve TypeScript errors in `vite.config.ts`.
    - Updated import paths in `TaskModal.tsx` and `DashboardPage.tsx` to use the `@` alias.
    - Addressed ESLint `any` warnings and used type-only imports where necessary.
    - Resolved persistent "Failed to resolve import" and TypeScript errors for Mantine component props by simplifying `tsconfig.app.json` (removing `allowImportingTsExtensions`, `verbatimModuleSyntax`, `erasableSyntaxOnly`). The development server is now running without these errors.

## 3. Next Steps

1.  Update `memory-bank/progress.md` to reflect the current state and error resolution.
2.  Create placeholder components for other core pages: `KanbanPage.tsx`, `CalendarPage.tsx`, `BacklogPage.tsx`.
4.  Add navigation links to these pages in `AppLayout.tsx`.
5.  Begin implementing basic UI elements for the `DashboardPage` using Mantine components.
6.  Set up Zustand store and TanStack Query client if needed for early features.

## 4. Active Decisions & Considerations

- **Iterative Development:** Building the frontend step-by-step, starting with the core structure and then adding features.
- **Memory Bank Updates:** Regularly updating the Memory Bank to maintain an accurate record of progress and context.
- **Dependency Management:** Using npm for frontend package management.
- **Error Resolution:** Using available tools (like Context7 for documentation) to resolve issues encountered during development (e.g., `MantineProvider` props).

## 5. Important Patterns & Preferences (Reinforced)

- **Structured Documentation:** Continuing to follow the Memory Bank file structure.
- **Tool-Assisted Problem Solving:** Leveraging MCP tools like Context7 for information gathering.
- **Adherence to `CLAUDE.md`:** Using `CLAUDE.md` and the derived Memory Bank files as the guide for technology choices and application structure.

## 6. Learnings & Project Insights (Ongoing)

- The `MantineProvider` API for global styles has evolved; direct props like `withGlobalStyles` are no longer used, relying instead on CSS imports and theme configuration.
- Initializing a Vite project in a non-empty directory (even if only hidden files remain) prompts the user, but can proceed by ignoring existing files.
- The process of clearing, re-initializing, and setting up the basic structure of a React application involves several distinct steps (package management, directory creation, core file modification).
- Certain newer TypeScript compiler options (like `verbatimModuleSyntax` or `allowImportingTsExtensions`) can sometimes lead to unexpected module resolution or type interpretation issues with Vite and UI libraries like Mantine. Simplifying `tsconfig.app.json` can be a valid troubleshooting step.
- Path aliasing (`@/`) is a good practice for cleaner and more robust import paths.

[2025-05-21 19:29:11] - Added development process rules to systemPatterns.md to establish a clear workflow for future development.