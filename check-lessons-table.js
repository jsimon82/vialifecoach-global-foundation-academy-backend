import { pool } from './src/config/postgres.js';

async function checkLessonsTable() {
  try {
    console.log('Checking if lessons table exists...');
    
    // Check if lessons table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'lessons'
      )
    `);
    
    console.log('Lessons table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Get table structure
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'lessons' 
        ORDER BY ordinal_position
      `);
      
      console.log('Lessons table columns:');
      result.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
      });
      
      // Test a simple query
      const testResult = await pool.query('SELECT COUNT(*) FROM lessons LIMIT 1');
      console.log('Lessons count:', testResult.rows[0].count);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkLessonsTable();
