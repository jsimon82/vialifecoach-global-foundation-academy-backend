#!/usr/bin/env node

/**
 * Deep Debug Coordinator Dashboard
 * Investigate why events are not showing in coordinator dashboard
 */

import fetch from 'node-fetch';

async function deepDebugCoordinator() {
  console.log('🔍 Deep Debugging Coordinator Dashboard...\n');

  try {
    // Step 1: Verify backend is running and accessible
    console.log('1️⃣ Verifying backend server...');
    const healthResponse = await fetch('http://localhost:5000/api/v1/health');
    if (healthResponse.ok) {
      console.log('✅ Backend server is running');
    } else {
      console.log('❌ Backend server not accessible');
      return;
    }

    // Step 2: Test coordinator login with exact credentials
    console.log('\n2️⃣ Testing coordinator login...');
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

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.status);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    const token = loginData.accessToken;

    // Step 3: Test registration stats with authentication
    console.log('\n3️⃣ Testing registration stats with authentication...');
    const statsResponse = await fetch('http://localhost:5000/api/v1/registration-stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:5174',
        'Content-Type': 'application/json'
      }
    });

    if (!statsResponse.ok) {
      console.log('❌ Stats failed:', statsResponse.status);
      const errorData = await statsResponse.json();
      console.log('Error details:', errorData);
      return;
    }

    const statsData = await statsResponse.json();
    console.log('✅ Stats endpoint works');
    console.log('📊 Data structure analysis:');
    console.log('   - Success:', statsData.success);
    console.log('   - Has data:', !!statsData.data);
    console.log('   - Has events_summary:', !!statsData.data?.events_summary);
    console.log('   - Events summary length:', statsData.data?.events_summary?.length || 0);
    console.log('   - Upcoming events count:', statsData.data?.event_stats?.upcoming_events || 0);

    // Step 4: Check if frontend is running
    console.log('\n4️⃣ Checking if frontend is running...');
    try {
      const frontendResponse = await fetch('http://localhost:5174');
      if (frontendResponse.ok) {
        console.log('✅ Frontend server is running');
      } else {
        console.log('❌ Frontend server not accessible');
      }
    } catch (error) {
      console.log('❌ Frontend server not running on port 5174');
      console.log('🔍 This might be the issue - frontend needs to be running');
    }

    // Step 5: Test if frontend can access the data
    console.log('\n5️⃣ Testing frontend-coordinator connection...');
    try {
      const frontendStatsResponse = await fetch('http://localhost:5000/api/v1/registration-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Origin': 'http://localhost:5174',
          'Referer': 'http://localhost:5174/coordinator',
          'Content-Type': 'application/json'
        }
      });

      if (frontendStatsResponse.ok) {
        const frontendData = await frontendStatsResponse.json();
        console.log('✅ Frontend can access coordinator data');
        console.log('📊 Frontend data events count:', frontendData.data?.events_summary?.length || 0);
      } else {
        console.log('❌ Frontend cannot access coordinator data');
      }
    } catch (error) {
      console.log('❌ Frontend-coordinator connection failed:', error.message);
    }

    // Step 6: Check if there are any console errors or issues
    console.log('\n6️⃣ Possible issues to check:');
    console.log('   📋 Frontend server must be running on port 5174');
    console.log('   📋 Coordinator must be logged in with valid token');
    console.log('   📋 Frontend must be accessing the correct endpoint');
    console.log('   📋 JavaScript errors in browser console');
    console.log('   📋 Network tab showing failed requests');
    console.log('   📋 Component rendering issues in React');

    console.log('\n🎯 Debugging complete!');
    console.log('📋 If backend data is correct but events not showing:');
    console.log('   1. Start frontend server: npm run dev in frontend directory');
    console.log('   2. Check browser console for JavaScript errors');
    console.log('   3. Check network tab for failed API requests');
    console.log('   4. Verify coordinator login flow is working');
    console.log('   5. Check React component rendering');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run debug
deepDebugCoordinator();
