#!/usr/bin/env node

/**
 * Test Authentication Debug
 * Test the authentication with the new test endpoints
 */

import fetch from 'node-fetch';

async function testAuthDebug() {
  console.log('🧪 Testing Authentication Debug...\n');

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

    // Step 2: Test basic authentication (no role check)
    console.log('\n2️⃣ Testing basic authentication...');
    const authTestResponse = await fetch(`${API_BASE_URL}/auth-test`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const authTestData = await authTestResponse.json();
    
    console.log(`   Auth Test Status: ${authTestResponse.status}`);
    console.log(`   Auth Test Success: ${authTestResponse.ok ? '✅' : '❌'}`);
    
    if (authTestResponse.ok) {
      console.log('✅ Basic authentication works');
      console.log('📋 User data:', JSON.stringify(authTestData.user, null, 2));
    } else {
      console.log('❌ Basic authentication failed:', authTestData.message);
    }

    // Step 3: Test coordinator role check (manual)
    console.log('\n3️⃣ Testing coordinator role check...');
    const coordTestResponse = await fetch(`${API_BASE_URL}/coordinator-test`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const coordTestData = await coordTestResponse.json();
    
    console.log(`   Coordinator Test Status: ${coordTestResponse.status}`);
    console.log(`   Coordinator Test Success: ${coordTestResponse.ok ? '✅' : '❌'}`);
    
    if (coordTestResponse.ok) {
      console.log('✅ Coordinator role check works');
      console.log('📋 User data:', JSON.stringify(coordTestData.user, null, 2));
    } else {
      console.log('❌ Coordinator role check failed:', coordTestData.message);
    }

    // Step 4: Test registration stats (with requireRoles)
    console.log('\n4️⃣ Testing registration stats (with requireRoles)...');
    const statsResponse = await fetch(`${API_BASE_URL}/registration-stats/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const statsData = await statsResponse.json();
    
    console.log(`   Stats Status: ${statsResponse.status}`);
    console.log(`   Stats Success: ${statsResponse.ok ? '✅' : '❌'}`);
    
    if (statsResponse.ok) {
      console.log('✅ Registration stats works!');
      console.log('📊 Stats data:', JSON.stringify(statsData.data, null, 2));
    } else {
      console.log('❌ Registration stats failed:', statsData.message);
      
      // If the basic auth works but stats fails, the issue is with requireRoles
      if (authTestResponse.ok) {
        console.log('🔍 Basic authentication works but registration stats fails');
        console.log('🔍 This suggests the issue is with the requireRoles middleware');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Load environment variables
import '../src/config/env.js';

// Run test
testAuthDebug();
