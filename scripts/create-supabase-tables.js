#!/usr/bin/env node

/**
 * Create Supabase Tables Script
 * This script creates the coordinator tables in Supabase
 */

import { supabase } from '../src/config/supabase.js';

async function createSupabaseTables() {
  console.log('🔧 Creating coordinator tables in Supabase...\n');

  try {
    // Create coordinators table
    console.log('1️⃣ Creating coordinators table...');
    const { error: coordinatorError } = await supabase
      .from('coordinators')
      .select('id')
      .limit(1);

    if (coordinatorError && coordinatorError.code === 'PGRST116') {
      // Table doesn't exist, create it using raw SQL
      console.log('📝 Table does not exist, creating via SQL...');
      
      // For now, we'll use the Supabase Dashboard to create tables
      console.log('⚠️  Please create tables manually in Supabase Dashboard:');
      console.log('   1. Go to https://supabase.com/dashboard');
      console.log('   2. Select your project');
      console.log('   3. Go to SQL Editor');
      console.log('   4. Run the following SQL:');
      
      const sql = `
-- Create coordinators table
CREATE TABLE IF NOT EXISTS coordinators (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL,
    event_date TIMESTAMP NOT NULL,
    event_duration INTEGER DEFAULT 60,
    max_participants INTEGER,
    registration_deadline TIMESTAMP,
    status VARCHAR(20) DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    organization VARCHAR(255),
    job_title VARCHAR(255),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'registered',
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON event_registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON event_registrations(status);
      `;
      
      console.log('\n' + sql);
      
    } else if (coordinatorError) {
      console.log('❌ Error checking coordinators table:', coordinatorError.message);
    } else {
      console.log('✅ Coordinators table exists');
    }

    console.log('\n🎯 After creating tables in Supabase Dashboard:');
    console.log('1. Run: node scripts/create-coordinator-user.js');
    console.log('2. Test: node scripts/debug-coordinator-login.js');
    console.log('3. Start backend: npm start');
    console.log('4. Test login at: http://localhost:5174/coordinator/login');

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Load environment variables
import '../src/config/env.js';

// Run the script
createSupabaseTables();
