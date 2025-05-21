# Track-It Backend Express Implementation

This is an Express-based implementation of the Track-It backend API. It replaces the previous Fastify implementation while providing the same functionality with improved stability.

## Features

- **Express Framework**: Robust, mature web framework for Node.js
- **tRPC Integration**: End-to-end type-safety with Express adapter
- **JWT Authentication**: Secure authentication with express-jwt middleware
- **Error Handling**: Consistent error handling and formatting
- **Mock Data**: Ready-to-use mock data for testing
- **Prisma Database**: ORM for database access (when connected to a real database)
- **Redis Caching**: Optional caching support

## API Endpoints

The API provides the following tRPC routers:

- **Users**: Authentication, registration, and user profile management
- **Tasks**: Task CRUD operations, search, and task templates
- **Templates**: Task templates for quick task creation
- **Comments**: Task comments and discussions
- **Attachments**: File attachments for tasks
- **Notifications**: User notifications
- **Google Integration**: Calendar, Tasks, and Drive integration
- **Analytics**: Task completion statistics and reporting

## Project Structure

```
/backend-fresh
├── prisma/                 # Prisma ORM schema and migrations
├── scripts/                # Debug and utility scripts
├── src/
│   ├── cache/              # Redis caching implementation
│   ├── config/             # Environment config
│   ├── db/                 # Database access
│   ├── middleware/         # Express middleware
│   ├── routers/            # tRPC routers
│   │   ├── users.router.ts
│   │   ├── tasks.router.ts
│   │   ├── templates.router.ts
│   │   ├── comments.router.ts
│   │   ├── attachments.router.ts
│   │   ├── notifications.router.ts
│   │   ├── google-integration.router.ts
│   │   └── analytics.router.ts
│   ├── trpc/               # tRPC configuration
│   │   ├── context.ts      # Request context
│   │   ├── router.ts       # Router implementation
│   │   └── trpc.ts         # tRPC initialization
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   │   └── error-handler.ts # Error handling utilities
│   └── server.ts           # Express app and server
└── .env                    # Environment variables
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (optional for development with mock data)
- Redis server (optional for caching)

### Environment Variables

Create a `.env` file with the following variables:

```
NODE_ENV=development
HOST=localhost
PORT=3001
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
REDIS_HOST=localhost
REDIS_PORT=6381
REDIS_PASSWORD=
REDIS_TTL=3600
```

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client (if using a database)
npm run db:generate

# Run database migrations (if using a database)
npm run db:migrate

# Seed the database (if using a database)
npm run db:seed
```

### Running the Server

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## REST Endpoints vs tRPC

This implementation uses tRPC for all API endpoints. The endpoints are accessible through the tRPC client or with direct HTTP requests:

- tRPC endpoint base: `http://localhost:3001/trpc`
- Public procedures (no auth): `users.login`, `users.register`, etc.
- Protected procedures (require auth): All other endpoints

Example REST-like usage for login:
```
POST http://localhost:3001/trpc/users.login
Content-Type: application/json

{
  "email": "demo@example.com",
  "password": "password123"
}
```

## Authentication

Authentication uses JWT tokens:

1. Login to get a token: `POST /trpc/users.login`
2. Include the token in the Authorization header for protected routes:
   ```
   Authorization: Bearer your-jwt-token
   ```

## Error Handling

Standardized error responses follow this structure:

```json
{
  "message": "Error message",
  "code": "ERROR_CODE",
  "data": {
    "httpStatus": 400,
    "zodError": {},
    "appError": {}
  }
}
```

## Caching

Redis is used for caching frequently accessed data:

- Task lists
- User profiles
- Templates

## Debugging

The project includes debug scripts for testing:

- `scripts/debug-login.js`: Test login functionality
- `scripts/debug-auth-endpoints.js`: Test authenticated endpoints

Run with:
```bash
node scripts/debug-login.js
node scripts/debug-auth-endpoints.js
```

## Mock Data

The implementation includes mock data for development:

- **Users**: Admin, regular, and demo users
- **Tasks**: Sample tasks with different statuses and properties
- **Templates**: Predefined task templates
- **Comments**: Task discussions
- **Attachments**: Mock file attachments
- **Notifications**: Sample user notifications
- **Google Integration**: Mock Google services data
- **Analytics**: Sample analytics data

The demo user login credentials:
- Email: `demo@example.com`
- Password: `password123`