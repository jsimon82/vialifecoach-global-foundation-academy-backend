#!/usr/bin/env node

/**
 * Debug 500 Error
 * Debug the 500 Internal Server Error on registration stats endpoint
 */

import fetch from 'node-fetch';

async function debug500Error() {
  console.log('🔍 Debugging 500 Error...\n');

  const API_BASE_URL = 'http://localhost:5000/api/v1';

  try {
    // Step 1: Login as coordinator
    console.log('1️⃣ Logging in as coordinator...');
    const loginResponse = await fetch(`${API_BASE_URL}/coordinator/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'support@vialifecoach.org',
        password: 'Support82Via!'
      })
    });

    const loginData = await loginResponse.json();
    
    console.log(`   Login Status: ${loginResponse.status}`);
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginData.message);
      return;
    }

    const token = loginData.accessToken;
    console.log('✅ Login successful');

    // Step 2: Test registration stats endpoint (base endpoint that frontend calls)
    console.log('\n2️⃣ Testing registration stats endpoint (base)...');
    const statsResponse = await fetch(`${API_BASE_URL}/registration-stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Stats Status: ${statsResponse.status}`);
    
    const statsData = await statsResponse.json();
    
    if (statsResponse.ok) {
      console.log('✅ Registration stats works!');
      console.log('📊 Response:', JSON.stringify(statsData, null, 2));
    } else {
      console.log('❌ Registration stats failed:');
      console.log('🔍 Full error response:', JSON.stringify(statsData, null, 2));
      
      // If it's a 500 error, let's check the server logs
      if (statsResponse.status === 500) {
        console.log('\n🔍 500 Error detected - checking server logs...');
        console.log('📋 The server should have logged the error details');
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Load environment variables
import '../src/config/env.js';

// Run debug
debug500Error();
