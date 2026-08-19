import 'dotenv/config.js';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://knhlxddqhdzfqltibpow.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

const COORDINATOR_EMAIL = 'support@vialifecoach.org';
const COORDINATOR_PASSWORD = 'Support82Via!';

async function verifyOrCreateCoordinator() {
  try {
    console.log('🔍 Checking coordinator account...\n');

    // Check if coordinator exists
    const { data: coordinator, error: selectError } = await supabase
      .from('coordinators')
      .select('*')
      .eq('email', COORDINATOR_EMAIL)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    if (coordinator) {
      console.log('✅ Coordinator found:', coordinator.email);
      console.log('   Name:', coordinator.first_name, coordinator.last_name);
      console.log('   Active:', coordinator.is_active);
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(COORDINATOR_PASSWORD, coordinator.password_hash);
      console.log('   Password Valid:', isPasswordValid ? '✅ YES' : '❌ NO');
      
      if (!isPasswordValid) {
        console.log('\n⚠️  Password mismatch! Updating password...');
        const hashedPassword = await bcrypt.hash(COORDINATOR_PASSWORD, 10);
        const { error: updateError } = await supabase
          .from('coordinators')
          .update({ password_hash: hashedPassword })
          .eq('id', coordinator.id);
        
        if (updateError) throw updateError;
        console.log('✅ Password updated successfully');
      }
      
      if (!coordinator.is_active) {
        console.log('\n⚠️  Account is disabled! Enabling...');
        const { error: updateError } = await supabase
          .from('coordinators')
          .update({ is_active: true })
          .eq('id', coordinator.id);
        
        if (updateError) throw updateError;
        console.log('✅ Account enabled');
      }
    } else {
      console.log('❌ Coordinator not found. Creating new account...\n');
      
      const hashedPassword = await bcrypt.hash(COORDINATOR_PASSWORD, 10);
      const { data: newCoordinator, error: insertError } = await supabase
        .from('coordinators')
        .insert([
          {
            email: COORDINATOR_EMAIL,
            password_hash: hashedPassword,
            first_name: 'Support',
            last_name: 'Team',
            is_active: true,
            created_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      
      console.log('✅ Coordinator created successfully!');
      console.log('   Email:', newCoordinator.email);
      console.log('   Name:', newCoordinator.first_name, newCoordinator.last_name);
    }

    console.log('\n🎉 Coordinator account is ready to use!');
    console.log('\n📝 Login credentials:');
    console.log('   Email:', COORDINATOR_EMAIL);
    console.log('   Password:', COORDINATOR_PASSWORD);
    console.log('\n🔗 Login endpoint: POST /api/v1/coordinator/login');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyOrCreateCoordinator();
