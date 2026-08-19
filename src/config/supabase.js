import './env.js'; // Ensure environment variables are loaded first
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug logging
console.log('🔍 Supabase Configuration Debug:');
console.log('   URL:', supabaseUrl ? 'SET' : 'NOT SET');
console.log('   Publishable Key:', supabaseKey ? 'SET' : 'NOT SET');
console.log('   Service Key:', supabaseServiceKey ? 'SET' : 'NOT SET');

// Check if Supabase environment variables are available
const hasSupabaseConfig = supabaseUrl && (supabaseKey || supabaseServiceKey);

let supabase = null;

if (hasSupabaseConfig) {
  // Use service role key for server-side operations, fallback to publishable key
  const key = supabaseServiceKey || supabaseKey;
  
  try {
    supabase = createClient(supabaseUrl, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('✅ Supabase client initialized');
    console.log('   Using key type:', supabaseServiceKey ? 'SERVICE_ROLE' : 'PUBLISHABLE');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error.message);
    supabase = null;
  }
} else {
  console.warn('⚠️  Supabase environment variables not found. Using PostgreSQL pool instead.');
  console.warn('   Missing:', {
    url: !supabaseUrl,
    key: !(supabaseKey || supabaseServiceKey)
  });
}

export { supabase };
export default supabase;
