#!/usr/bin/env node

/**
 * Test Coordinator Login Setup
 * This script helps verify that the coordinator login system is working
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api/v1';

async function testCoordinatorLogin() {
  console.log('🧪 Testing Coordinator Login Setup...\n');

  try {
    // Test 1: Check if backend is running
    console.log('1️⃣ Checking if backend server is running...');
    const healthResponse = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/`);
    
    if (healthResponse.ok) {
      console.log('✅ Backend server is running');
    } else {
      console.log('❌ Backend server is not responding');
      return;
    }

    // Test 2: Test coordinator login
    console.log('\n2️⃣ Testing coordinator login...');
    const coordinatorEmail = process.env.COORDINATOR_EMAIL || process.env.VITE_COORDINATOR_EMAIL || 'support@vialifecoach.org';
    const coordinatorPassword = process.env.COORDINATOR_PASSWORD || process.env.VITE_COORDINATOR_PASSWORD;
    
    if (!coordinatorPassword) {
      console.log('❌ Coordinator password not found in environment variables');
      console.log('💡 Please set COORDINATOR_PASSWORD or VITE_COORDINATOR_PASSWORD');
      return;
    }
    
    const loginResponse = await fetch(`${API_BASE_URL}/coordinator/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: coordinatorEmail,
        password: coordinatorPassword
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Coordinator login successful!');
      console.log('📋 User data:', {
        id: loginData.user.id,
        name: loginData.user.name,
        email: loginData.user.email,
        role: loginData.user.role,
        department: loginData.user.department
      });
      console.log('🔑 Access token received');

      // Test 3: Test authenticated API call
      console.log('\n3️⃣ Testing authenticated API call...');
      const eventsResponse = await fetch(`${API_BASE_URL}/events`, {
        headers: {
          'Authorization': `Bearer ${loginData.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        console.log('✅ Authenticated API call successful!');
        console.log(`📊 Found ${eventsData.data?.length || 0} events`);
        
        // Test 4: Test registration stats
        console.log('\n4️⃣ Testing registration stats...');
        const statsResponse = await fetch(`${API_BASE_URL}/registration-stats`, {
          headers: {
            'Authorization': `Bearer ${loginData.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log('✅ Registration stats retrieved successfully!');
          console.log('📈 Stats available:', Object.keys(statsData.data || {}));
        } else {
          console.log('⚠️  Registration stats endpoint not working');
        }

      } else {
        console.log('❌ Authenticated API call failed');
      }

    } else {
      const errorData = await loginResponse.text();
      console.log('❌ Coordinator login failed');
      console.log('🔍 Error details:', errorData);
      
      if (loginResponse.status === 401) {
        console.log('💡 Possible causes:');
        console.log('   - Database not set up with coordinator user');
        console.log('   - Incorrect credentials');
        console.log('   - Coordinator user not active');
      }
    }

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.log('💡 Make sure:');
    console.log('   - Backend server is running on port 5000');
    console.log('   - Database tables are created');
    console.log('   - Coordinator user exists in database');
  }

  console.log('\n🎯 Setup Instructions:');
  console.log('1. Set environment variables in .env file:');
  console.log('   COORDINATOR_EMAIL=support@vialifecoach.org');
  console.log('   COORDINATOR_PASSWORD=YourSecurePassword');
  console.log('2. Run coordinator user creation: node scripts/create-coordinator-user.js');
  console.log('3. Start backend server: npm start');
  console.log('4. Test login again with this script');
  console.log('5. Access coordinator dashboard: http://localhost:5174/coordinator/login');
}

// Run the test
testCoordinatorLogin();
