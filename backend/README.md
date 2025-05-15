# Track-It Backend API

This is the backend API for the Track-It task management application. It is built with Fastify and tRPC, providing a type-safe API for the frontend.

## Tech Stack

- **Fastify**: High-performance web framework
- **tRPC**: End-to-end typesafe API
- **TypeScript**: For type safety and better development experience
- **Zod**: Runtime validation
- **JWT**: For authentication
- **Redis**: For caching API responses
- **PostgreSQL**: Database for persistent storage

## Getting Started

### Prerequisites

- Node.js 16+ installed
- npm or yarn
- Docker (for PostgreSQL and Redis)

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

4. Start the database services:

```bash
docker-compose up -d
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
- `/trpc/templates`: Template-related endpoints
- `/trpc/comments`: Comment-related endpoints
- `/trpc/attachments`: Attachment-related endpoints
- `/trpc/analytics`: Analytics-related endpoints
- `/trpc/googleIntegration`: Google integration endpoints
- `/trpc/notifications`: Notification-related endpoints
- `/trpc/cache-admin`: Cache administration endpoints

## Authentication

The API uses JWT for authentication. To access protected endpoints, include a Bearer token in the `Authorization` header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## API Connectivity and CORS

The backend implements several features to ensure robust connectivity with the frontend:

### Health Endpoints

- `/health`: Returns API health information (status, version, timestamp)
- `/`: Simple root endpoint that confirms the server is running

These endpoints are configured to handle CORS requests properly, allowing the frontend to check API availability.

### CORS Configuration

The API uses a robust CORS configuration that:

- Allows requests from configured origins (localhost:3000, 127.0.0.1:3000, and custom origin)
- Supports credentials for authenticated requests
- Handles preflight requests correctly
- Includes necessary headers for cross-origin requests
- Supports both regular requests and tRPC endpoints

### Error Handling

The API implements consistent error handling:

- Standardized error responses
- Proper HTTP status codes
- Detailed error messages for debugging
- Safe error sanitization for production

## Caching with Redis

The backend uses Redis for caching API responses:

- Configurable TTL (time-to-live) for cached items
- Cache invalidation on data updates
- Procedure-specific caching rules
- Cache metrics and monitoring
- Admin endpoints for cache management

For more details, see [REDIS-CACHING.md](./REDIS-CACHING.md).

## Database

The application uses PostgreSQL with Prisma ORM:

- Type-safe database queries
- Migration system for schema changes
- Seeding for development data
- Transaction support for data integrity

## Future Enhancements

- File upload support for attachments
- Real-time notifications with WebSockets
- Enhanced Google API integration
- Performance optimizations for large datasets
- Advanced analytics and reporting