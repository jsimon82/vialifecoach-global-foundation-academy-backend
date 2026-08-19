#!/usr/bin/env node

/**
 * Check Events Table Structure
 * Verify the events table has the required columns for dual registration
 */

import { supabase } from '../src/config/supabase.js';

async function checkEventsTable() {
  console.log('🔍 Checking Events Table Structure...\n');

  try {
    // Check if events table exists and get its structure
    console.log('1️⃣ Checking events table columns...');
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(1);

    if (eventsError) {
      console.log('❌ Events table error:', eventsError.message);
      return;
    }

    if (events && events.length > 0) {
      console.log('✅ Events table exists');
      console.log('📋 Columns found:', Object.keys(events[0]));
    } else {
      console.log('✅ Events table exists but is empty');
      console.log('📋 Checking table structure...');
      
      // Try to insert a test record to see what columns are required
      try {
        const { data: testEvent, error: insertError } = await supabase
          .from('events')
          .insert({
            title: 'Test Event',
            event_type: 'webinar',
            event_date: new Date(),
            status: 'upcoming'
          })
          .select()
          .single();

        if (insertError) {
          console.log('❌ Insert test failed:', insertError.message);
          console.log('🔍 This shows what columns are required/missing');
        } else {
          console.log('✅ Basic insert works');
          console.log('📋 Test event created:', testEvent);
          
          // Clean up test event
          await supabase
            .from('events')
            .delete()
            .eq('id', testEvent.id);
        }
      } catch (error) {
        console.log('❌ Insert test exception:', error.message);
      }
    }

    // Check if current_participants column exists
    console.log('\n2️⃣ Checking for current_participants column...');
    try {
      const { data: testEvent, error: testError } = await supabase
        .from('events')
        .insert({
          title: 'Test Event for Column Check',
          event_type: 'webinar',
          event_date: new Date(),
          status: 'upcoming',
          current_participants: 0
        })
        .select()
        .single();

      if (testError) {
        console.log('❌ current_participants column missing:', testError.message);
      } else {
        console.log('✅ current_participants column exists');
        
        // Clean up
        await supabase
          .from('events')
          .delete()
          .eq('id', testEvent.id);
      }
    } catch (error) {
      console.log('❌ current_participants column test failed:', error.message);
    }

    console.log('\n🎯 Events table check complete');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

// Load environment variables
import '../src/config/env.js';

// Run check
checkEventsTable();
