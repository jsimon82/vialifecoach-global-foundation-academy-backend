#!/usr/bin/env node

/**
 * Debug Route Matching
 * Test if the coordinator login route is being hit correctly
 */

import fetch from 'node-fetch';

async function debugRouteMatching() {
  console.log('🔍 Debugging route matching...\n');

  // Test different paths to see what's being hit
  const testPaths = [
    '/api/v1/coordinator/login',
    '/api/v1/coordinator/login/',
    '/coordinator/login',
    '/api/v1/auth/login',
    '/api/v1/admin/auth/login'
  ];

  const email = 'support@vialifecoach.org';
  const password = process.env.COORDINATOR_PASSWORD || process.env.VITE_COORDINATOR_PASSWORD;

  for (const path of testPaths) {
    console.log(`\n🧪 Testing path: ${path}`);
    
    try {
      const response = await fetch(`http://localhost:5000${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Success: ${response.ok ? '✅' : '❌'}`);
      
      if (response.ok) {
        console.log(`   Response: ${data.message || 'Login successful'}`);
        if (data.user) {
          console.log(`   User role: ${data.user.role}`);
        }
      } else {
        console.log(`   Error: ${data.message || data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`   Request failed: ${error.message}`);
    }
  }

  console.log('\n🎯 Check which path actually works for coordinator login.');
}

// Load environment variables
import '../src/config/env.js';

// Run the debug
debugRouteMatching();
