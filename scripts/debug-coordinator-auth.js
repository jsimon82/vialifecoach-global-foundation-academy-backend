#!/usr/bin/env node

/**
 * Debug Coordinator Authentication
 * Debug the coordinator authentication issue
 */

import fetch from 'node-fetch';

async function debugCoordinatorAuth() {
  console.log('🔍 Debugging Coordinator Authentication...\n');

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
    console.log('📋 Token payload:', JSON.stringify({
      email: loginData.user.email,
      role: loginData.user.role,
      name: loginData.user.name
    }, null, 2));

    // Step 2: Test a simple endpoint that doesn't require roles
    console.log('\n2️⃣ Testing coordinator profile endpoint...');
    const profileResponse = await fetch(`${API_BASE_URL}/coordinator/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const profileData = await profileResponse.json();
    
    console.log(`   Profile Status: ${profileResponse.status}`);
    console.log(`   Success: ${profileResponse.ok ? '✅' : '❌'}`);
    
    if (profileResponse.ok) {
      console.log('✅ Coordinator profile works');
      console.log('📋 Profile data:', JSON.stringify(profileData, null, 2));
    } else {
      console.log('❌ Profile failed:', profileData.message);
    }

    // Step 3: Test registration stats with debug info
    console.log('\n3️⃣ Testing registration stats with debug...');
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
      console.log('🔍 This suggests the requireRoles middleware is blocking coordinator access');
    } else {
      console.log('✅ Stats works!');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Load environment variables
import '../src/config/env.js';

// Run debug
debugCoordinatorAuth();
