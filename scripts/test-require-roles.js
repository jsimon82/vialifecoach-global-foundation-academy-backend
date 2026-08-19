#!/usr/bin/env node

/**
 * Test requireRoles function
 * Test if the requireRoles function is working correctly
 */

import { normalizeRole, requireRoles } from '../src/middlewares/auth.middleware.js';

// Mock request and response objects
function createMockRequest(user) {
  return {
    user: user
  };
}

function createMockResponse() {
  let statusCode = 200;
  let message = '';
  
  return {
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => {
          message = data.message;
        }
      };
    }
  };
}

// Test the requireRoles function
function testRequireRoles() {
  console.log('🧪 Testing requireRoles function...\n');

  // Test 1: Coordinator role should work
  console.log('1️⃣ Testing coordinator role...');
  const req1 = createMockRequest({ role: 'coordinator' });
  const res1 = createMockResponse();
  const next1 = () => console.log('✅ Coordinator role passed');
  
  const middleware1 = requireRoles('coordinator', 'admin');
  middleware1(req1, res1, next1);

  // Test 2: Admin role should work
  console.log('\n2️⃣ Testing admin role...');
  const req2 = createMockRequest({ role: 'admin' });
  const res2 = createMockResponse();
  const next2 = () => console.log('✅ Admin role passed');
  
  const middleware2 = requireRoles('coordinator', 'admin');
  middleware2(req2, res2, next2);

  // Test 3: User role should fail
  console.log('\n3️⃣ Testing user role (should fail)...');
  const req3 = createMockRequest({ role: 'user' });
  const res3 = createMockResponse();
  const next3 = () => console.log('❌ User role should not pass');
  
  const middleware3 = requireRoles('coordinator', 'admin');
  middleware3(req3, res3, next3);

  // Test 4: No user should fail
  console.log('\n4️⃣ Testing no user (should fail)...');
  const req4 = createMockRequest(null);
  const res4 = createMockResponse();
  const next4 = () => console.log('❌ No user should not pass');
  
  const middleware4 = requireRoles('coordinator', 'admin');
  middleware4(req4, res4, next4);

  // Test 5: Test normalizeRole function
  console.log('\n5️⃣ Testing normalizeRole function...');
  console.log(`   normalizeRole('coordinator') = "${normalizeRole('coordinator')}"`);
  console.log(`   normalizeRole('admin') = "${normalizeRole('admin')}"`);
  console.log(`   normalizeRole('lecturer') = "${normalizeRole('lecturer')}"`);
  console.log(`   normalizeRole('user') = "${normalizeRole('user')}"`);
  console.log(`   normalizeRole(null) = "${normalizeRole(null)}"`);

  console.log('\n🎯 requireRoles function test complete');
}

// Run test
testRequireRoles();
