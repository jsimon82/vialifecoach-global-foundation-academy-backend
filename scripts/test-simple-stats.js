#!/usr/bin/env node

/**
 * Simple Test for Registration Stats
 * Test the registration stats endpoint without authentication
 */

import fetch from 'node-fetch';

async function testSimpleStats() {
  console.log('🧪 Testing Registration Stats (Simple)...\n');

  try {
    // Test without authentication
    console.log('1️⃣ Testing GET /api/v1/registration-stats/stats (no auth)');
    const response = await fetch('http://localhost:5000/api/v1/registration-stats/stats', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${response.ok ? '✅' : '❌'}`);
    
    if (response.ok) {
      console.log('✅ Registration stats endpoint working!');
      console.log('📊 Stats Summary:');
      console.log(`   Total Registrations: ${data.data?.registration_stats?.total_registrations || 0}`);
      console.log(`   Coordinator Registrations: ${data.data?.registration_stats?.coordinator_registrations || 0}`);
      console.log(`   Community Registrations: ${data.data?.registration_stats?.community_registrations || 0}`);
      console.log(`   Dual Registrations: ${data.data?.registration_stats?.dual_registrations || 0}`);
      console.log(`   Upcoming Events: ${data.data?.event_stats?.upcoming_events || 0}`);
    } else {
      console.log('❌ Stats endpoint failed:', data.message);
    }

    // Test registration list
    console.log('\n2️⃣ Testing GET /api/v1/registration-stats/registrations (no auth)');
    const listResponse = await fetch('http://localhost:5000/api/v1/registration-stats/registrations', {
      headers: {
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

    console.log('\n🎯 Simple Stats Test Complete!');
    console.log('\n📋 Frontend Integration Status:');
    console.log('- Registration stats endpoint: ' + (response.ok ? '✅ Ready' : '❌ Needs auth fix'));
    console.log('- Registration list endpoint: ' + (listResponse.ok ? '✅ Ready' : '❌ Needs auth fix'));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Load environment variables
import '../src/config/env.js';

// Run test
testSimpleStats();
