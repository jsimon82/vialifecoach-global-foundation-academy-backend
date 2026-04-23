const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vialifecoach_academy',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
  ssl: false
});

async function findRealCourses() {
  try {
    console.log('🔍 Searching for your actual courses...');
    
    // Check all tables
    const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 All database tables:');
    tablesResult.rows.forEach(row => console.log(`- ${row.table_name}`));
    
    // Check if courses table exists and what's in it
    const coursesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'courses'
      )
    `);
    
    if (coursesCheck.rows[0].exists) {
      const coursesResult = await pool.query('SELECT * FROM courses ORDER BY id');
      console.log(`\n📚 Found ${coursesResult.rows.length} courses in database:`);
      
      coursesResult.rows.forEach(course => {
        console.log(`\nCourse ${course.id}:`);
        console.log(`  Title: ${course.title}`);
        console.log(`  Description: ${course.description?.substring(0, 100)}...`);
        console.log(`  Price: ${course.price || 'N/A'}`);
        if (course.category_id) console.log(`  Category: ${course.category_id}`);
      });
    } else {
      console.log('\n❌ No courses table found');
    }
    
    // Check for any course-related data in other tables
    console.log('\n🔍 Checking for course data in other tables...');
    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      if (tableName.includes('course') || tableName.includes('academy') || tableName.includes('program')) {
        try {
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          if (parseInt(countResult.rows[0].count) > 0) {
            console.log(`✅ ${tableName}: ${countResult.rows[0].count} records`);
          }
        } catch (err) {
          // Skip tables we can't query
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

findRealCourses();
