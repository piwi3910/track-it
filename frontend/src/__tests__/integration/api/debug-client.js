/**
 * Debug script for testing tRPC client integration with backend
 */
import { createTRPCClient } from '@trpc/client';
import fetch from 'cross-fetch';

// Configuration
const BASE_URL = 'http://localhost:3001/trpc';

// Mock localStorage for testing
const storage = {};
const localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, value) => { storage[key] = value; },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(key => delete storage[key]); }
};

// Create a debug client for testing the registration flow
const createClient = () => {
  return createTRPCClient({
    url: BASE_URL,
    fetch: (url, options = {}) => {
      // Log request details for debugging
      console.log('Request URL:', url);
      console.log('Request Options:', JSON.stringify(options, null, 2));
      
      // Add auth header if token exists
      const headers = { ...options.headers };
      const token = localStorage.getItem('token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      // Make the request
      return fetch(url, {
        ...options,
        headers
      }).then(response => {
        // Log the response
        console.log('Response Status:', response.status);
        return response.text().then(text => {
          try {
            const data = JSON.parse(text);
            console.log('Response Data:', JSON.stringify(data, null, 2));
            
            // Re-create response with parsed JSON
            return new Response(JSON.stringify(data), {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers
            });
          } catch {
            console.log('Response Text:', text);
            return response;
          }
        });
      });
    }
  });
};

// Test registration flow
const testRegistration = async () => {
  console.log('\n=== Testing Registration ===');
  
  const client = createClient();
  const timestamp = Date.now();
  
  try {
    // Register a new user
    const userData = {
      name: `Test User ${timestamp}`,
      email: `testuser${timestamp}@example.com`,
      password: 'Password123!',
      passwordConfirm: 'Password123!'
    };
    
    console.log('Registering user:', userData.email);
    const result = await client.users.register.mutate(userData);
    console.log('Registration successful:', result);
    
    // Try to register the same user again
    console.log('\nTrying to register the same user again...');
    try {
      await client.users.register.mutate(userData);
      console.log('ERROR: Duplicate registration succeeded when it should have failed');
    } catch (error) {
      console.log('Expected error received for duplicate registration:', error.message);
    }
    
    return userData;
  } catch (error) {
    console.error('Registration test failed:', error);
    throw error;
  }
};

// Test login flow
const testLogin = async (userData) => {
  console.log('\n=== Testing Login ===');
  
  const client = createClient();
  
  try {
    // Login with the registered user
    console.log('Logging in with:', userData.email);
    const loginResult = await client.users.login.mutate({
      email: userData.email,
      password: userData.password
    });
    
    console.log('Login successful');
    console.log('Token received:', loginResult.token ? `${loginResult.token.substring(0, 20)}...` : 'No token');
    
    // Store the token
    if (loginResult.token) {
      localStorage.setItem('token', loginResult.token);
    }
    
    return loginResult;
  } catch (error) {
    console.error('Login test failed:', error);
    throw error;
  }
};

// Test authenticated endpoints
const testAuthenticatedEndpoints = async () => {
  console.log('\n=== Testing Authenticated Endpoints ===');
  
  const client = createClient();
  
  try {
    // Get current user profile
    console.log('Getting current user profile...');
    const profileResult = await client.users.getCurrentUser.query();
    console.log('Profile result:', profileResult);
    
    // Update user profile
    console.log('\nUpdating user profile...');
    const updateResult = await client.users.updateProfile.mutate({
      name: `Updated User ${Date.now()}`
    });
    console.log('Update result:', updateResult);
    
    return { profile: profileResult, update: updateResult };
  } catch (error) {
    console.error('Authenticated endpoint test failed:', error);
    throw error;
  }
};

// Run the tests
const runTests = async () => {
  try {
    // First test registration
    const userData = await testRegistration();
    
    // Then test login
    const loginResult = await testLogin(userData);
    
    // Finally test authenticated endpoints
    if (loginResult.token) {
      await testAuthenticatedEndpoints();
    }
    
    console.log('\n=== All Tests Completed ===');
  } catch (error) {
    console.error('Test suite failed:', error);
  }
};

runTests();