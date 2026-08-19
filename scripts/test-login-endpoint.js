#!/usr/bin/env node

/**
 * Test Login Endpoint
 * Simple script to test the coordinator login endpoint
 */

import fetch from 'node-fetch';

async function testLoginEndpoint() {
  const API_BASE_URL = 'http://localhost:5000/api/v1';
  const email = process.env.COORDINATOR_EMAIL || process.env.VITE_COORDINATOR_EMAIL || 'support@vialifecoach.org';
  const password = process.env.COORDINATOR_PASSWORD || process.env.VITE_COORDINATOR_PASSWORD;

  console.log('🧪 Testing coordinator login endpoint...');
  console.log('📧 Email:', email);
  console.log('🔑 Password:', password ? 'SET' : 'NOT SET');

  try {
    const response = await fetch(`${API_BASE_URL}/coordinator/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('📋 Response:', {
        accessToken: data.accessToken ? 'RECEIVED' : 'MISSING',
        user: data.user
      });
    } else {
      console.log('❌ Login failed');
      console.log('🔍 Status:', response.status);
      console.log('📋 Error:', data);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

// Load environment variables
import '../src/config/env.js';

// Run the test
testLoginEndpoint();
