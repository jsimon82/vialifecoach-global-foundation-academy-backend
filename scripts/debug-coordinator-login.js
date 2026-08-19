#!/usr/bin/env node

/**
 * Debug Coordinator Login Script
 * This script helps identify why coordinator login is failing
 */

import bcrypt from 'bcrypt';
import { supabase } from '../src/config/supabase.js';

async function debugCoordinatorLogin() {
  console.log('🔍 Debugging Coordinator Login...\n');

  try {
    // Check environment variables
    console.log('1️⃣ Checking environment variables...');
    const email = process.env.COORDINATOR_EMAIL || process.env.VITE_COORDINATOR_EMAIL;
    const password = process.env.COORDINATOR_PASSWORD || process.env.VITE_COORDINATOR_PASSWORD;

    console.log(`📧 Email: ${email || 'NOT SET'}`);
    console.log(`🔑 Password: ${password ? 'SET' : 'NOT SET'}`);

    if (!email || !password) {
      console.log('❌ Missing environment variables');
      return;
    }

    // Check database connection
    console.log('\n2️⃣ Checking database connection...');
    const { data: coordinators, error: listError } = await supabase
      .from('coordinators')
      .select('id, email, is_active, created_at')
      .eq('email', email);

    if (listError) {
      console.log('❌ Database error:', listError.message);
      return;
    }

    console.log(`📊 Found ${coordinators.length} coordinator(s) with email: ${email}`);

    if (coordinators.length === 0) {
      console.log('❌ No coordinator found with this email');
      console.log('💡 Run: node scripts/create-coordinator-user.js');
      return;
    }

    const coordinator = coordinators[0];
    console.log('👤 Coordinator details:');
    console.log(`   ID: ${coordinator.id}`);
    console.log(`   Email: ${coordinator.email}`);
    console.log(`   Active: ${coordinator.is_active}`);
    console.log(`   Created: ${coordinator.created_at}`);

    // Test password verification
    console.log('\n3️⃣ Testing password verification...');
    const { data: fullCoordinator, error: fetchError } = await supabase
      .from('coordinators')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError) {
      console.log('❌ Error fetching full coordinator:', fetchError.message);
      return;
    }

    const isValidPassword = await bcrypt.compare(password, fullCoordinator.password_hash);
    console.log(`🔐 Password valid: ${isValidPassword}`);

    if (!isValidPassword) {
      console.log('❌ Password does not match');
      console.log('💡 Check if the password in .env matches what was used to create the user');
      
      // Test with a new password hash
      console.log('\n🔄 Testing with new password hash...');
      const testHash = await bcrypt.hash(password, 12);
      const testValid = await bcrypt.compare(password, testHash);
      console.log(`🧪 New hash works: ${testValid}`);
      
      if (testValid) {
        console.log('💡 Consider updating the coordinator password with the new hash');
      }
      return;
    }

    // Test token generation
    console.log('\n4️⃣ Testing token generation...');
    try {
      const { generateAccessToken } = await import('../src/utils/utils.jwt.js');
      const accessToken = generateAccessToken({ 
        id: coordinator.id, 
        email: coordinator.email, 
        role: 'coordinator' 
      });
      console.log('✅ Access token generated successfully');
      console.log(`🔑 Token length: ${accessToken.length}`);
    } catch (tokenError) {
      console.log('❌ Token generation failed:', tokenError.message);
      console.log('💡 Check if ACCESS_TOKEN_SECRET is set in environment');
    }

    console.log('\n🎯 Debug Complete!');
    console.log('If all checks pass, the login should work.');
    console.log('If not, address the issues above and try again.');

  } catch (error) {
    console.log('❌ Debug failed:', error.message);
  }
}

// Load environment variables
import '../src/config/env.js';

// Run the debug
debugCoordinatorLogin();
