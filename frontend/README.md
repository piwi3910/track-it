# Track-It Frontend

Frontend application for the Track-It task management system.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Architecture

- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool
- **Mantine**: UI component library
- **TanStack Query**: Data fetching and caching
- **tRPC**: Type-safe API communication

## API Connectivity

The application implements a robust API connectivity system with the following features:

### API Availability Checking

The frontend checks for API availability on initial load and when connectivity issues occur. Key features include:

- **Backoff Strategy**: Implements exponential backoff between connection attempts
- **Maximum Attempts**: Stops checking after a configurable number of failed attempts
- **Timeout Handling**: Sets timeouts for health checks to avoid long waits
- **Error Tracking**: Tracks and displays recent errors in the API status UI

### Mock API Fallback

When the API is unavailable, users can switch to a mock API mode:

- **Seamless Switching**: Toggle between real and mock API
- **Visual Indicator**: Badge displays current API mode (Mock/Connected/Disconnected)
- **Error Information**: Shows error details and connection attempt status

### Error Handling

The application implements comprehensive error handling:

- **Retry Logic**: Automatically retries failed API calls with configurable attempts
- **Error Classification**: Categorizes errors (network, auth, server, etc.)
- **Centralized Handling**: Uses custom event system to propagate error information
- **User Feedback**: Appropriate error messaging based on error type

### Test Scripts

Two test scripts are included to verify API connectivity features:

- `scripts/test-api-availability.js`: Tests API health check functionality
- `scripts/test-mock-api-switch.js`: Tests switching between real and mock API

Run these scripts with:

```bash
# Test API availability
node scripts/test-api-availability.js

# Test mock API switching (requires running frontend)
node scripts/test-mock-api-switch.js
```

## CORS Configuration

The backend and frontend are configured to handle CORS properly:

- Backend allows requests from frontend origins
- Health check endpoints handle preflight requests
- API requests include appropriate headers
- Credentials handling is configured correctly

## Data Flow

1. Components use the tRPC client to make API calls
2. API calls are wrapped in the `apiHandler` function for error handling
3. Connection issues trigger API availability checks
4. API status is stored in the ApiStore for global access
5. UI components display API status and allow switching to mock mode

## Components

- **ApiStatus**: Shows API connection status and allows switching to mock API
- **AuthErrorHandler**: Handles authentication errors
- **TaskCard**: Displays task information
- **TaskModal**: Edit task details
- **GlobalSearch**: Search across tasks and templates

## Original Vite Template Information

This project was built using the React + TypeScript + Vite template.

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

For more information on expanding the ESLint configuration, see the [Vite documentation](https://vitejs.dev/guide/).