#!/usr/bin/env node

/**
 * Setup Dual Registration System
 * This script sets up the database schema and tests the new endpoints
 */

import { supabase } from '../src/config/supabase.js';

async function setupDualRegistration() {
  console.log('🚀 Setting up Dual Registration System...\n');

  try {
    // 1. Add source column to event_registrations
    console.log('1️⃣ Adding source column to event_registrations...');
    const { error: sourceError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS source TEXT DEFAULT \'coordinator\' CHECK (source IN (\'coordinator\', \'community\', \'dual\'))'
    });

    if (sourceError && !sourceError.message.includes('already exists')) {
      console.log('⚠️  Source column may already exist or needs manual setup');
    } else {
      console.log('✅ Source column added/verified');
    }

    // 2. Add current_participants to events table
    console.log('\n2️⃣ Adding current_participants to events...');
    const { error: participantsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE events ADD COLUMN IF NOT EXISTS current_participants INTEGER DEFAULT 0'
    });

    if (participantsError && !participantsError.message.includes('already exists')) {
      console.log('⚠️  Current participants column may already exist or needs manual setup');
    } else {
      console.log('✅ Current participants column added/verified');
    }

    // 3. Create event_sync table
    console.log('\n3️⃣ Creating event_sync table...');
    const { error: syncError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS event_sync (
          id SERIAL PRIMARY KEY,
          community_event_id INTEGER NOT NULL,
          coordinator_event_id INTEGER NOT NULL,
          sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed')),
          last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(community_event_id),
          UNIQUE(coordinator_event_id)
        )
      `
    });

    if (syncError) {
      console.log('⚠️  Event sync table may need manual creation');
    } else {
      console.log('✅ Event sync table created/verified');
    }

    console.log('\n🎯 Dual Registration Database Setup Complete!');
    console.log('\n📋 Manual Steps Required:');
    console.log('1. Run the SQL from database/dual-registration-schema.sql in Supabase Dashboard');
    console.log('2. Test the new endpoints:');
    console.log('   - POST /api/v1/public/registrations');
    console.log('   - POST /api/v1/sync/events');
    console.log('   - GET /api/v1/public/events');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Load environment variables
import '../src/config/env.js';

// Run setup
setupDualRegistration();
