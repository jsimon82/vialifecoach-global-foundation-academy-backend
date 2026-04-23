import { pool } from './src/config/postgres.js';

async function testDB() {
  try {
    console.log('Testing database connection...');
    
    // Test courses
    const coursesResult = await pool.query('SELECT * FROM courses LIMIT 3');
    console.log('Courses:', coursesResult.rows);
    
    // Test modules for course 1
    const modulesResult = await pool.query('SELECT * FROM modules WHERE course_id = 1');
    console.log('Modules for course 1:', modulesResult.rows);
    
    // Test all modules
    const allModulesResult = await pool.query('SELECT * FROM modules');
    console.log('All modules:', allModulesResult.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Database error:', error.message);
    process.exit(1);
  }
}

testDB();
