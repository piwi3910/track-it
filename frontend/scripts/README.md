# Test Scripts

This directory contains various test scripts for testing the application.

## Available Scripts

### `test-login.js`

Tests the login functionality with mock data.

```bash
node scripts/test-login.js
```

### `test-live-login.js`

Tests the login functionality with the live backend server using tRPC.

```bash
# First ensure the backend server is running
cd ../backend && npm run dev

# In another terminal, run the test script
cd ../frontend && node scripts/test-live-login.js
```

### `test-live-registration.js`

Tests the user registration functionality with the live backend server using tRPC.

```bash
# First ensure the backend server is running
cd ../backend && npm run dev

# In another terminal, run the test script
cd ../frontend && node scripts/test-live-registration.js
```

### `test-api-availability.js`

Tests the API availability.

```bash
node scripts/test-api-availability.js
```

### `test-mock-api-switch.js`

Tests the mock API switch functionality.

```bash
node scripts/test-mock-api-switch.js
```

## Running Tests

To run these scripts, ensure you have Node.js installed and have installed the project dependencies:

```bash
npm install
```

Then you can run any of the test scripts:

```bash
node scripts/<script-name>.js
```

## Troubleshooting

If you encounter any issues when running the test scripts, please check the following:

1. Make sure the backend server is running (for live tests)
2. Make sure you've installed the dependencies
3. Check the console logs for any error messages

If you're still having issues, please open an issue in the GitHub repository.