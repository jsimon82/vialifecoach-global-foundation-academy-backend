import 'dotenv/config.js';
import { pool } from './src/config/postgres.js';

async function checkTableExists() {
  try {
    console.log('🔍 Checking if coordinators table exists...\n');
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'coordinators'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Table exists!');
      
      // List all columns
      const columnsResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'coordinators'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Columns:');
      columnsResult.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
      
      // Count rows
      const countResult = await pool.query('SELECT COUNT(*) as count FROM coordinators');
      console.log(`\n📊 Total rows: ${countResult.rows[0].count}`);
      
    } else {
      console.log('❌ Table does not exist!');
      
      // Show what tables do exist
      const tablesResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        LIMIT 10
      `);
      
      console.log('\n📋 Available tables:');
      tablesResult.rows.forEach(t => {
        console.log(`   - ${t.table_name}`);
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTableExists();
