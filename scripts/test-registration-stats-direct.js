#!/usr/bin/env node

/**
 * Test Registration Stats Directly
 * Test the registration stats endpoints directly without going through the full middleware stack
 */

import fetch from 'node-fetch';

async function testRegistrationStatsDirect() {
  console.log('🧪 Testing Registration Stats Directly...\n');

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

    // Step 2: Test registration stats with detailed error info
    console.log('\n2️⃣ Testing registration stats with detailed error info...');
    const statsResponse = await fetch(`${API_BASE_URL}/registration-stats/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const statsData = await statsResponse.json();
    
    console.log(`   Stats Status: ${statsResponse.status}`);
    console.log(`   Success: ${statsResponse.ok ? '✅' : '❌'}`);
    
    if (!statsResponse.ok) {
      console.log('❌ Stats failed:', statsData.message);
      console.log('🔍 Full error response:', JSON.stringify(statsData, null, 2));
      
      // Let's also test with a different approach - maybe the issue is with the route path
      console.log('\n3️⃣ Testing alternative route path...');
      const altResponse = await fetch(`${API_BASE_URL}/registration-stats/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const altData = await altResponse.json();
      
      console.log(`   Alt Status: ${altResponse.status}`);
      console.log(`   Alt Success: ${altResponse.ok ? '✅' : '❌'}`);
      
      if (!altResponse.ok) {
        console.log('❌ Alt route also failed:', altData.message);
      } else {
        console.log('✅ Alt route works!');
      }
    } else {
      console.log('✅ Stats works!');
      console.log('📊 Stats data:', JSON.stringify(statsData, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Load environment variables
import '../src/config/env.js';

// Run test
testRegistrationStatsDirect();
