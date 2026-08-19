#!/usr/bin/env node

/**
 * Fix Registration Tables
 * Create and setup the event_registrations and events tables for registration stats
 */

import { supabase } from '../src/config/supabase.js';

async function fixRegistrationTables() {
  console.log('🔧 Fixing Registration Tables...\n');

  try {
    // Check if event_registrations table exists
    console.log('1️⃣ Checking event_registrations table...');
    const { data: regTableCheck, error: regTableError } = await supabase
      .from('event_registrations')
      .select('count')
      .limit(1);

    if (regTableError) {
      console.log('❌ event_registrations table does not exist');
      console.log('🔍 Error:', regTableError.message);
      
      // Create event_registrations table
      console.log('\n🔨 Creating event_registrations table...');
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS event_registrations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            event_id UUID REFERENCES events(id),
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            organization TEXT,
            job_title TEXT,
            source TEXT DEFAULT 'coordinator' CHECK (source IN ('coordinator', 'community', 'dual')),
            status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'attended')),
            community_registration_id TEXT,
            sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (createError) {
        console.log('❌ Failed to create event_registrations table:', createError.message);
      } else {
        console.log('✅ event_registrations table created successfully');
      }
    } else {
      console.log('✅ event_registrations table exists');
    }

    // Check if events table exists
    console.log('\n2️⃣ Checking events table...');
    const { data: eventTableCheck, error: eventTableError } = await supabase
      .from('events')
      .select('count')
      .limit(1);

    if (eventTableError) {
      console.log('❌ events table does not exist');
      console.log('🔍 Error:', eventTableError.message);
      
      // Create events table
      console.log('\n🔨 Creating events table...');
      const { error: createEventError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS events (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            event_date TIMESTAMP WITH TIME ZONE,
            event_type TEXT DEFAULT 'webinar' CHECK (event_type IN ('webinar', 'challenge', 'live_qa', 'workshop')),
            max_participants INTEGER,
            current_participants INTEGER DEFAULT 0,
            status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
            location TEXT,
            meeting_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (createEventError) {
        console.log('❌ Failed to create events table:', createEventError.message);
      } else {
        console.log('✅ events table created successfully');
      }
    } else {
      console.log('✅ events table exists');
    }

    // Insert sample data if tables are empty
    console.log('\n3️⃣ Checking for sample data...');
    const { data: sampleEvents, error: sampleError } = await supabase
      .from('events')
      .select('count')
      .limit(1);

    if (!sampleError && (!sampleEvents || sampleEvents.length === 0)) {
      console.log('🔨 Inserting sample events...');
      const { error: insertError } = await supabase
        .from('events')
        .insert([
          {
            title: 'Sample Webinar',
            description: 'A sample webinar for testing',
            event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            event_type: 'webinar',
            max_participants: 100,
            current_participants: 0,
            status: 'upcoming'
          },
          {
            title: 'Sample Challenge',
            description: 'A sample challenge for testing',
            event_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            event_type: 'challenge',
            max_participants: 50,
            current_participants: 0,
            status: 'upcoming'
          }
        ]);

      if (insertError) {
        console.log('❌ Failed to insert sample events:', insertError.message);
      } else {
        console.log('✅ Sample events inserted successfully');
      }
    } else {
      console.log('✅ Sample data exists');
    }

    // Test the registration stats endpoint
    console.log('\n4️⃣ Testing registration stats query...');
    const { data: testStats, error: testError } = await supabase
      .from('event_registrations')
      .select('source')
      .eq('status', 'registered');

    if (testError) {
      console.log('❌ Test query failed:', testError.message);
    } else {
      console.log('✅ Test query successful');
      console.log('📊 Registration count:', testStats?.length || 0);
    }

    console.log('\n🎯 Registration tables fix complete!');
    console.log('📋 The registration stats endpoint should now work properly');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

// Load environment variables
import '../src/config/env.js';

// Run fix
fixRegistrationTables();
