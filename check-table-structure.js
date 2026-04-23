import { pool } from './src/config/postgres.js';

(async () => {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.log('Users table structure:');
    result.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
