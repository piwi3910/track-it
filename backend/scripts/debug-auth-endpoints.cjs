// Use CommonJS syntax
const fetch = require('node-fetch');

// Function to test authenticated endpoints
async function testAuthEndpoints() {
  try {
    console.log('Step 1: Login to get JWT token...');
    
    // First, login to get the JWT token
    const loginResponse = await fetch('http://localhost:3001/trpc/users.login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "email": "demo@example.com",
        "password": "password123"
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response status:', loginResponse.status);
    
    // Extract token from login response
    const token = loginData.result.data.token;
    console.log('JWT Token received:', token.substring(0, 20) + '...');
    
    // Now test various authenticated endpoints
    console.log('\nStep 2: Testing getUserProfile endpoint...');
    const profileResponse = await fetch('http://localhost:3001/trpc/users.getCurrentUser', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const profileData = await profileResponse.json();
    console.log('Profile response status:', profileResponse.status);
    console.log('Profile data:', JSON.stringify(profileData, null, 2));
    
    console.log('\nStep 3: Testing getTasks endpoint...');
    const tasksResponse = await fetch('http://localhost:3001/trpc/tasks.getAll', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const tasksData = await tasksResponse.json();
    console.log('Tasks response status:', tasksResponse.status);
    console.log('Tasks count:', tasksData.result?.data?.length || 0);
    
    console.log('\nStep 4: Testing getTemplates endpoint...');
    const templatesResponse = await fetch('http://localhost:3001/trpc/templates.getAll', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const templatesData = await templatesResponse.json();
    console.log('Templates response status:', templatesResponse.status);
    console.log('Templates count:', templatesData.result?.data?.length || 0);
    
    console.log('\nStep 5: Testing getNotifications endpoint...');
    const notificationsResponse = await fetch('http://localhost:3001/trpc/notifications.getAll', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const notificationsData = await notificationsResponse.json();
    console.log('Notifications response status:', notificationsResponse.status);
    console.log('Notifications count:', notificationsData.result?.data?.length || 0);
    
    console.log('\nStep 6: Testing getAnalytics endpoint...');
    const analyticsResponse = await fetch('http://localhost:3001/trpc/analytics.getTasksCompletionStats?input=' + 
      encodeURIComponent(JSON.stringify({ timeframe: 'week' })), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const analyticsData = await analyticsResponse.json();
    console.log('Analytics response status:', analyticsResponse.status);
    console.log('Analytics data available:', !!analyticsData.result?.data);
    
    // Overall test result
    console.log('\n=== Authentication Test Results ===');
    console.log('Login: ' + (loginResponse.status === 200 ? '✅ Success' : '❌ Failed'));
    console.log('User Profile: ' + (profileResponse.status === 200 ? '✅ Success' : '❌ Failed'));
    console.log('Tasks: ' + (tasksResponse.status === 200 ? '✅ Success' : '❌ Failed'));
    console.log('Templates: ' + (templatesResponse.status === 200 ? '✅ Success' : '❌ Failed'));
    console.log('Notifications: ' + (notificationsResponse.status === 200 ? '✅ Success' : '❌ Failed'));
    console.log('Analytics: ' + (analyticsResponse.status === 200 ? '✅ Success' : '❌ Failed'));
    
  } catch (error) {
    console.error('Error testing authenticated endpoints:', error);
  }
}

// Execute the test
testAuthEndpoints();