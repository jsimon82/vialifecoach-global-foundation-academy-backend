const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vialifecoach_db',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
  ssl: false
});

async function findCourseModulesLessons() {
  try {
    console.log('🔍 Finding modules and lessons for your courses...\n');
    
    // Get courses
    const coursesResult = await pool.query('SELECT id, title FROM courses ORDER BY id');
    console.log('📚 Your Courses:');
    coursesResult.rows.forEach(course => {
      console.log(`  Course ${course.id}: ${course.title}`);
    });
    
    // Get modules for each course
    for (const course of coursesResult.rows) {
      console.log(`\n📖 Modules for Course ${course.id} - "${course.title}":`);
      
      const modulesResult = await pool.query(
        'SELECT id, title, course_id FROM modules WHERE course_id = $1 ORDER BY id',
        [course.id]
      );
      
      if (modulesResult.rows.length === 0) {
        console.log('  ❌ No modules found for this course');
      } else {
        for (const module of modulesResult.rows) {
          console.log(`  📝 Module ${module.id}: ${module.title}`);
          
          // Get lessons for each module
          const lessonsResult = await pool.query(
            'SELECT id, title, module_id FROM lessons WHERE module_id = $1 ORDER BY id',
            [module.id]
          );
          
          if (lessonsResult.rows.length === 0) {
            console.log(`    ❌ No lessons found for this module`);
          } else {
            lessonsResult.rows.forEach(lesson => {
              console.log(`    📄 Lesson ${lesson.id}: ${lesson.title}`);
            });
          }
        }
      }
    }
    
    // Check lesson content
    console.log('\n📄 Checking lesson content...');
    const lessonContentResult = await pool.query(`
      SELECT lc.id, lc.title, lc.type, lc.lesson_id, l.title as lesson_title, m.title as module_title, c.title as course_title
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      ORDER BY c.id, m.id, l.id, lc.id
    `);
    
    console.log(`Found ${lessonContentResult.rows.length} lesson content items:`);
    lessonContentResult.rows.forEach(content => {
      console.log(`  📄 ${content.course_title} > ${content.module_title} > ${content.lesson_title} > ${content.title} (${content.type})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

findCourseModulesLessons();
