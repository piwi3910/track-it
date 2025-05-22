#!/usr/bin/env node

/**
 * Test script for live comments functionality with the backend server
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

console.log('=== Track-It Live Comments Test ===');

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
    title: `Comment Test Task ${timestamp}`,
    description: `This is a test task created for comment testing at ${new Date(timestamp).toISOString()}`,
    status: 'todo',
    priority: 'medium',
    tags: ['test', 'comments'],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
  };
};

// Run test suite
const runTests = async () => {
  console.log('Creating tRPC client...');
  const client = createClient();
  let taskId, commentId, replyId;
  
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
  
  // Test 0: Create a task to comment on
  console.log('\n0. Creating a test task for comments...');
  const newTask = generateRandomTask();
  console.log('   Task data:', JSON.stringify(newTask, null, 2));
  
  const createTaskResult = await apiHandler(() => 
    client.tasks.createTask.mutate(newTask)
  );
  
  console.log('   Create task result:', createTaskResult.error ? `Error: ${createTaskResult.error}` : 'Success');
  
  if (!createTaskResult.data) {
    console.error('   Failed to create task for comments');
    process.exit(1);
  }
  
  console.log('   Task created with ID:', createTaskResult.data.id);
  taskId = createTaskResult.data.id;
  
  // Test 1: Add a comment to the task
  console.log('\n1. Testing adding a comment to task...');
  const commentData = {
    taskId,
    text: `This is a test comment created at ${new Date().toISOString()}`
  };
  console.log('   Comment data:', JSON.stringify(commentData, null, 2));
  
  const addCommentResult = await apiHandler(() => 
    client.comments.addComment.mutate(commentData)
  );
  
  console.log('   Add comment result:', addCommentResult.error ? `Error: ${addCommentResult.error}` : 'Success');
  
  if (addCommentResult.data) {
    console.log('   Comment created with ID:', addCommentResult.data.id);
    console.log('   Comment data:', JSON.stringify(addCommentResult.data, null, 2));
    commentId = addCommentResult.data.id;
  } else {
    console.error('   Failed to add comment');
    // Clean up and exit
    await apiHandler(() => client.tasks.deleteTask.mutate({ id: taskId }));
    process.exit(1);
  }
  
  // Test 2: Get all comments for the task
  console.log('\n2. Testing get all comments for task...');
  console.log(`   Task ID: ${taskId}`);
  
  const getCommentsResult = await apiHandler(() => 
    client.comments.getTaskComments.query({ taskId })
  );
  
  console.log('   Get comments result:', getCommentsResult.error ? `Error: ${getCommentsResult.error}` : 'Success');
  
  if (getCommentsResult.data) {
    console.log(`   Retrieved ${getCommentsResult.data.length} comments`);
    console.log('   Comments:', JSON.stringify(getCommentsResult.data, null, 2));
  }
  
  // Test 3: Add a reply to the comment
  console.log('\n3. Testing adding a reply to a comment...');
  const replyData = {
    taskId,
    text: `This is a reply to comment ${commentId} created at ${new Date().toISOString()}`,
    parentId: commentId
  };
  console.log('   Reply data:', JSON.stringify(replyData, null, 2));
  
  const addReplyResult = await apiHandler(() => 
    client.comments.addComment.mutate(replyData)
  );
  
  console.log('   Add reply result:', addReplyResult.error ? `Error: ${addReplyResult.error}` : 'Success');
  
  if (addReplyResult.data) {
    console.log('   Reply created with ID:', addReplyResult.data.id);
    console.log('   Reply data:', JSON.stringify(addReplyResult.data, null, 2));
    replyId = addReplyResult.data.id;
  }
  
  // Test 4: Get comment replies
  console.log('\n4. Testing get comment replies...');
  console.log(`   Comment ID: ${commentId}`);
  
  const getRepliesResult = await apiHandler(() => 
    client.comments.getCommentReplies.query({ commentId })
  ).catch(error => {
    // This might fail if the endpoint doesn't exist
    return { data: null, error: error.message };
  });
  
  console.log('   Get replies result:', getRepliesResult.error ? `Error: ${getRepliesResult.error}` : 'Success');
  
  if (getRepliesResult.data) {
    console.log(`   Retrieved ${getRepliesResult.data.length} replies`);
    console.log('   Replies:', JSON.stringify(getRepliesResult.data, null, 2));
  } else {
    // Alternative: Get all comments again and check for replies
    console.log('   Falling back to getting all comments and checking for replies...');
    const allCommentsResult = await apiHandler(() => 
      client.comments.getTaskComments.query({ taskId })
    );
    
    if (allCommentsResult.data) {
      const replies = allCommentsResult.data.filter(c => c.parentId === commentId);
      console.log(`   Found ${replies.length} replies in all comments`);
      console.log('   Replies:', JSON.stringify(replies, null, 2));
    }
  }
  
  // Test 5: Update a comment
  console.log('\n5. Testing update comment...');
  const updateCommentData = {
    id: commentId,
    text: `This comment was updated at ${new Date().toISOString()}`
  };
  console.log('   Update comment data:', JSON.stringify(updateCommentData, null, 2));
  
  const updateCommentResult = await apiHandler(() => 
    client.comments.updateComment.mutate(updateCommentData)
  );
  
  console.log('   Update comment result:', updateCommentResult.error ? `Error: ${updateCommentResult.error}` : 'Success');
  
  if (updateCommentResult.data) {
    console.log('   Updated comment data:', JSON.stringify(updateCommentResult.data, null, 2));
  }
  
  // Test 6: Delete a comment (reply)
  console.log('\n6. Testing delete comment (reply)...');
  console.log(`   Reply ID to delete: ${replyId}`);
  
  const deleteReplyResult = await apiHandler(() => 
    client.comments.deleteComment.mutate({ id: replyId })
  );
  
  console.log('   Delete reply result:', deleteReplyResult.error ? `Error: ${deleteReplyResult.error}` : 'Success');
  
  // Test 7: Verify reply deletion
  console.log('\n7. Testing verification of reply deletion...');
  
  const verifyDeleteResult = await apiHandler(() => 
    client.comments.getTaskComments.query({ taskId })
  );
  
  console.log('   Get comments after deletion result:', verifyDeleteResult.error ? `Error: ${verifyDeleteResult.error}` : 'Success');
  
  if (verifyDeleteResult.data) {
    const deletedReply = verifyDeleteResult.data.find(c => c.id === replyId);
    if (!deletedReply) {
      console.log('   ✓ Reply was successfully deleted');
    } else {
      console.log('   ✗ Reply still exists after deletion attempt');
    }
  }
  
  // Test 8: Delete the main comment
  console.log('\n8. Testing delete main comment...');
  console.log(`   Comment ID to delete: ${commentId}`);
  
  const deleteCommentResult = await apiHandler(() => 
    client.comments.deleteComment.mutate({ id: commentId })
  );
  
  console.log('   Delete comment result:', deleteCommentResult.error ? `Error: ${deleteCommentResult.error}` : 'Success');
  
  // Test 9: Clean up (delete task)
  console.log('\n9. Test cleanup - deleting test task...');
  console.log(`   Task ID to delete: ${taskId}`);
  
  const deleteTaskResult = await apiHandler(() => 
    client.tasks.deleteTask.mutate({ id: taskId })
  );
  
  console.log('   Delete task result:', deleteTaskResult.error ? `Error: ${deleteTaskResult.error}` : 'Success');
  
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