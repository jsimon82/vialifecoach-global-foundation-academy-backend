#!/usr/bin/env node

/**
 * Debug Event Sync Endpoint
 * Debug the event sync creation issue
 */

import fetch from 'node-fetch';

async function debugEventSync() {
  console.log('🔍 Debugging Event Sync Endpoint...\n');

  const API_BASE_URL = 'http://localhost:5000/api/v1';

  try {
    // Test with minimal data
    console.log('1️⃣ Testing with minimal event data...');
    const minimalEvent = {
      community_event_id: 123,
      title: 'Test Event',
      start_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const response = await fetch(`${API_BASE_URL}/sync/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(minimalEvent)
    });

    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${response.ok ? '✅' : '❌'}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.log('\n🔍 Trying to identify the issue...');
      
      // Test if events table exists and is accessible
      console.log('\n2️⃣ Testing events table access...');
      try {
        const eventsResponse = await fetch(`${API_BASE_URL}/events`, {
          headers: {
            'Authorization': 'Bearer fake-token-for-testing'
          }
        });
        console.log(`   Events endpoint status: ${eventsResponse.status}`);
        
        if (eventsResponse.status === 401) {
          console.log('   ✅ Events endpoint exists (auth required as expected)');
        } else {
          console.log('   ❌ Events endpoint issue');
        }
      } catch (error) {
        console.log(`   Events test failed: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Load environment variables
import '../src/config/env.js';

// Run debug
debugEventSync();
