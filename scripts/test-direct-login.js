#!/usr/bin/env node

/**
 * Test Direct Login
 * Test the coordinator login endpoint directly without curl
 */

import fetch from 'node-fetch';

async function testDirectLogin() {
  console.log('🧪 Testing coordinator login directly...\n');

  try {
    const response = await fetch('http://localhost:5000/api/v1/coordinator/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: 'support@vialifecoach.org',
        password: process.env.COORDINATOR_PASSWORD || process.env.VITE_COORDINATOR_PASSWORD
      })
    });

    const data = await response.json();
    
    console.log('📋 Status:', response.status);
    console.log('📋 Response:', data);

    if (response.ok && data.accessToken) {
      console.log('✅ Login successful - endpoint is working!');
    } else if (response.status === 401) {
      console.log('❌ 401 Unauthorized - endpoint is still protected');
      console.log('💡 Check if there\'s global authentication middleware');
    } else {
      console.log('🔍 Unexpected response - check backend logs');
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Load environment variables
import '../src/config/env.js';

// Run the test
testDirectLogin();
