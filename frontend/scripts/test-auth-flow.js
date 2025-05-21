// Test Authentication Flow
// This script tests the complete authentication flow from registration to profile management

import crossFetch from 'cross-fetch';
import { createTRPCClient, httpBatchLink } from '@trpc/client';

// Mock global objects for testing
global.fetch = crossFetch;

// Base URL for the API
const BASE_URL = 'http://localhost:3001/trpc';

// Create tRPC client for testing with token support
const createClient = (token = null) => {
  return createTRPCClient({
    links: [
      httpBatchLink({
        url: BASE_URL,
        // Important: disable batching for tests
        batch: false,
        fetch: (url, options = {}) => {
          const fetchOptions = { ...options } || {};
          const headers = fetchOptions.headers || {};
          
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          
          fetchOptions.headers = headers;
          return crossFetch(url, fetchOptions);
        }
      }),
    ],
  });
};

// Generate a unique test user
const generateTestUser = () => {
  const timestamp = Date.now();
  return {
    name: `Test User ${timestamp}`,
    email: `testuser${timestamp}@example.com`,
    password: 'Password123!',
    passwordConfirm: 'Password123!'
  };
};

// Run the authentication flow test
async function testAuthFlow() {
  console.log('=== Testing Complete Authentication Flow ===');
  let token = null;
  let userId = null;
  
  try {
    const testUser = generateTestUser();
    console.log(`Using test user: ${testUser.name} (${testUser.email})`);
    
    // 1. REGISTRATION
    console.log('\n--- Step 1: Registration ---');
    let client = createClient();
    
    try {
      const registrationResult = await client.users.register.mutate(testUser);
      console.log('✓ Registration successful:', registrationResult);
      userId = registrationResult.id;
    } catch (error) {
      console.error('✗ Registration failed:', error);
      return;
    }
    
    // 2. LOGIN
    console.log('\n--- Step 2: Login ---');
    
    try {
      const loginResult = await client.users.login.mutate({
        email: testUser.email,
        password: testUser.password
      });
      
      console.log('✓ Login successful');
      console.log('User data:', {
        id: loginResult.id,
        name: loginResult.name,
        email: loginResult.email,
        role: loginResult.role
      });
      console.log('Token received:', loginResult.token.substring(0, 20) + '...');
      
      token = loginResult.token;
    } catch (error) {
      console.error('✗ Login failed:', error);
      return;
    }
    
    // 3. GET PROFILE
    console.log('\n--- Step 3: Get User Profile ---');
    
    // Create a new client with the token
    client = createClient(token);
    
    try {
      const profileResult = await client.users.getCurrentUser.query();
      console.log('✓ Get profile successful');
      console.log('Profile data:', {
        id: profileResult.id,
        name: profileResult.name,
        email: profileResult.email,
        role: profileResult.role,
        preferences: profileResult.preferences
      });
    } catch (error) {
      console.error('✗ Get profile failed:', error);
      return;
    }
    
    // 4. UPDATE PROFILE
    console.log('\n--- Step 4: Update User Profile ---');
    
    const updateData = {
      name: `Updated ${testUser.name}`,
      preferences: {
        theme: 'dark',
        defaultView: 'kanban'
      }
    };
    
    try {
      const updateResult = await client.users.updateProfile.mutate(updateData);
      console.log('✓ Update profile successful');
      console.log('Updated profile data:', {
        id: updateResult.id,
        name: updateResult.name,
        preferences: updateResult.preferences
      });
      
      // Verify the update worked
      if (updateResult.name === updateData.name && 
          updateResult.preferences.theme === updateData.preferences.theme &&
          updateResult.preferences.defaultView === updateData.preferences.defaultView) {
        console.log('✓ Profile update correctly applied and returned');
      } else {
        console.error('✗ Profile update didn\'t match expected data');
      }
    } catch (error) {
      console.error('✗ Update profile failed:', error);
      return;
    }
    
    // 5. TEST UNAUTHORIZED ACCESS
    console.log('\n--- Step 5: Test Unauthorized Access ---');
    
    // Create a client without token
    const unauthClient = createClient();
    
    try {
      await unauthClient.users.getCurrentUser.query();
      console.error('✗ Unauthorized access was allowed!');
    } catch (error) {
      console.log('✓ Unauthorized access correctly rejected:', error.message);
    }
    
    console.log('\n=== Authentication Flow Test Completed Successfully ===');
    
  } catch (error) {
    console.error('Test failed with unexpected error:', error);
  }
}

// Run the test
testAuthFlow().catch(error => {
  console.error('Unhandled error:', error);
});