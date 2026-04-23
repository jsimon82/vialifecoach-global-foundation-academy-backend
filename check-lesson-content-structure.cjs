const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vialifecoach_db',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
  ssl: false
});

async function checkLessonContentStructure() {
  try {
    console.log('🔍 Checking lesson content structure...\n');
    
    // Check lesson_content table structure
    const structureResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'lesson_content' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 lesson_content table structure:');
    structureResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Get all lesson content
    const contentResult = await pool.query(`
      SELECT * FROM lesson_content LIMIT 5
    `);
    
    console.log('\n📄 Sample lesson content:');
    contentResult.rows.forEach(content => {
      console.log(`  Content: ${JSON.stringify(content, null, 2)}`);
    });
    
    // Check lessons table
    const lessonsResult = await pool.query(`
      SELECT id, title, module_id FROM lessons 
      WHERE module_id IN (7, 8, 9, 10, 11, 12)  -- Modules for Course 1
      ORDER BY module_id, id
    `);
    
    console.log('\n📝 Lessons for Course 1 (Negative Thinking):');
    console.log(`Found ${lessonsResult.rows.length} lessons:`);
    lessonsResult.rows.forEach(lesson => {
      console.log(`  📄 Lesson ${lesson.id}: ${lesson.title} (Module ${lesson.module_id})`);
    });
    
    // Check lessons for Course 2
    const lessons2Result = await pool.query(`
      SELECT id, title, module_id FROM lessons 
      WHERE module_id IN (14, 15, 16, 17, 18, 19, 20, 21)  -- Modules for Course 2
      ORDER BY module_id, id
    `);
    
    console.log('\n📝 Lessons for Course 2 (Time Management):');
    console.log(`Found ${lessons2Result.rows.length} lessons:`);
    lessons2Result.rows.forEach(lesson => {
      console.log(`  📄 Lesson ${lesson.id}: ${lesson.title} (Module ${lesson.module_id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkLessonContentStructure();
