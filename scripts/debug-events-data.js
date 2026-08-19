#!/usr/bin/env node

/**
 * Debug Events Data
 * Compare the data structure between community events and coordinator dashboard events
 */

import fetch from 'node-fetch';

async function debugEventsData() {
  console.log('🔍 Debugging Events Data Structure...\n');

  try {
    // Test 1: Community Events (what works in frontend)
    console.log('1️⃣ Testing Community Events endpoint...');
    const communityResponse = await fetch('http://localhost:5000/api/v1/community/events', {
      headers: {
        'Origin': 'http://localhost:5174'
      }
    });

    if (communityResponse.ok) {
      const communityEvents = await communityResponse.json();
      console.log('✅ Community Events Status:', communityResponse.status);
      console.log('📊 Community Events Count:', communityEvents.length);
      console.log('📋 Sample Event Structure:');
      console.log(JSON.stringify(communityEvents[0], null, 2));
    } else {
      console.log('❌ Community Events failed:', communityResponse.status);
    }

    // Test 2: Coordinator Registration Stats (what's not showing events)
    console.log('\n2️⃣ Testing Coordinator Registration Stats...');
    const coordinatorResponse = await fetch('http://localhost:5000/api/v1/registration-stats', {
      headers: {
        'Authorization': 'Bearer mock-token-for-testing',
        'Origin': 'http://localhost:5174'
      }
    });

    if (coordinatorResponse.ok) {
      const coordinatorData = await coordinatorResponse.json();
      console.log('✅ Coordinator Stats Status:', coordinatorResponse.status);
      console.log('📊 Events Summary Count:', coordinatorData.data?.events_summary?.length || 0);
      console.log('📊 Upcoming Events:', coordinatorData.data?.event_stats?.upcoming_events || 0);
      
      if (coordinatorData.data?.events_summary && coordinatorData.data.events_summary.length > 0) {
        console.log('📋 Sample Events Summary Structure:');
        console.log(JSON.stringify(coordinatorData.data.events_summary[0], null, 2));
      } else {
        console.log('❌ No events in events_summary');
      }
    } else {
      console.log('❌ Coordinator Stats failed:', coordinatorResponse.status);
    }

    // Test 3: Check if there's a separate events endpoint for coordinators
    console.log('\n3️⃣ Testing if there are other event endpoints...');
    
    // Test common endpoints that might exist
    const possibleEndpoints = [
      '/api/v1/events',
      '/api/v1/coordinator/events',
      '/api/v1/admin/events',
      '/api/v1/management/events'
    ];

    for (const endpoint of possibleEndpoints) {
      try {
        const testResponse = await fetch(`http://localhost:5000${endpoint}`, {
          headers: {
            'Authorization': 'Bearer mock-token-for-testing',
            'Origin': 'http://localhost:5174'
          }
        });
        
        if (testResponse.ok) {
          const data = await testResponse.json();
          console.log(`✅ Found working endpoint: ${endpoint}`);
          console.log(`📊 Data type: ${Array.isArray(data) ? 'Array' : typeof data}`);
          if (Array.isArray(data)) {
            console.log(`📊 Count: ${data.length}`);
          }
        }
      } catch (error) {
        // Endpoint doesn't exist, continue
      }
    }

    console.log('\n🎯 Debugging complete!');
    console.log('📋 Analysis:');
    console.log('   - Community events work and return proper data');
    console.log('   - Coordinator stats returns events_summary but it might be empty');
    console.log('   - Need to check if coordinator dashboard expects different data format');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run debug
debugEventsData();
