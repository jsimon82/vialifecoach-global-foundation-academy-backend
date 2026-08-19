#!/usr/bin/env node

/**
 * Test Curl Login
 * Test the coordinator login endpoint with proper JSON
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Load environment variables from the backend .env file.
import '../src/config/env.js';

async function testCurlLogin() {
  console.log('🧪 Testing coordinator login with curl...\n');

  try {
    const email = process.env.COORDINATOR_EMAIL || process.env.VITE_COORDINATOR_EMAIL || 'support@vialifecoach.org';
    const password = process.env.COORDINATOR_PASSWORD || process.env.VITE_COORDINATOR_PASSWORD || 'Support82Via!';

    const payload = JSON.stringify({
      email,
      password
    });

    const { stdout, stderr } = await execAsync(
      `curl -s -X POST http://localhost:5000/api/v1/coordinator/login -H "Content-Type: application/json" --data-raw '${payload}'`,
      { shell: true }
    );

    console.log('📋 Response:', stdout);
    
    if (stderr) {
      console.log('⚠️  Stderr:', stderr);
    }

    if (stdout.includes('accessToken')) {
      console.log('✅ Login successful!');
    } else if (stdout.includes('401') || stdout.includes('Unauthorized')) {
      console.log('❌ 401 Unauthorized - check the coordinator email/password used by this script');
    } else {
      console.log('🔍 Unexpected response - check backend logs');
    }

  } catch (error) {
    console.log('❌ Curl test failed:', error.message);
  }
}

testCurlLogin();
