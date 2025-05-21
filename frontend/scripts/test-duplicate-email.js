// Test Duplicate Email Error Format
// This script tests how the client handles duplicate email errors from the server

import crossFetch from 'cross-fetch';
import { createTRPCClient, httpBatchLink } from '@trpc/client';

// Mock global objects for testing
global.fetch = crossFetch;

// Base URL for the API
const BASE_URL = 'http://localhost:3001/trpc';

// Create tRPC client for testing
const createClient = () => {
  return createTRPCClient({
    links: [
      httpBatchLink({
        url: BASE_URL,
        // Important: disable batching for tests
        batch: false,
        fetch: (url, options = {}) => {
          const fetchOptions = { ...options } || {};
          return crossFetch(url, fetchOptions);
        }
      }),
    ],
  });
};

// Test user data
const testUser = {
  name: "Duplicate Test User",
  email: "duplicate@example.com",
  password: "Password123!",
  passwordConfirm: "Password123!"
};

// Run the test
async function testDuplicateEmail() {
  console.log('=== Testing Duplicate Email Error Format ===');
  
  // Create tRPC client
  const client = createClient();
  
  try {
    // First registration should succeed
    console.log('1. Registering user for the first time...');
    try {
      const result = await client.users.register.mutate(testUser);
      console.log('✓ First registration successful:', result);
    } catch (error) {
      // If this fails, the user might already exist
      console.log('First registration failed (user might already exist)');
      console.log('Error:', error);
    }
    
    // Second registration with the same email should fail
    console.log('\n2. Trying to register the same user again...');
    try {
      await client.users.register.mutate(testUser);
      console.log('✗ Second registration succeeded but should have failed');
    } catch (error) {
      // This should happen - print the full error object
      console.log('✓ Second registration failed as expected');
      console.log('Error object:', error);
      console.log('Error class:', error.constructor.name);
      console.log('Error message:', error.message);
      console.log('Error stack:', error.stack);
      
      // If it's a TRPCClientError, check its properties
      if (error.name === 'TRPCClientError') {
        console.log('TRPCClientError data:', error.data);
        console.log('TRPCClientError shape:', error.shape);
      }
      
      // Check if the error message contains the expected text
      if (error.message.toLowerCase().includes('email already exists')) {
        console.log('✓ Error message contains "email already exists"');
      } else {
        console.log('✗ Error message does not contain "email already exists"');
      }
    }
    
    console.log('\nTest completed');
  } catch (error) {
    console.error('Test failed with unexpected error:', error);
  }
}

// Run the test
testDuplicateEmail().catch(error => {
  console.error('Unhandled error:', error);
});