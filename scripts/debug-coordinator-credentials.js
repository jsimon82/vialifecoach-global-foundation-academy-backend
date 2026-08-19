#!/usr/bin/env node

/**
 * Debug Coordinator Credentials
 * Check what credentials are stored vs what's being sent
 */

import { supabase } from '../src/config/supabase.js';
import bcrypt from 'bcrypt';

async function debugCoordinatorCredentials() {
  console.log('🔍 Debugging coordinator credentials...\n');

  const email = 'support@vialifecoach.org';
  const password = process.env.COORDINATOR_PASSWORD || process.env.VITE_COORDINATOR_PASSWORD;

  console.log('📧 Email being tested:', email);
  console.log('🔑 Password from env:', password ? 'SET' : 'NOT SET');

  try {
    // 1. Check if coordinator exists in database
    console.log('\n1️⃣ Checking coordinator in database...');
    const { data: coordinator, error: fetchError } = await supabase
      .from('coordinators')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (fetchError) {
      console.log('❌ Fetch error:', fetchError.message);
      return;
    }

    if (!coordinator) {
      console.log('❌ Coordinator not found in database');
      return;
    }

    console.log('✅ Coordinator found:');
    console.log('   ID:', coordinator.id);
    console.log('   Email:', coordinator.email);
    console.log('   First Name:', coordinator.first_name);
    console.log('   Last Name:', coordinator.last_name);
    console.log('   Active:', coordinator.is_active);
    console.log('   Password Hash:', coordinator.password_hash ? 'EXISTS' : 'MISSING');

    // 2. Test password comparison
    console.log('\n2️⃣ Testing password comparison...');
    if (!coordinator.password_hash) {
      console.log('❌ No password hash stored in database');
      return;
    }

    const isValidPassword = await bcrypt.compare(password, coordinator.password_hash);
    console.log('   Password valid:', isValidPassword);

    // 3. Show hash details (for debugging)
    console.log('\n3️⃣ Hash details:');
    console.log('   Hash length:', coordinator.password_hash.length);
    console.log('   Hash starts with:', coordinator.password_hash.substring(0, 10) + '...');

    // 4. Test with different passwords
    console.log('\n4️⃣ Testing common passwords...');
    const testPasswords = [
      'Suport82Via@',
      'support@vialifecoach.org',
      'password',
      'admin',
      '123456'
    ];

    for (const testPwd of testPasswords) {
      const testValid = await bcrypt.compare(testPwd, coordinator.password_hash);
      console.log(`   "${testPwd}": ${testValid ? '✅ VALID' : '❌ INVALID'}`);
    }

  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

// Load environment variables
import '../src/config/env.js';

// Run the debug
debugCoordinatorCredentials();
