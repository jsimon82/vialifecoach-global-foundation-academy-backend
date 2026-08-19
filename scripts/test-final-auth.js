#!/usr/bin/env node

/**
 * Final Authentication Test
 * Test the registration stats endpoint with proper authentication
 */

import fetch from 'node-fetch';

async function testFinalAuth() {
  console.log('🧪 Final Authentication Test...\n');

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
    console.log('📋 User info:', JSON.stringify(loginData.user, null, 2));

    // Step 2: Test registration stats
    console.log('\n2️⃣ Testing registration stats...');
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
      console.log('📊 Stats Summary:');
      console.log(`   Total Registrations: ${statsData.data?.registration_stats?.total_registrations || 0}`);
      console.log(`   Coordinator Registrations: ${statsData.data?.registration_stats?.coordinator_registrations || 0}`);
      console.log(`   Community Registrations: ${statsData.data?.registration_stats?.community_registrations || 0}`);
      console.log(`   Dual Registrations: ${statsData.data?.registration_stats?.dual_registrations || 0}`);
      console.log(`   Upcoming Events: ${statsData.data?.event_stats?.upcoming_events || 0}`);
      
      // Update TODO list
      console.log('\n🎯 SUCCESS: Coordinator dashboard stats endpoint is working!');
      console.log('📋 Frontend should now be able to fetch registration statistics');
    } else {
      console.log('❌ Registration stats failed:', statsData.message);
      console.log('🔍 Full error:', JSON.stringify(statsData, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Load environment variables
import '../src/config/env.js';

// Run test
testFinalAuth();
