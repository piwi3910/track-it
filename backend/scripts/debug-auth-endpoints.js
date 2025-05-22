// ESM module for node-fetch
import fetch from 'node-fetch';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Base URL for API
const API_URL = 'http://localhost:3001/trpc';

// Test user data
const TEST_USER = {
  name: 'Debug Test User',
  email: 'debug-test@example.com',
  password: 'password123',
  passwordConfirm: 'password123'
};

// Login credentials
const LOGIN_CREDENTIALS = {
  email: 'debug-test@example.com',
  password: 'password123'
};

// Helper to make tRPC HTTP requests
async function tRPCRequest(procedure, input, token = null) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let url = `${API_URL}/${procedure}`;
    let method = 'GET';
    let body = null;

    // For mutations (POST)
    if (['register', 'login', 'updateProfile'].includes(procedure.split('.')[1])) {
      method = 'POST';
      body = JSON.stringify({ json: input });
    } else if (input) {
      // For queries with input (GET with parameters)
      url += `?input=${encodeURIComponent(JSON.stringify(input))}`;
    }

    console.log(`${colors.cyan}${colors.bright}REQUEST:${colors.reset} ${method} ${url}`);
    if (body) console.log(`${colors.cyan}Body:${colors.reset}`, body);
    
    const response = await fetch(url, {
      method,
      headers,
      body
    });

    const data = await response.json();
    
    console.log(`${colors.cyan}Response status:${colors.reset}`, response.status);
    console.log(`${colors.cyan}Response data:${colors.reset}`, JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    // Extract the server error message if possible
    let errorMessage = 'Request failed';
    if (error.response) {
      console.log(`${colors.red}ERROR STATUS:${colors.reset}`, error.response.status);
      console.log(`${colors.red}ERROR DATA:${colors.reset}`, JSON.stringify(error.response.data, null, 2));
      if (error.response.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else {
        errorMessage = `Server returned ${error.response.status}`;
      }
    } else if (error.request) {
      errorMessage = 'No response received from server';
      console.log(`${colors.red}ERROR:${colors.reset} No response received`);
    } else {
      errorMessage = error.message;
      console.log(`${colors.red}ERROR:${colors.reset}`, error.message);
    }
    
    throw new Error(errorMessage);
  }
}

// Add a ping endpoint for connectivity testing
async function testPingEndpoint() {
  console.log(`\n${colors.blue}${colors.bright}TESTING PING ENDPOINT${colors.reset}`);
  try {
    const response = await tRPCRequest('users.ping');
    console.log(`${colors.green}✓ Ping successful:${colors.reset}`, JSON.stringify(response, null, 2));
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Ping failed:${colors.reset}`, error.message);
    console.log('Note: users.ping endpoint may not exist yet');
    return false;
  }
}

// Test user registration
async function testUserRegistration() {
  console.log(`\n${colors.blue}${colors.bright}TESTING USER REGISTRATION${colors.reset}`);
  try {
    const response = await tRPCRequest('users.register', TEST_USER);
    console.log(`${colors.green}✓ Registration successful:${colors.reset}`, JSON.stringify(response, null, 2));
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Registration failed:${colors.reset}`, error.message);
    // If the error is because the user already exists, that's expected for repeated runs
    if (error.message.includes('already exists')) {
      console.log(`${colors.yellow}(This is expected if the user already exists)${colors.reset}`);
      return false;
    }
    return false;
  }
}

// Test duplicate email rejection
async function testDuplicateEmailRejection() {
  console.log(`\n${colors.blue}${colors.bright}TESTING DUPLICATE EMAIL REJECTION${colors.reset}`);
  try {
    const response = await tRPCRequest('users.register', TEST_USER);
    console.log(`${colors.red}✗ Failed: System accepted duplicate email${colors.reset}`, JSON.stringify(response, null, 2));
    return false;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`${colors.green}✓ Success: Duplicate email rejected:${colors.reset}`, error.message);
      return true;
    } else {
      console.log(`${colors.red}✗ Failed with unexpected error:${colors.reset}`, error.message);
      return false;
    }
  }
}

// Test user login
async function testUserLogin() {
  console.log(`\n${colors.blue}${colors.bright}TESTING USER LOGIN${colors.reset}`);
  try {
    const response = await tRPCRequest('users.login', LOGIN_CREDENTIALS);
    console.log(`${colors.green}✓ Login successful${colors.reset}`);
    
    // Check if response has expected fields
    // Extracting token from different possible response formats
    let token = null;
    
    if (response?.result?.token) {
      token = response.result.token;
    } else if (response?.result?.data?.token) {
      token = response.result.data.token;
    }
    
    if (token) {
      console.log(`${colors.green}✓ Token received${colors.reset}`);
      return token;
    } else {
      console.log(`${colors.red}✗ No token in response${colors.reset}`);
      return null;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Login failed:${colors.reset}`, error.message);
    return null;
  }
}

// Test getting current user profile
async function testGetCurrentUser(token) {
  console.log(`\n${colors.blue}${colors.bright}TESTING GET CURRENT USER${colors.reset}`);
  if (!token) {
    console.log(`${colors.yellow}Skipping - No authentication token available${colors.reset}`);
    return false;
  }
  
  try {
    const response = await tRPCRequest('users.getCurrentUser', null, token);
    console.log(`${colors.green}✓ Got user profile:${colors.reset}`, JSON.stringify(response?.result?.data || response?.result, null, 2));
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Failed to get user profile:${colors.reset}`, error.message);
    return false;
  }
}

// Test profile update
async function testUpdateProfile(token) {
  console.log(`\n${colors.blue}${colors.bright}TESTING PROFILE UPDATE${colors.reset}`);
  if (!token) {
    console.log(`${colors.yellow}Skipping - No authentication token available${colors.reset}`);
    return false;
  }
  
  const updateData = {
    name: 'Updated Debug User',
    preferences: {
      theme: 'dark',
      defaultView: 'kanban'
    }
  };
  
  try {
    const response = await tRPCRequest('users.updateProfile', updateData, token);
    console.log(`${colors.green}✓ Profile updated:${colors.reset}`, JSON.stringify(response?.result?.data || response?.result, null, 2));
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Failed to update profile:${colors.reset}`, error.message);
    return false;
  }
}

// Main function to run all tests
async function runTests() {
  console.log(`${colors.bright}${colors.blue}===== AUTH ENDPOINTS DEBUG SCRIPT =====${colors.reset}`);
  console.log(`Testing against: ${API_URL}`);
  
  try {
    // Check server connectivity first
    await testPingEndpoint();
    
    // Test registration
    const registrationSuccessful = await testUserRegistration();
    
    // Test duplicate email
    await testDuplicateEmailRejection();
    
    // Test login - using the demo user credentials as they should always exist
    const loginTestUser = {
      email: "demo@example.com",
      password: "password123"
    };
    
    const token = await testUserLogin(loginTestUser);
    
    if (token) {
      // Test authenticated endpoints
      await testGetCurrentUser(token);
      await testUpdateProfile(token);
    }
    
    console.log(`\n${colors.bright}${colors.blue}===== DEBUG SCRIPT COMPLETE =====${colors.reset}`);
  } catch (error) {
    console.log(`\n${colors.red}${colors.bright}ERROR:${colors.reset}`, error.message);
  }
}

// Run the tests
runTests();