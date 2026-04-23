const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vialifecoach_db',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
  ssl: false
});

async function findMissingLessons() {
  try {
    console.log('🔍 Finding missing lessons for Courses 1 and 2...\n');
    
    // Check all lessons
    const allLessonsResult = await pool.query(`
      SELECT l.id, l.title, l.module_id, m.course_id, c.title as course_title
      FROM lessons l
      LEFT JOIN modules m ON l.module_id = m.id
      LEFT JOIN courses c ON m.course_id = c.id
      ORDER BY l.id
    `);
    
    console.log('📝 All lessons in database:');
    allLessonsResult.rows.forEach(lesson => {
      console.log(`  📄 Lesson ${lesson.id}: ${lesson.title} -> Module ${lesson.module_id} -> Course ${lesson.course_id} (${lesson.course_title})`);
    });
    
    // Check for lessons not linked to modules
    const orphanedLessonsResult = await pool.query(`
      SELECT id, title FROM lessons 
      WHERE module_id IS NULL OR module_id NOT IN (SELECT id FROM modules)
    `);
    
    console.log(`\n🔍 Orphaned lessons (not linked to modules): ${orphanedLessonsResult.rows.length}`);
    orphanedLessonsResult.forEach(lesson => {
      console.log(`  📄 Lesson ${lesson.id}: ${lesson.title}`);
    });
    
    // Get module info for Courses 1 and 2
    const modulesInfoResult = await pool.query(`
      SELECT m.id, m.title, m.course_id, c.title as course_title,
             COUNT(l.id) as lesson_count
      FROM modules m
      LEFT JOIN courses c ON m.course_id = c.id
      LEFT JOIN lessons l ON m.id = l.module_id
      WHERE m.course_id IN (1, 2, 3)
      GROUP BY m.id, m.title, m.course_id, c.title
      ORDER BY m.course_id, m.id
    `);
    
    console.log('\n📖 Module summary:');
    modulesInfoResult.rows.forEach(module => {
      console.log(`  📝 Module ${module.id}: ${module.title} (Course ${module.course_id} - ${module.course_title}) - ${module.lesson_count} lessons`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

findMissingLessons();
