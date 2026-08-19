#!/usr/bin/env node

/**
 * Test Frontend Request
 * Simulate exactly what the frontend HTML test is sending
 */

import fetch from 'node-fetch';

async function testFrontendRequest() {
  console.log('🧪 Testing frontend request simulation...\n');

  // Test different credential combinations that frontend might be sending
  const testCases = [
    {
      name: 'Correct credentials from env',
      email: 'support@vialifecoach.org',
      password: process.env.COORDINATOR_PASSWORD || process.env.VITE_COORDINATOR_PASSWORD
    },
    {
      name: 'Hardcoded test password',
      email: 'support@vialifecoach.org', 
      password: 'Suport82Via@'
    },
    {
      name: 'Email as password',
      email: 'support@vialifecoach.org',
      password: 'support@vialifecoach.org'
    },
    {
      name: 'Empty password',
      email: 'support@vialifecoach.org',
      password: ''
    },
    {
      name: 'Wrong email',
      email: 'admin@vialifecoach.org',
      password: process.env.COORDINATOR_PASSWORD || process.env.VITE_COORDINATOR_PASSWORD
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`   Email: ${testCase.email}`);
    console.log(`   Password: ${testCase.password ? 'SET' : 'EMPTY'}`);
    
    try {
      const response = await fetch('http://localhost:5000/api/v1/coordinator/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: testCase.email,
          password: testCase.password
        })
      });

      const data = await response.json();
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Success: ${response.ok ? '✅' : '❌'}`);
      
      if (response.ok) {
        console.log(`   Token: ${data.accessToken ? 'RECEIVED' : 'MISSING'}`);
        console.log(`   User: ${data.user?.name || 'N/A'}`);
      } else {
        console.log(`   Error: ${data.message || data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`   Request failed: ${error.message}`);
    }
  }

  console.log('\n🎯 The test that succeeds shows the correct credentials.');
}

// Load environment variables
import '../src/config/env.js';

// Run the test
testFrontendRequest();
