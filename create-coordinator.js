import 'dotenv/config.js';
import pkg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

const COORDINATOR_EMAIL = 'support@vialifecoach.org';
const COORDINATOR_PASSWORD = 'Support82Via!';

async function createCoordinator() {
  try {
    console.log('🔍 Creating coordinator account...\n');

    // Hash password
    const hashedPassword = await bcrypt.hash(COORDINATOR_PASSWORD, 10);

    // Check if coordinator exists
    const checkQuery = 'SELECT id FROM coordinators WHERE email = $1';
    const checkResult = await pool.query(checkQuery, [COORDINATOR_EMAIL]);

    if (checkResult.rows.length > 0) {
      console.log('✅ Coordinator already exists!');
      console.log('   Updating password...');
      
      const updateQuery = 'UPDATE coordinators SET password_hash = $1, is_active = true WHERE email = $2 RETURNING *';
      const result = await pool.query(updateQuery, [hashedPassword, COORDINATOR_EMAIL]);
      
      if (result.rows.length > 0) {
        const coordinator = result.rows[0];
        console.log('✅ Password updated and account activated!');
        console.log('   Name:', coordinator.first_name, coordinator.last_name);
        console.log('   Email:', coordinator.email);
      }
    } else {
      console.log('❌ Coordinator not found. Creating new account...');
      
      const insertQuery = `
        INSERT INTO coordinators (email, password_hash, first_name, last_name, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;
      
      const result = await pool.query(insertQuery, [
        COORDINATOR_EMAIL,
        hashedPassword,
        'Support',
        'Team',
        true
      ]);

      if (result.rows.length > 0) {
        const coordinator = result.rows[0];
        console.log('✅ Coordinator created successfully!');
        console.log('   Email:', coordinator.email);
        console.log('   Name:', coordinator.first_name, coordinator.last_name);
        console.log('   Active:', coordinator.is_active);
      }
    }

    console.log('\n🎉 Coordinator account is ready to use!');
    console.log('\n📝 Login credentials:');
    console.log('   Email:', COORDINATOR_EMAIL);
    console.log('   Password:', COORDINATOR_PASSWORD);
    console.log('\n🔗 Login endpoint: POST /api/v1/coordinator/login');
    console.log('   Body: {"email":"support@vialifecoach.org","password":"Support82Via!"}');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createCoordinator();
