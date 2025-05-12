# Track-It Backend API

This is the backend API for the Track-It task management application. It is built with Fastify and tRPC, providing a type-safe API for the frontend.

## Tech Stack

- **Fastify**: High-performance web framework
- **tRPC**: End-to-end typesafe API
- **TypeScript**: For type safety and better development experience
- **Zod**: Runtime validation
- **JWT**: For authentication

## Getting Started

### Prerequisites

- Node.js 16+ installed
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
cd backend
npm install
```

3. Copy the `.env.example` file to `.env` and update variables as needed:

```bash
cp .env.example .env
```

### Development

Run the development server with hot-reload:

```bash
npm run dev
```

The server will start at `http://localhost:3001` by default.

### Build for Production

```bash
npm run build
npm start
```

## API Structure

The API follows the tRPC pattern with routers for different domains:

- `/trpc/tasks`: Task-related endpoints
- `/trpc/users`: User-related endpoints
- `/trpc/templates`: Template-related endpoints (coming soon)
- `/trpc/comments`: Comment-related endpoints (coming soon)
- `/trpc/attachments`: Attachment-related endpoints (coming soon)
- `/trpc/analytics`: Analytics-related endpoints (coming soon)
- `/trpc/googleIntegration`: Google integration endpoints (coming soon)
- `/trpc/notifications`: Notification-related endpoints (coming soon)

## Authentication

The API uses JWT for authentication. To access protected endpoints, include a Bearer token in the `Authorization` header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Future Enhancements

- Database integration with PostgreSQL
- Redis for caching and session management
- File upload support for attachments
- Real-time notifications with WebSockets
- Google API integration