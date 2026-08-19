#!/usr/bin/env node

/**
 * Test Fixed Registration Stats
 * Test the fixed registration stats controller to ensure undefined length errors are resolved
 */

import fetch from 'node-fetch';

async function testFixedRegistrationStats() {
  console.log('🧪 Testing Fixed Registration Stats...\n');

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
    console.log('\n2️⃣ Testing GET /api/v1/registration-stats');
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
      console.log('📊 Response structure:');
      console.log('   - success:', statsData.success);
      console.log('   - registration_stats:', statsData.data?.registration_stats ? '✅ Present' : '❌ Missing');
      console.log('   - event_stats:', statsData.data?.event_stats ? '✅ Present' : '❌ Missing');
      console.log('   - recent_registrations:', Array.isArray(statsData.data?.recent_registrations) ? '✅ Array' : '❌ Not array');
      console.log('   - events_summary:', Array.isArray(statsData.data?.events_summary) ? '✅ Array' : '❌ Not array');
      
      // Check for undefined length errors
      if (statsData.data?.recent_registrations !== undefined && statsData.data?.events_summary !== undefined) {
        console.log('✅ No undefined length errors detected');
      } else {
        console.log('❌ Still has undefined values');
      }
    } else {
      console.log('❌ Registration stats failed:');
      console.log('🔍 Full error response:', JSON.stringify(statsData, null, 2));
    }

    // Step 3: Test registration list endpoint
    console.log('\n3️⃣ Testing GET /api/v1/registration-stats/registrations');
    const listResponse = await fetch(`${API_BASE_URL}/registration-stats/registrations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`   List Status: ${listResponse.status}`);
    
    const listData = await listResponse.json();
    
    if (listResponse.ok) {
      console.log('✅ Registration list works!');
      console.log('📊 List structure:');
      console.log('   - success:', listData.success);
      console.log('   - registrations:', Array.isArray(listData.data?.registrations) ? '✅ Array' : '❌ Not array');
      console.log('   - pagination:', listData.data?.pagination ? '✅ Present' : '❌ Missing');
    } else {
      console.log('❌ Registration list failed:', listData.message);
    }

    console.log('\n🎯 Fixed registration stats test complete!');
    console.log('📋 The undefined length error should now be resolved');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Load environment variables
import '../src/config/env.js';

// Run test
testFixedRegistrationStats();
