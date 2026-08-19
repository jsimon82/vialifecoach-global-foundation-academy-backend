#!/usr/bin/env node

/**
 * Test Fixed Registration Stats Controller
 * Test the fixed controller directly to verify no undefined length errors
 */

import { getRegistrationStats } from '../src/controllers/registrationStats.controller.js';

// Mock request and response objects
function createMockRequest(user) {
  return {
    user: user
  };
}

function createMockResponse() {
  let statusCode = 200;
  let responseData = null;
  
  return {
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => {
          responseData = data;
        }
      };
    },
    json: (data) => {
      responseData = data;
    },
    getStatusCode: () => statusCode,
    getData: () => responseData
  };
}

function createMockNext() {
  let error = null;
  return {
    setError: (err) => { error = err; },
    getError: () => error
  };
}

// Test the fixed controller
async function testFixedController() {
  console.log('🧪 Testing Fixed Registration Stats Controller...\n');

  try {
    // Test 1: Valid coordinator user
    console.log('1️⃣ Testing with valid coordinator user...');
    const req1 = createMockRequest({
      id: 1,
      email: 'support@vialifecoach.org',
      role: 'coordinator'
    });
    const res1 = createMockResponse();
    const next1 = createMockNext();

    await getRegistrationStats(req1, res1, next1);
    
    if (next1.getError()) {
      console.log('❌ Controller threw error:', next1.getError().message);
    } else {
      console.log('✅ Controller executed without throwing errors');
      console.log('📊 Response status:', res1.getStatusCode());
      
      if (res1.getStatusCode() === 200) {
        const data = res1.getData();
        console.log('📋 Response structure:');
        console.log('   - success:', data.success);
        console.log('   - registration_stats:', data.data?.registration_stats ? '✅ Present' : '❌ Missing');
        console.log('   - event_stats:', data.data?.event_stats ? '✅ Present' : '❌ Missing');
        console.log('   - recent_registrations:', Array.isArray(data.data?.recent_registrations) ? '✅ Array' : '❌ Not array');
        console.log('   - events_summary:', Array.isArray(data.data?.events_summary) ? '✅ Array' : '❌ Not array');
        
        // Check for undefined length errors
        if (data.data?.recent_registrations !== undefined && data.data?.events_summary !== undefined) {
          console.log('✅ No undefined length errors detected');
        } else {
          console.log('❌ Still has undefined values');
        }
      } else {
        console.log('❌ Controller returned error status:', res1.getStatusCode());
        console.log('🔍 Error message:', res1.getData()?.message);
      }
    }

    // Test 2: Invalid user (should return 403)
    console.log('\n2️⃣ Testing with invalid user...');
    const req2 = createMockRequest({
      id: 2,
      email: 'user@example.com',
      role: 'user'
    });
    const res2 = createMockResponse();
    const next2 = createMockNext();

    await getRegistrationStats(req2, res2, next2);
    
    if (res2.getStatusCode() === 403) {
      console.log('✅ Properly rejected unauthorized user');
    } else {
      console.log('❌ Should have rejected unauthorized user');
    }

    // Test 3: No user (should return 403)
    console.log('\n3️⃣ Testing with no user...');
    const req3 = createMockRequest(null);
    const res3 = createMockResponse();
    const next3 = createMockNext();

    await getRegistrationStats(req3, res3, next3);
    
    if (res3.getStatusCode() === 403) {
      console.log('✅ Properly rejected missing user');
    } else {
      console.log('❌ Should have rejected missing user');
    }

    console.log('\n🎯 Controller test complete!');
    console.log('📋 The undefined length error should be resolved in the controller');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Stack trace:', error.stack);
  }
}

// Run test
testFixedController();
