#!/usr/bin/env node

/**
 * Backend Authentication Test Script
 * 
 * This script tests the backend authentication endpoints directly without going through the frontend.
 * It helps verify that the backend API is correctly implemented according to the API specification.
 */

const fetch = require('node-fetch');

// Configuration
const API_URL = 'http://localhost:3001';
const TEST_USER = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  passwordConfirm: 'password123'
};

// For testing duplicate email scenario
const DUPLICATE_USER = {
  name: 'Duplicate User',
  email: 'test@example.com', // Same email as TEST_USER
  password: 'password123',
  passwordConfirm: 'password123'
};

// ANSI color codes for prettier output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

/**
 * Helper function to print colored output
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Helper function to make API requests
 * 
 * NOTE: tRPC mutation procedures use POST method regardless of the semantic action (create/update/delete)
 * - Use GET for query procedures
 * - Use POST for mutation procedures (even for update/delete operations)
 */
async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
  const url = `${API_URL}/trpc/${endpoint}`;
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();
    return { 
      status: response.status,
      headers: response.headers,
      data: responseData
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}

/**
 * Test ping endpoint
 */
async function testPing() {
  log('\n=== Testing Ping Endpoint ===', 'cyan');
  
  const response = await apiRequest('users.ping');
  
  if (response.data && response.data.result && response.data.result.data && response.data.result.data.status === 'ok') {
    log('✓ Ping endpoint working correctly', 'green');
    return true;
  } else {
    log('✗ Ping endpoint not working correctly', 'red');
    log('Response:', 'yellow');
    console.log(response);
    return false;
  }
}

/**
 * Test registration endpoint
 */
async function testRegistration() {
  log('\n=== Testing Registration Endpoint ===', 'cyan');
  
  // Clean up in case the user already exists from previous runs
  log('Setting up test...', 'yellow');
  
  // Register the test user
  log('Registering test user...', 'yellow');
  const response = await apiRequest('users.register', 'POST', TEST_USER);
  
  if (response.data && response.data.result && response.data.result.data && response.data.result.data.id) {
    log('✓ Registration successful', 'green');
    log(`User ID: ${response.data.result.data.id}`, 'green');
    return {
      success: true,
      userId: response.data.result.data.id
    };
  } else if (response.data && response.data.error && response.data.error.message && 
             response.data.error.message.includes('Email already exists')) {
    // If user already exists from previous test runs, consider this a success
    log('ℹ User already exists, continuing with existing user', 'cyan');
    // We'll get the userId in the login test
    return {
      success: true
    };
  } else {
    log('✗ Registration failed', 'red');
    log('Response:', 'yellow');
    console.log(response);
    return {
      success: false
    };
  }
}

/**
 * Test duplicate email registration
 */
async function testDuplicateRegistration() {
  log('\n=== Testing Duplicate Email Registration ===', 'cyan');
  
  // Try to register with the same email
  log('Registering user with duplicate email...', 'yellow');
  const response = await apiRequest('users.register', 'POST', DUPLICATE_USER);
  
  // Check that it correctly returns an error
  if (response.data && response.data.error) {
    const error = response.data.error;
    
    if (
      error.message && 
      error.message.toLowerCase().includes('email already exists')
    ) {
      log('✓ Duplicate email correctly rejected with proper error message', 'green');
      return true;
    } else {
      log('✗ Duplicate email rejected but with incorrect error message', 'red');
      log('Expected error.message to contain "email already exists"', 'yellow');
      log('Actual error:', 'yellow');
      console.log(error);
      return false;
    }
  } else {
    log('✗ Duplicate email was not rejected properly', 'red');
    log('Response:', 'yellow');
    console.log(response);
    return false;
  }
}

/**
 * Test login functionality
 */
async function testLogin() {
  log('\n=== Testing Login Endpoint ===', 'cyan');
  
  // Login with the test user
  log('Logging in with test user...', 'yellow');
  const loginResponse = await apiRequest('users.login', 'POST', {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  
  if (
    loginResponse.data && 
    loginResponse.data.result && 
    loginResponse.data.result.data && 
    loginResponse.data.result.data.token
  ) {
    const user = loginResponse.data.result.data;
    log('✓ Login successful', 'green');
    log(`Token: ${user.token.substring(0, 20)}...`, 'green');
    
    // Verify the response matches the expected format
    const expectedFields = ['id', 'name', 'email', 'role', 'token'];
    const missingFields = expectedFields.filter(field => !user.hasOwnProperty(field));
    
    if (missingFields.length === 0) {
      log('✓ Login response includes all required fields', 'green');
    } else {
      log(`✗ Login response missing fields: ${missingFields.join(', ')}`, 'red');
    }
    
    return {
      success: true,
      token: user.token,
      userId: user.id
    };
  } else {
    log('✗ Login failed', 'red');
    log('Response:', 'yellow');
    console.log(loginResponse);
    return {
      success: false
    };
  }
}

/**
 * Test profile management
 */
async function testProfileManagement(token, userId) {
  log('\n=== Testing Profile Management ===', 'cyan');
  
  if (!token) {
    log('✗ Cannot test profile management without valid token', 'red');
    return false;
  }
  
  // 1. Get current user profile
  log('Getting user profile...', 'yellow');
  const profileResponse = await apiRequest('users.getCurrentUser', 'GET', null, token);
  
  if (
    profileResponse.data && 
    profileResponse.data.result && 
    profileResponse.data.result.data && 
    profileResponse.data.result.data.id === userId
  ) {
    log('✓ Get profile successful', 'green');
    
    // 2. Update user profile
    log('Updating user profile...', 'yellow');
    const updateData = {
      name: 'Updated Test User',
      preferences: {
        theme: 'dark',
        defaultView: 'kanban'
      }
    };
    
    // Use POST for tRPC mutation procedures, not PATCH
    const updateResponse = await apiRequest('users.updateProfile', 'POST', updateData, token);
    
    if (
      updateResponse.data && 
      updateResponse.data.result && 
      updateResponse.data.result.data && 
      updateResponse.data.result.data.name === updateData.name &&
      updateResponse.data.result.data.preferences &&
      updateResponse.data.result.data.preferences.theme === updateData.preferences.theme
    ) {
      log('✓ Update profile successful', 'green');
      return true;
    } else {
      log('✗ Update profile failed', 'red');
      log('Response:', 'yellow');
      console.log(updateResponse);
      return false;
    }
  } else {
    log('✗ Get profile failed', 'red');
    log('Response:', 'yellow');
    console.log(profileResponse);
    return false;
  }
}

/**
 * Run all auth tests
 */
async function runTests() {
  log('=== Backend Authentication API Tests ===', 'bright');
  
  // Store test results
  const results = {};
  let token = null;
  let userId = null;
  
  // Test the ping endpoint
  results.ping = await testPing();
  
  // Test registration
  const registrationResult = await testRegistration();
  results.registration = registrationResult.success;
  
  if (registrationResult.success) {
    userId = registrationResult.userId;
  }
  
  // Test duplicate email registration
  results.duplicateRegistration = await testDuplicateRegistration();
  
  // Test login
  const loginResult = await testLogin();
  results.login = loginResult.success;
  
  if (loginResult.success) {
    token = loginResult.token;
    userId = loginResult.userId || userId;
  }
  
  // Test profile management if login successful
  if (token && userId) {
    results.profileManagement = await testProfileManagement(token, userId);
  } else {
    results.profileManagement = false;
    log('\n✗ Skipping profile management tests due to login failure', 'yellow');
  }
  
  // Print final results
  log('\n=== Test Results ===', 'bright');
  let passCount = 0;
  let totalTests = 0;
  
  for (const [test, passed] of Object.entries(results)) {
    totalTests++;
    if (passed) {
      passCount++;
      log(`✓ ${test}: Passed`, 'green');
    } else {
      log(`✗ ${test}: Failed`, 'red');
    }
  }
  
  log(`\n${passCount} of ${totalTests} tests passed`, passCount === totalTests ? 'green' : 'red');
  
  if (passCount === totalTests) {
    log('\n🎉 All backend authentication tests passed! The API implementation matches the specification.', 'green');
  } else {
    log('\n❌ Some tests failed. See above for details.', 'red');
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`Error running tests: ${error.message}`);
  process.exit(1);
});