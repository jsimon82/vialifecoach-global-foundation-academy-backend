const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vialifecoach_academy',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
  ssl: false
});

async function restoreOriginalCourses() {
  try {
    console.log('🔄 Restoring your original courses...');
    
    // First, clear the sample courses I inserted
    await pool.query('DELETE FROM courses');
    console.log('🗑️ Cleared sample courses');
    
    // Read and execute the academy program seed file
    const academySeed = fs.readFileSync('./seeds/academy_program_first3_courses.sql', 'utf8');
    await pool.query(academySeed);
    console.log('✅ Academy program courses restored');
    
    // Execute time management course
    const timeManagementSeed = fs.readFileSync('./seeds/course7_time_management_mastery.sql', 'utf8');
    await pool.query(timeManagementSeed);
    console.log('✅ Time Management course restored');
    
    // Execute procrastination course
    const procrastinationSeed = fs.readFileSync('./seeds/course4_overcoming_procrastination.sql', 'utf8');
    await pool.query(procrastinationSeed);
    console.log('✅ Overcoming Procrastination course restored');
    
    // Check final results
    const result = await pool.query('SELECT id, title, description FROM courses ORDER BY id');
    console.log(`\n📋 Restored ${result.rows.length} courses:`);
    result.rows.forEach(course => {
      console.log(`- ${course.id}: ${course.title}`);
      console.log(`  ${course.description.substring(0, 80)}...`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

restoreOriginalCourses();
