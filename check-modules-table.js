import { pool } from './src/config/postgres.js';

async function checkTable() {
  try {
    console.log('Checking modules table structure...');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'modules' 
      ORDER BY ordinal_position
    `);
    
    console.log('Modules table columns:');
    result.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTable();
