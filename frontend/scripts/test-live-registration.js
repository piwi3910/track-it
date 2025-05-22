#!/usr/bin/env node

/**
 * Test script for live user registration functionality with the backend server
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

console.log('=== Track-It Live Registration Test ===');

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

// Generate a random user for testing
const generateRandomUser = () => {
  const timestamp = Date.now();
  return {
    name: `Test User ${timestamp}`,
    email: `testuser${timestamp}@example.com`,
    password: 'Password123!',
  };
};

// Run test suite
const runTests = async () => {
  console.log('Creating tRPC client...');
  const client = createClient();
  
  // Generate random user credentials for testing
  const user = generateRandomUser();
  
  // Test 1: Register a new user
  console.log('\n1. Testing user registration...');
  console.log(`   Name: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Password: ${user.password}`);
  
  try {
    const registerResult = await apiHandler(() => 
      client.users.register.mutate({
        name: user.name,
        email: user.email,
        password: user.password,
        passwordConfirm: user.password
      })
    );
    
    console.log('   Registration result:', registerResult.error ? `Error: ${registerResult.error}` : 'Success');
    
    if (registerResult.data) {
      console.log('   User created with ID:', registerResult.data.id);
      console.log('   User data:', JSON.stringify(registerResult.data, null, 2));
    } else {
      console.error('   Failed to create user');
    }
    
    // Test 2: Try to login with the newly registered user
    console.log('\n2. Testing login with newly registered user...');
    
    const loginResult = await apiHandler(() => 
      client.users.login.mutate({ 
        email: user.email, 
        password: user.password 
      })
    );
    
    console.log('   Login result:', loginResult.error ? `Error: ${loginResult.error}` : 'Success');
    
    if (loginResult.data?.token) {
      console.log('   Received token:', loginResult.data.token.substring(0, 15) + '...');
      localStorage.setItem('token', loginResult.data.token);
      console.log('   Token stored in localStorage');
      
      // Test 3: Get current user with valid token
      console.log('\n3. Testing getCurrentUser with valid token...');
      
      const userResult = await apiHandler(() =>
        client.users.getCurrentUser.query()
      );
      
      console.log('   User result:', userResult.error ? `Error: ${userResult.error}` : 'Success');
      
      if (userResult.data) {
        console.log('   User data:', JSON.stringify(userResult.data, null, 2));
      }
    }
    
    // Test 4: Try to register with an email that already exists
    console.log('\n4. Testing registration with existing email...');
    
    const duplicateRegisterResult = await apiHandler(() => 
      client.users.register.mutate({
        name: user.name,
        email: user.email,
        password: user.password,
        passwordConfirm: user.password
      })
    );
    
    console.log('   Duplicate registration result:', duplicateRegisterResult.error ? `Error: ${duplicateRegisterResult.error}` : 'Success (unexpected!)');
    
    // Test 5: Logout
    console.log('\n5. Testing logout...');
    localStorage.removeItem('token');
    console.log('   Token removed from localStorage');
    
  } catch (error) {
    console.error('\nTest suite failed with error:', error);
  }
  
  console.log('\n=== Test Complete ===');
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