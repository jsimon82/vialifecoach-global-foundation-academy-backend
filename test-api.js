// Test the admin API endpoint
import fetch from 'node-fetch';

const testAdminEndpoint = async () => {
  try {
    // First, let's test without authentication to see the error
    const response = await fetch('http://localhost:5000/api/v1/admin/applications/APP2/status', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: 'Admin User'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    const text = await response.text();
    console.log('Response body:', text);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testAdminEndpoint();
