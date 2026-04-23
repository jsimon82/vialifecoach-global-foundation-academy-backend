import dotenv from 'dotenv';
dotenv.config();

import { supabase } from './src/config/supabase.js';

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Check if environment variables are loaded
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    
    console.log('Environment variables check:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
    
    if (!supabase) {
      console.log('❌ Supabase client not initialized - check environment variables');
      return false;
    }
    
    // Test basic connection
    const { data, error } = await supabase.from('information_schema.tables').select('table_name').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('✅ Database accessible');
    
    return true;
  } catch (err) {
    console.error('❌ Supabase test error:', err.message);
    return false;
  }
}

testSupabaseConnection();
