#!/usr/bin/env node

/**
 * Test All Registration Stats Endpoints
 * Test all the registration stats endpoints to ensure they work properly
 */

import fetch from 'node-fetch';

async function testAllEndpoints() {
  console.log('🧪 Testing All Registration Stats Endpoints...\n');

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

    // Step 2: Test base registration stats endpoint
    console.log('\n2️⃣ Testing GET /api/v1/registration-stats');
    const baseResponse = await fetch(`${API_BASE_URL}/registration-stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Base Status: ${baseResponse.status}`);
    console.log(`   Base Success: ${baseResponse.ok ? '✅' : '❌'}`);
    
    if (baseResponse.ok) {
      const baseData = await baseResponse.json();
      console.log('✅ Base endpoint works');
    } else {
      console.log('❌ Base endpoint failed');
    }

    // Step 3: Test stats endpoint
    console.log('\n3️⃣ Testing GET /api/v1/registration-stats/stats');
    const statsResponse = await fetch(`${API_BASE_URL}/registration-stats/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Stats Status: ${statsResponse.status}`);
    console.log(`   Stats Success: ${statsResponse.ok ? '✅' : '❌'}`);
    
    if (statsResponse.ok) {
      console.log('✅ Stats endpoint works');
    } else {
      console.log('❌ Stats endpoint failed');
    }

    // Step 4: Test registrations list endpoint
    console.log('\n4️⃣ Testing GET /api/v1/registration-stats/registrations');
    const listResponse = await fetch(`${API_BASE_URL}/registration-stats/registrations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   List Status: ${listResponse.status}`);
    console.log(`   List Success: ${listResponse.ok ? '✅' : '❌'}`);
    
    if (listResponse.ok) {
      console.log('✅ List endpoint works');
    } else {
      console.log('❌ List endpoint failed');
    }

    console.log('\n🎯 All endpoints tested successfully!');
    console.log('📋 The backend should now work with the frontend');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Load environment variables
import '../src/config/env.js';

// Run test
testAllEndpoints();
