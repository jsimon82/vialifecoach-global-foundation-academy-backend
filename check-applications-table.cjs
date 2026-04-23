const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vialifecoach_db',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
  ssl: false
});

async function checkApplicationsTable() {
  try {
    console.log('🔍 Checking common_applications table structure...\n');
    
    const structureResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'common_applications' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 common_applications columns:');
    structureResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Check existing applications
    const existingResult = await pool.query(`
      SELECT * FROM common_applications LIMIT 3
    `);
    
    console.log(`\n📝 Existing applications (${existingResult.rows.length}):`);
    existingResult.rows.forEach(app => {
      console.log(`  📄 Application: ${JSON.stringify(app, null, 2)}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkApplicationsTable();
