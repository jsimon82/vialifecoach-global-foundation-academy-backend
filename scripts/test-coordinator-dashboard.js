#!/usr/bin/env node

/**
 * Test Coordinator Dashboard
 * Test the coordinator login and dashboard functionality
 */

import fetch from 'node-fetch';

async function testCoordinatorDashboard() {
  console.log('🧪 Testing Coordinator Dashboard...\n');

  try {
    // Step 1: Test coordinator login
    console.log('1️⃣ Testing coordinator login...');
    const loginResponse = await fetch('http://localhost:5000/api/v1/coordinator/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5174'
      },
      body: JSON.stringify({
        email: 'support@vialifecoach.org',
        password: 'Support82Via!'
      })
    });

    console.log(`   Login Status: ${loginResponse.status}`);
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.log('❌ Login failed:', errorData.message);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('📋 Response:', JSON.stringify(loginData, null, 2));

    const token = loginData.accessToken;

    // Step 2: Test registration stats endpoint
    console.log('\n2️⃣ Testing registration stats endpoint...');
    const statsResponse = await fetch('http://localhost:5000/api/v1/registration-stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:5174',
        'Referer': 'http://localhost:5174/'
      }
    });

    console.log(`   Stats Status: ${statsResponse.status}`);
    
    if (!statsResponse.ok) {
      const errorData = await statsResponse.json();
      console.log('❌ Stats failed:', errorData.message);
      return;
    }

    const statsData = await statsResponse.json();
    console.log('✅ Stats endpoint works');
    console.log('📊 Data structure:', JSON.stringify(statsData, null, 2));

    // Step 3: Test frontend access simulation
    console.log('\n3️⃣ Testing frontend access simulation...');
    
    // Simulate what the frontend would do
    const frontendTest = await fetch('http://localhost:5000/api/v1/registration-stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:5174',
        'Referer': 'http://localhost:5174/coordinator',
        'Content-Type': 'application/json'
      }
    });

    console.log(`   Frontend test Status: ${frontendTest.status}`);
    
    if (frontendTest.ok) {
      const frontendData = await frontendTest.json();
      console.log('✅ Frontend access works');
      console.log('📊 Data keys:', Object.keys(frontendData.data || {}));
      console.log('📊 Registration stats present:', !!frontendData.data?.registration_stats);
      console.log('📊 Event stats present:', !!frontendData.data?.event_stats);
      console.log('📊 Recent registrations:', Array.isArray(frontendData.data?.recent_registrations) ? frontendData.data.recent_registrations.length : 'Not array');
      console.log('📊 Events summary:', Array.isArray(frontendData.data?.events_summary) ? frontendData.data.events_summary.length : 'Not array');
    } else {
      console.log('❌ Frontend access failed');
    }

    console.log('\n🎯 Coordinator dashboard test complete!');
    console.log('📋 If all tests passed, the dashboard should work');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Stack trace:', error.stack);
  }
}

// Run test
testCoordinatorDashboard();
