#!/usr/bin/env node

/**
 * Add Missing Columns to Events Table
 * Add current_participants and other required columns for dual registration
 */

import { supabase } from '../src/config/supabase.js';

async function addEventsColumns() {
  console.log('🔧 Adding Missing Columns to Events Table...\n');

  try {
    // Add current_participants column
    console.log('1️⃣ Adding current_participants column...');
    const { error: participantsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE events ADD COLUMN IF NOT EXISTS current_participants INTEGER DEFAULT 0'
    });

    if (participantsError) {
      console.log('⚠️  Could not add current_participants via RPC, trying direct approach...');
      
      // Try direct insert with the column to see if it exists
      try {
        const { data: testEvent, error: testError } = await supabase
          .from('events')
          .insert({
            title: 'Test Event Column Check',
            event_type: 'webinar',
            event_date: new Date(),
            status: 'upcoming',
            current_participants: 0
          })
          .select()
          .single();

        if (testError) {
          console.log('❌ current_participants column still missing:', testError.message);
          console.log('📋 Manual SQL required: ALTER TABLE events ADD COLUMN current_participants INTEGER DEFAULT 0');
        } else {
          console.log('✅ current_participants column exists');
          // Clean up
          await supabase.from('events').delete().eq('id', testEvent.id);
        }
      } catch (error) {
        console.log('❌ Column test failed:', error.message);
      }
    } else {
      console.log('✅ current_participants column added via RPC');
    }

    // Add source column to event_registrations
    console.log('\n2️⃣ Adding source column to event_registrations...');
    try {
      const { data: testReg, error: regError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: 1,
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          phone: '+1234567890',
          source: 'dual'
        })
        .select()
        .single();

      if (regError) {
        console.log('❌ source column missing:', regError.message);
        console.log('📋 Manual SQL required: ALTER TABLE event_registrations ADD COLUMN source TEXT DEFAULT \'coordinator\'');
      } else {
        console.log('✅ source column exists');
        // Clean up
        await supabase.from('event_registrations').delete().eq('id', testReg.id);
      }
    } catch (error) {
      console.log('❌ Registration column test failed:', error.message);
    }

    console.log('\n🎯 Column addition process complete');
    console.log('\n📋 Manual SQL Steps Required (if automatic failed):');
    console.log('1. ALTER TABLE events ADD COLUMN current_participants INTEGER DEFAULT 0');
    console.log('2. ALTER TABLE event_registrations ADD COLUMN source TEXT DEFAULT \'coordinator\'');
    console.log('3. ALTER TABLE event_registrations ADD COLUMN community_registration_id INTEGER');
    console.log('4. ALTER TABLE event_registrations ADD COLUMN sync_status TEXT DEFAULT \'synced\'');

  } catch (error) {
    console.error('❌ Column addition failed:', error.message);
  }
}

// Load environment variables
import '../src/config/env.js';

// Run column addition
addEventsColumns();
