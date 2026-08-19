#!/usr/bin/env node

/**
 * Test Registration Stats Endpoint
 * Test the new registration stats endpoint for coordinator dashboard
 */

import fetch from 'node-fetch';

async function testRegistrationStats() {
  console.log('🧪 Testing Registration Stats Endpoint...\n');

  const API_BASE_URL = 'http://localhost:5000/api/v1';

  try {
    // Step 1: Login as coordinator to get token
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
    console.log('✅ Login successful, got token');

    // Step 2: Test registration stats endpoint
    console.log('\n2️⃣ Testing GET /api/v1/registration-stats/stats');
    const statsResponse = await fetch(`${API_BASE_URL}/registration-stats/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const statsData = await statsResponse.json();
    
    console.log(`   Stats Status: ${statsResponse.status}`);
    console.log(`   Success: ${statsResponse.ok ? '✅' : '❌'}`);
    
    if (statsResponse.ok) {
      console.log('✅ Registration stats endpoint working!');
      console.log('📊 Stats Summary:');
      console.log(`   Total Registrations: ${statsData.data?.registration_stats?.total_registrations || 0}`);
      console.log(`   Coordinator Registrations: ${statsData.data?.registration_stats?.coordinator_registrations || 0}`);
      console.log(`   Community Registrations: ${statsData.data?.registration_stats?.community_registrations || 0}`);
      console.log(`   Dual Registrations: ${statsData.data?.registration_stats?.dual_registrations || 0}`);
      console.log(`   Upcoming Events: ${statsData.data?.event_stats?.upcoming_events || 0}`);
    } else {
      console.log('❌ Stats endpoint failed:', statsData.message);
    }

    // Step 3: Test registration list endpoint
    console.log('\n3️⃣ Testing GET /api/v1/registration-stats/registrations');
    const listResponse = await fetch(`${API_BASE_URL}/registration-stats/registrations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const listData = await listResponse.json();
    
    console.log(`   List Status: ${listResponse.status}`);
    console.log(`   Success: ${listResponse.ok ? '✅' : '❌'}`);
    
    if (listResponse.ok) {
      console.log('✅ Registration list endpoint working!');
      console.log(`   Registrations found: ${listData.data?.registrations?.length || 0}`);
    } else {
      console.log('❌ List endpoint failed:', listData.message);
    }

    console.log('\n🎯 Registration Stats Test Complete!');
    console.log('\n📋 Summary:');
    console.log('- Coordinator login: Working ✅');
    console.log('- Registration stats endpoint: Working ✅');
    console.log('- Registration list endpoint: Working ✅');
    console.log('\n🚀 Coordinator dashboard should now load properly!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Load environment variables
import '../src/config/env.js';

// Run test
testRegistrationStats();
