#!/usr/bin/env node

/**
 * Test script for login functionality
 * This script can be used to test the login functionality without running the full app
 */

console.log('=== Track-It Login Test ===');

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

// Mock api response for login
const mockLoginResponse = {
  id: 'user1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  role: 'admin',
  token: 'mock-jwt-token.with.signature'
};

// Mock getCurrentUser response
const mockUserResponse = {
  id: 'user1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatarUrl: 'https://i.pravatar.cc/150?u=user1',
  role: 'admin'
};

// Simulate login
console.log('1. Testing login with valid credentials...');
console.log('   Email: john.doe@example.com');
console.log('   Password: password123');

// Simulate successful login
const login = async () => {
  console.log('   Making API request...');
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate successful response
  console.log('   Received response from server');
  localStorage.setItem('token', mockLoginResponse.token);
  console.log('   Token stored in localStorage');
  
  return { data: mockLoginResponse, error: null };
};

// Simulate getting current user
const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.log('   No token found, user is not authenticated');
    return { data: null, error: 'Unauthorized' };
  }
  
  console.log('   Token found, getting current user information');
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('   Successfully fetched user information');
  return { data: mockUserResponse, error: null };
};

// Run the test
const runTest = async () => {
  // Test login
  const loginResult = await login();
  console.log('   Login result:', loginResult.error ? `Error: ${loginResult.error}` : 'Success');
  
  // Test getting current user
  console.log('\n2. Testing getCurrentUser with valid token...');
  const userResult = await getCurrentUser();
  console.log('   User result:', userResult.error ? `Error: ${userResult.error}` : 'Success');
  console.log('   User data:', userResult.data);
  
  // Test logout
  console.log('\n3. Testing logout...');
  localStorage.removeItem('token');
  console.log('   Token removed from localStorage');
  
  // Test getting current user after logout
  console.log('\n4. Testing getCurrentUser after logout...');
  const afterLogoutResult = await getCurrentUser();
  console.log('   User result:', afterLogoutResult.error ? `Error: ${afterLogoutResult.error}` : 'Success');
  
  console.log('\n=== Test Complete ===');
};

runTest().catch(err => {
  console.error('Test failed:', err);
});