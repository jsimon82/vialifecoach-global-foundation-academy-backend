const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vialifecoach_academy',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
  ssl: false
});

async function checkCourses() {
  try {
    console.log('🔍 Checking courses in database...');
    
    const result = await pool.query('SELECT * FROM courses ORDER BY id');
    
    console.log(`\n📋 Found ${result.rows.length} courses:`);
    
    if (result.rows.length === 0) {
      console.log('❌ No courses found in database');
      console.log('\n💡 You mentioned courses about:');
      console.log('   - Negative mindset');
      console.log('   - Time management');
      console.log('\n🤔 Could you tell me the exact titles of your original courses?');
      console.log('   I want to restore them exactly as they were.');
    } else {
      result.rows.forEach(course => {
        console.log(`\n📚 Course ${course.id}:`);
        console.log(`   Title: ${course.title}`);
        console.log(`   Price: $${course.price}`);
        console.log(`   Description: ${course.description.substring(0, 100)}...`);
        if (course.thumbnail_url) {
          console.log(`   Image: ${course.thumbnail_url}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking courses:', error.message);
  } finally {
    await pool.end();
  }
}

checkCourses();
