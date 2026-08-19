#!/usr/bin/env node

/**
 * Test Frontend Headers
 * Test what happens when frontend sends different Authorization headers
 */

import fetch from 'node-fetch';

async function testFrontendHeaders() {
  console.log('🧪 Testing different Authorization header scenarios...\n');

  const email = 'support@vialifecoach.org';
  const password = process.env.COORDINATOR_PASSWORD || process.env.VITE_COORDINATOR_PASSWORD;

  const testCases = [
    {
      name: 'No Authorization Header (Correct)',
      headers: {
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'Empty Authorization Header',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': ''
      }
    },
    {
      name: 'Bearer with no token',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '
      }
    },
    {
      name: 'Bearer with undefined',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer undefined'
      }
    },
    {
      name: 'Bearer with null',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer null'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`   Headers:`, testCase.headers);
    
    try {
      const response = await fetch('http://localhost:5000/api/v1/coordinator/login', {
        method: 'POST',
        headers: testCase.headers,
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Success: ${response.ok ? '✅' : '❌'}`);
      
      if (response.ok) {
        console.log(`   Token: ${data.accessToken ? 'RECEIVED' : 'MISSING'}`);
      } else {
        console.log(`   Error: ${data.message || data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`   Request failed: ${error.message}`);
    }
  }

  console.log('\n🎯 The test that works is what the frontend should send.');
}

// Load environment variables
import '../src/config/env.js';

// Run the test
testFrontendHeaders();
