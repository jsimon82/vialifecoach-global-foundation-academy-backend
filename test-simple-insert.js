import { pool } from './src/config/postgres.js';

async function testInsert() {
  try {
    console.log('Testing simple insert...');
    
    // Test with minimal columns first
    const result = await pool.query(
      'INSERT INTO modules (course_id, title, order_index) VALUES ($1, $2, $3) RETURNING *',
      [1, 'Test Module', 1]
    );
    
    console.log('✅ Simple insert worked:', result.rows[0]);
    
    // Now try full insert
    const fullResult = await pool.query(
      'INSERT INTO modules (course_id, title, description, order_index, published, quiz_required, min_pass_percentage, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *',
      [1, 'Full Test Module', 'Test description', 2, true, false, 80]
    );
    
    console.log('✅ Full insert worked:', fullResult.rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testInsert();
