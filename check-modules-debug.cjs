const { pool } = require('./src/config/postgres.js');

(async () => {
  try {
    // Test connection
    const conn = await pool.query('SELECT current_database()');
    console.log('Connected to:', conn.rows[0].current_database);
    
    // Get all courses
    const courses = await pool.query('SELECT id, title FROM courses ORDER BY id');
    console.log('=== COURSES ===');
    console.log(JSON.stringify(courses.rows, null, 2));
    
    // Get all modules with course info
    const modules = await pool.query(`
      SELECT m.id, m.title, m.order_index, c.id as course_id, c.title as course_title 
      FROM modules m 
      JOIN courses c ON m.course_id = c.id 
      ORDER BY c.id, m.order_index
    `);
    console.log('=== MODULES ===');
    console.log(JSON.stringify(modules.rows, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
