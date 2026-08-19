#!/usr/bin/env node

/**
 * Test Frontend Routes
 * Test if the frontend coordinator dashboard route exists and is accessible
 */

import fetch from 'node-fetch';

async function testFrontendRoutes() {
  console.log('🧪 Testing Frontend Routes...\n');

  try {
    // Test if frontend is running
    console.log('1️⃣ Testing frontend server...');
    const frontendResponse = await fetch('http://localhost:5174', {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5174'
      }
    });

    console.log(`   Frontend Status: ${frontendResponse.status}`);
    
    if (frontendResponse.ok) {
      console.log('✅ Frontend server is running');
    } else {
      console.log('❌ Frontend server not accessible');
      return;
    }

    // Test coordinator dashboard route
    console.log('\n2️⃣ Testing coordinator dashboard route...');
    const dashboardResponse = await fetch('http://localhost:5174/coordinator', {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5174',
        'Referer': 'http://localhost:5174/'
      }
    });

    console.log(`   Dashboard Route Status: ${dashboardResponse.status}`);
    
    if (dashboardResponse.ok) {
      console.log('✅ Coordinator dashboard route exists');
    } else {
      console.log('❌ Coordinator dashboard route not accessible');
      console.log('🔍 This might be a frontend routing issue');
    }

    // Test login route
    console.log('\n3️⃣ Testing login route...');
    const loginResponse = await fetch('http://localhost:5174/login', {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5174'
      }
    });

    console.log(`   Login Route Status: ${loginResponse.status}`);
    
    if (loginResponse.ok) {
      console.log('✅ Login route exists');
    } else {
      console.log('❌ Login route not accessible');
    }

    console.log('\n🎯 Frontend routes test complete!');
    console.log('📋 If frontend routes are working, the issue might be:');
    console.log('   1. Frontend authentication state');
    console.log('   2. Coordinator dashboard component');
    console.log('   3. Route protection logic');
    console.log('   4. Component rendering issues');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Possible causes:');
    console.error('   - Frontend server not running on port 5174');
    console.error('   - Network connectivity issues');
    console.error('   - CORS issues');
  }
}

// Run test
testFrontendRoutes();
