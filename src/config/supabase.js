import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if Supabase environment variables are available
const hasSupabaseConfig = supabaseUrl && (supabaseKey || supabaseServiceKey);

let supabase = null;

if (hasSupabaseConfig) {
  // Use service role key for server-side operations, fallback to publishable key
  const key = supabaseServiceKey || supabaseKey;
  
  supabase = createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  console.log('✅ Supabase client initialized');
} else {
  console.warn('⚠️  Supabase environment variables not found. Using PostgreSQL pool instead.');
}

export { supabase };
export default supabase;
