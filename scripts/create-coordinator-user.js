#!/usr/bin/env node

/**
 * Create Coordinator User Script
 * This script creates a coordinator user using environment variables
 */

import bcrypt from 'bcrypt';
import { supabase } from '../src/config/supabase.js';

async function createCoordinatorUser() {
  console.log('🔧 Creating Coordinator User...\n');

  try {
    // Get credentials from environment
    const email = process.env.COORDINATOR_EMAIL || process.env.VITE_COORDINATOR_EMAIL;
    const password = process.env.COORDINATOR_PASSWORD || process.env.VITE_COORDINATOR_PASSWORD;

    if (!email || !password) {
      console.log('❌ Missing environment variables:');
      console.log('   Please set COORDINATOR_EMAIL and COORDINATOR_PASSWORD');
      console.log('   Or VITE_COORDINATOR_EMAIL and VITE_COORDINATOR_PASSWORD');
      return;
    }

    console.log(`📧 Creating coordinator: ${email}`);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Check if coordinator already exists
    const { data: existing } = await supabase
      .from('coordinators')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      console.log('🔄 Updating existing coordinator password...');
      
      // Update existing coordinator
      const { error: updateError } = await supabase
        .from('coordinators')
        .update({
          password_hash: passwordHash,
          is_active: true
        })
        .eq('email', email);

      if (updateError) {
        console.log('❌ Failed to update coordinator:', updateError.message);
        return;
      }

      console.log('✅ Coordinator password updated successfully!');
    } else {
      console.log('➕ Creating new coordinator...');
      
      // Create new coordinator
      const { error: createError } = await supabase
        .from('coordinators')
        .insert([{
          email,
          password_hash: passwordHash,
          first_name: 'Event',
          last_name: 'Coordinator',
          phone: '+1234567890',
          department: 'Events Management',
          is_active: true
        }]);

      if (createError) {
        console.log('❌ Failed to create coordinator:', createError.message);
        return;
      }

      console.log('✅ Coordinator created successfully!');
    }

    console.log('\n🎯 Setup Complete!');
    console.log(`📧 Email: ${email}`);
    console.log('🔑 Password: [from environment variable]');
    console.log('🌐 Login URL: http://localhost:5174/coordinator/login');

  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('💡 Make sure:');
    console.log('   - Supabase is configured');
    console.log('   - Environment variables are set');
    console.log('   - Database tables exist');
  }
}

// Load environment variables
import '../src/config/env.js';

// Run the script
createCoordinatorUser();
