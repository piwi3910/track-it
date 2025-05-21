// Use CommonJS syntax
const fetch = require('node-fetch');

// Function to test the login endpoint
async function testLogin() {
  try {
    console.log('Testing login with demo user (batch format)...');
    
    // Let's try different batch formats to see which one works
    
    // Format 1: Current batch format
    console.log('\n--- Format 1: Current batch format ---');
    const batchBody1 = {
      "0": {
        "json": {
          "email": "demo@example.com",
          "password": "password123"
        }
      }
    };
    
    console.log('Request body:', JSON.stringify(batchBody1, null, 2));
    
    const response1 = await fetch('http://localhost:3002/trpc/users.login?batch=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batchBody1)
    });

    console.log('Response headers:', Object.fromEntries([...response1.headers.entries()]));
    const data1 = await response1.json();
    console.log('Response status:', response1.status);
    console.log('Response data:', JSON.stringify(data1, null, 2));
    
    // Format 2: Alternative batch format
    console.log('\n--- Format 2: Alternative batch format ---');
    const batchBody2 = [{
      json: {
        email: "demo@example.com",
        password: "password123"
      }
    }];
    
    console.log('Request body:', JSON.stringify(batchBody2, null, 2));
    
    const response2 = await fetch('http://localhost:3002/trpc/users.login?batch=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batchBody2)
    });

    console.log('Response headers:', Object.fromEntries([...response2.headers.entries()]));
    const data2 = await response2.json();
    console.log('Response status:', response2.status);
    console.log('Response data:', JSON.stringify(data2, null, 2));
    
    // Format 3: tRPC v11 batch format
    console.log('\n--- Format 3: tRPC v11 batch format ---');
    const batchBody3 = {
      batch: [
        {
          id: 0,
          jsonrpc: '2.0',
          method: 'users.login',
          params: {
            email: "demo@example.com",
            password: "password123"
          }
        }
      ]
    };
    
    console.log('Request body:', JSON.stringify(batchBody3, null, 2));
    
    const response3 = await fetch('http://localhost:3002/trpc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(batchBody3)
    });

    console.log('Response headers:', Object.fromEntries([...response3.headers.entries()]));
    const data3 = await response3.text();
    console.log('Response status:', response3.status);
    try {
      const jsonData3 = JSON.parse(data3);
      console.log('Response data:', JSON.stringify(jsonData3, null, 2));
    } catch (e) {
      console.log('Response text (not JSON):', data3);
    }
    
    // Test the same request without batch format for comparison
    console.log('\n--- Direct format (non-batch) ---');
    const directBody = {
      "email": "demo@example.com",
      "password": "password123"
    };
    
    console.log('Request body:', JSON.stringify(directBody, null, 2));
    
    const directResponse = await fetch('http://localhost:3002/trpc/users.login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(directBody)
    });

    console.log('Response headers:', Object.fromEntries([...directResponse.headers.entries()]));
    const directData = await directResponse.json();
    console.log('Response status:', directResponse.status);
    console.log('Response data:', JSON.stringify(directData, null, 2));

  } catch (error) {
    console.error('Error testing login:', error);
  }
}

// Execute the test
testLogin();