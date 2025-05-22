#!/usr/bin/env node

/**
 * Test script for live task management functionality with the backend server
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

console.log('=== Track-It Live Task Management Test ===');

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

// Generate a random task
const generateRandomTask = () => {
  const timestamp = Date.now();
  return {
    title: `Test Task ${timestamp}`,
    description: `This is a test task created at ${new Date(timestamp).toISOString()}`,
    status: 'todo',
    priority: 'medium',
    tags: ['test', 'automated'],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
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
  
  // Test 1: Create a new task
  console.log('\n1. Testing task creation...');
  const newTask = generateRandomTask();
  console.log('   Task data:', JSON.stringify(newTask, null, 2));
  
  const createResult = await apiHandler(() => 
    client.tasks.createTask.mutate(newTask)
  );
  
  console.log('   Create task result:', createResult.error ? `Error: ${createResult.error}` : 'Success');
  
  if (!createResult.data) {
    console.error('   Failed to create task');
    process.exit(1);
  }
  
  console.log('   Task created with ID:', createResult.data.id);
  const taskId = createResult.data.id;
  
  // Test 2: Get task by ID
  console.log('\n2. Testing get task by ID...');
  console.log(`   Task ID: ${taskId}`);
  
  const getTaskResult = await apiHandler(() => 
    client.tasks.getTaskById.query({ id: taskId })
  );
  
  console.log('   Get task result:', getTaskResult.error ? `Error: ${getTaskResult.error}` : 'Success');
  
  if (getTaskResult.data) {
    console.log('   Retrieved task:', JSON.stringify(getTaskResult.data, null, 2));
  }
  
  // Test 3: Update task
  console.log('\n3. Testing task update...');
  const updateData = {
    id: taskId,
    status: 'in_progress',
    priority: 'high',
    title: `${newTask.title} (Updated)`,
    tags: [...newTask.tags, 'updated']
  };
  console.log('   Update data:', JSON.stringify(updateData, null, 2));
  
  const updateResult = await apiHandler(() => 
    client.tasks.updateTask.mutate(updateData)
  );
  
  console.log('   Update task result:', updateResult.error ? `Error: ${updateResult.error}` : 'Success');
  
  if (updateResult.data) {
    console.log('   Updated task:', JSON.stringify(updateResult.data, null, 2));
  }
  
  // Test 4: Get all tasks
  console.log('\n4. Testing get all tasks...');
  
  const getAllTasksResult = await apiHandler(() => 
    client.tasks.getAllTasks.query()
  );
  
  console.log('   Get all tasks result:', getAllTasksResult.error ? `Error: ${getAllTasksResult.error}` : 'Success');
  
  if (getAllTasksResult.data) {
    console.log(`   Retrieved ${getAllTasksResult.data.length} tasks`);
    console.log('   First few tasks:', JSON.stringify(getAllTasksResult.data.slice(0, 2), null, 2));
  }
  
  // Test 5: Filter tasks by status
  console.log('\n5. Testing filter tasks by status...');
  const filterStatus = 'in_progress';
  console.log(`   Filter status: ${filterStatus}`);
  
  const filterTasksResult = await apiHandler(() => 
    client.tasks.getTasksByStatus.query({ status: filterStatus })
  );
  
  console.log('   Filter tasks result:', filterTasksResult.error ? `Error: ${filterTasksResult.error}` : 'Success');
  
  if (filterTasksResult.data) {
    console.log(`   Retrieved ${filterTasksResult.data.length} tasks with status '${filterStatus}'`);
    console.log('   First few filtered tasks:', JSON.stringify(filterTasksResult.data.slice(0, 2), null, 2));
  }
  
  // Test 6: Add a comment to task
  console.log('\n6. Testing add comment to task...');
  const commentData = {
    taskId,
    text: `Test comment at ${new Date().toISOString()}`
  };
  console.log('   Comment data:', JSON.stringify(commentData, null, 2));
  
  const addCommentResult = await apiHandler(() => 
    client.comments.addComment.mutate(commentData)
  );
  
  console.log('   Add comment result:', addCommentResult.error ? `Error: ${addCommentResult.error}` : 'Success');
  
  if (addCommentResult.data) {
    console.log('   Added comment:', JSON.stringify(addCommentResult.data, null, 2));
  }
  
  // Test 7: Delete task
  console.log('\n7. Testing task deletion...');
  console.log(`   Task ID to delete: ${taskId}`);
  
  const deleteResult = await apiHandler(() => 
    client.tasks.deleteTask.mutate({ id: taskId })
  );
  
  console.log('   Delete task result:', deleteResult.error ? `Error: ${deleteResult.error}` : 'Success');
  
  if (deleteResult.data) {
    console.log('   Delete task response:', JSON.stringify(deleteResult.data, null, 2));
  }
  
  // Test 8: Verify task deletion
  console.log('\n8. Testing that deleted task no longer exists...');
  
  const verifyDeleteResult = await apiHandler(() => 
    client.tasks.getTaskById.query({ id: taskId })
  );
  
  // Should return error since task is deleted
  if (verifyDeleteResult.error) {
    console.log('   Task deletion confirmed: Task no longer exists');
  } else {
    console.error('   ERROR: Task still exists after deletion attempt!');
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