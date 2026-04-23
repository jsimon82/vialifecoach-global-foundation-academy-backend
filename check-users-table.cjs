const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vialifecoach_db',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
  ssl: false
});

async function checkUsersTable() {
  try {
    console.log('🔍 Checking users table structure...');
    
    // Get table structure
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Users table structure:');
    structureResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    
    // Get sample data
    const dataResult = await pool.query('SELECT * FROM users LIMIT 2');
    console.log('\n📄 Sample user data:');
    dataResult.rows.forEach(user => {
      console.log(`  User: ${JSON.stringify(user, null, 2)}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersTable();
