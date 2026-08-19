import 'dotenv/config.js';
import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkCoordinator() {
  try {
    const result = await pool.query('SELECT * FROM coordinators WHERE email = $1', ['support@vialifecoach.org']);
    
    if (result.rows.length > 0) {
      const coordinator = result.rows[0];
      console.log('✅ Coordinator found in database:');
      console.log('   ID:', coordinator.id);
      console.log('   Email:', coordinator.email);
      console.log('   Name:', coordinator.first_name, coordinator.last_name);
      console.log('   Password Hash:', coordinator.password_hash.substring(0, 20) + '...');
      console.log('   Active:', coordinator.is_active);
    } else {
      console.log('❌ Coordinator not found in database');
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkCoordinator();
