#!/usr/bin/env node

/**
 * Test script for live user profile management functionality with the backend server
 * This script tests the actual tRPC client against the backend server
 */

import fetch from 'cross-fetch';
import { createTRPCClient, httpBatchLink } from '@trpc/client';

// Mock localStorage
const localStorage = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = value;
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  }
};

// Global object that would normally be in window
global.localStorage = localStorage;

console.log('=== Track-It Live User Profile Management Test ===');

// Create a tRPC client for testing
const createClient = () => {
  return createTRPCClient({
    links: [
      httpBatchLink({
        url: 'http://localhost:3001/trpc',
        // Important: explicitly disable batching since we're running into issues with it
        batch: false,
        // Use node-fetch in Node.js environment
        fetch: (url, options) => {
          console.log(`Making API request to: ${url}`);
          if (options.body) {
            console.log('Request body:', options.body);
          }

          // Create proper headers for request
          const headers = {};
          
          // Add any existing headers
          if (options.headers) {
            Object.entries(options.headers).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                headers[key] = value.toString();
              }
            });
          }
          
          // Ensure proper content type
          headers['Content-Type'] = 'application/json';
          headers['Accept'] = 'application/json';
          
          // Add auth token if available
          const token = localStorage.getItem('token');
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          console.log('Request headers:', headers);
          
          return fetch(url, {
            ...options,
            headers
          }).then(response => {
            console.log(`API response status: ${response.status}`);
            
            return response;
          }).catch(error => {
            console.error('API request error:', error);
            throw error;
          });
        }
      }),
    ],
  });
};

// Wrapper for API calls
const apiHandler = async (apiCall) => {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error) {
    console.error('API Error:', error);
    
    let errorMessage = 'Unknown error occurred';
    if (error.message) {
      errorMessage = error.message;
    }
    
    return { data: null, error: errorMessage };
  }
};

// Generate a random user update
const generateRandomUserUpdate = () => {
  const timestamp = Date.now();
  return {
    name: `Updated User ${timestamp}`,
    avatarUrl: `https://i.pravatar.cc/150?u=${timestamp}`,
    preferences: {
      theme: Math.random() > 0.5 ? 'dark' : 'light',
      defaultView: ['dashboard', 'kanban', 'calendar', 'backlog'][Math.floor(Math.random() * 4)]
    }
  };
};

// Run test suite
const runTests = async () => {
  console.log('Creating tRPC client...');
  const client = createClient();
  
  // First, login as demo user
  console.log('\n=== Logging in as demo user ===');
  const loginResult = await apiHandler(() => 
    client.users.login.mutate({ 
      email: 'demo@example.com', 
      password: 'password123' 
    })
  );
  
  if (loginResult.error) {
    console.error('Login failed:', loginResult.error);
    console.error('Cannot continue tests without authentication.');
    process.exit(1);
  }
  
  // Store token
  localStorage.setItem('token', loginResult.data.token);
  console.log(`Logged in successfully. Token: ${loginResult.data.token.substring(0, 15)}...`);
  
  // Test 1: Get current user profile
  console.log('\n1. Testing get current user profile...');
  
  const getUserResult = await apiHandler(() => 
    client.users.getCurrentUser.query()
  );
  
  console.log('   Get user result:', getUserResult.error ? `Error: ${getUserResult.error}` : 'Success');
  
  if (getUserResult.data) {
    console.log('   Current user data:', JSON.stringify(getUserResult.data, null, 2));
  } else {
    console.error('   Failed to get current user');
    process.exit(1);
  }
  
  // Save original user data for later comparison
  const originalUserData = getUserResult.data;
  
  // Test 2: Update user profile
  console.log('\n2. Testing update user profile...');
  const updateData = generateRandomUserUpdate();
  console.log('   Update data:', JSON.stringify(updateData, null, 2));
  
  const updateResult = await apiHandler(() => 
    client.users.updateProfile.mutate(updateData)
  );
  
  console.log('   Update profile result:', updateResult.error ? `Error: ${updateResult.error}` : 'Success');
  
  if (updateResult.data) {
    console.log('   Updated user data:', JSON.stringify(updateResult.data, null, 2));
  }
  
  // Test 3: Verify user profile update
  console.log('\n3. Testing verification of user profile update...');
  
  const verifyUpdateResult = await apiHandler(() => 
    client.users.getCurrentUser.query()
  );
  
  console.log('   Verify update result:', verifyUpdateResult.error ? `Error: ${verifyUpdateResult.error}` : 'Success');
  
  if (verifyUpdateResult.data) {
    console.log('   Current user data after update:', JSON.stringify(verifyUpdateResult.data, null, 2));
    
    // Verify that update was applied
    if (verifyUpdateResult.data.name === updateData.name) {
      console.log('   ✓ Name was successfully updated');
    } else {
      console.log('   ✗ Name was not updated correctly');
    }
    
    if (verifyUpdateResult.data.avatarUrl === updateData.avatarUrl) {
      console.log('   ✓ Avatar URL was successfully updated');
    } else {
      console.log('   ✗ Avatar URL was not updated correctly');
    }
    
    if (verifyUpdateResult.data.preferences?.theme === updateData.preferences.theme) {
      console.log('   ✓ Theme preference was successfully updated');
    } else {
      console.log('   ✗ Theme preference was not updated correctly');
    }
    
    if (verifyUpdateResult.data.preferences?.defaultView === updateData.preferences.defaultView) {
      console.log('   ✓ Default view preference was successfully updated');
    } else {
      console.log('   ✗ Default view preference was not updated correctly');
    }
  }
  
  // Test 4: Update theme preference only
  console.log('\n4. Testing update of theme preference only...');
  const newTheme = originalUserData.preferences.theme === 'light' ? 'dark' : 'light';
  const themeUpdateData = {
    preferences: {
      theme: newTheme
    }
  };
  console.log('   Theme update data:', JSON.stringify(themeUpdateData, null, 2));
  
  const themeUpdateResult = await apiHandler(() => 
    client.users.updateProfile.mutate(themeUpdateData)
  );
  
  console.log('   Theme update result:', themeUpdateResult.error ? `Error: ${themeUpdateResult.error}` : 'Success');
  
  if (themeUpdateResult.data) {
    console.log('   Updated user data after theme change:', JSON.stringify(themeUpdateResult.data, null, 2));
    
    // Verify that theme was updated but other preferences were preserved
    if (themeUpdateResult.data.preferences?.theme === newTheme) {
      console.log('   ✓ Theme preference was successfully updated');
    } else {
      console.log('   ✗ Theme preference was not updated correctly');
    }
    
    if (themeUpdateResult.data.preferences?.defaultView === updateData.preferences.defaultView) {
      console.log('   ✓ Default view preference was preserved');
    } else {
      console.log('   ✗ Default view preference was not preserved');
    }
  }
  
  // Test 5: Restore original user data
  console.log('\n5. Testing restoration of original user data...');
  const restoreData = {
    name: originalUserData.name,
    avatarUrl: originalUserData.avatarUrl,
    preferences: originalUserData.preferences
  };
  console.log('   Restore data:', JSON.stringify(restoreData, null, 2));
  
  const restoreResult = await apiHandler(() => 
    client.users.updateProfile.mutate(restoreData)
  );
  
  console.log('   Restore result:', restoreResult.error ? `Error: ${restoreResult.error}` : 'Success');
  
  if (restoreResult.data) {
    console.log('   Restored user data:', JSON.stringify(restoreResult.data, null, 2));
  }
  
  // Test 6: Test Google integration settings (if available)
  console.log('\n6. Testing Google integration settings update...');
  const googleIntegrationData = {
    googleEnabled: true,
    googleRefreshToken: null // In a real test, we would have a valid token
  };
  console.log('   Google integration data:', JSON.stringify(googleIntegrationData, null, 2));
  
  const googleIntegrationResult = await apiHandler(() => 
    client.users.updateGoogleIntegration.mutate(googleIntegrationData)
  ).catch(error => {
    // This might fail if the endpoint doesn't exist or isn't implemented
    return { data: null, error: error.message };
  });
  
  console.log('   Google integration result:', googleIntegrationResult.error ? `Error: ${googleIntegrationResult.error}` : 'Success');
  
  if (googleIntegrationResult.data) {
    console.log('   Updated Google integration settings:', JSON.stringify(googleIntegrationResult.data, null, 2));
  }
  
  // Logout
  console.log('\nTest Complete - Logging out...');
  localStorage.removeItem('token');
  console.log('   Token removed from localStorage');
  
  console.log('\n=== Test Suite Complete ===');
};

// Ensure backend is running before starting tests
const checkBackendStatus = async () => {
  try {
    console.log('Checking if backend server is running...');
    const response = await fetch('http://localhost:3001/');
    
    if (response.ok) {
      console.log('Backend server is running. Starting tests...\n');
      await runTests();
    } else {
      console.error(`Backend server returned status: ${response.status}`);
      console.error('Please ensure the backend server is running on http://localhost:3001');
    }
  } catch (error) {
    console.error('Error connecting to backend server:', error.message);
    console.error('Please ensure the backend server is running on http://localhost:3001');
    console.error('Run `cd backend && npm run dev` to start the backend server');
  }
};

checkBackendStatus();