const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vialifecoach_db',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
  ssl: false
});

async function restoreMissingLessons() {
  try {
    console.log('🔧 Restoring missing lessons for Courses 1 and 2...\n');
    
    // Read original course data
    const courseData = JSON.parse(fs.readFileSync('./seeds/academy_program_first3_courses.json', 'utf8'));
    
    // Course 1: Overcoming Negative Thinking
    const negativeThinkingCourse = courseData.courses.find(c => c.title.includes('Negative Thinking'));
    if (negativeThinkingCourse) {
      console.log('📚 Restoring Course 1: Overcoming Negative Thinking');
      
      // Get modules for Course 1
      const modules1 = await pool.query('SELECT id FROM modules WHERE course_id = 1 ORDER BY id');
      
      for (let i = 0; i < modules1.rows.length && i < negativeThinkingCourse.modules.length; i++) {
        const moduleId = modules1.rows[i].id;
        const moduleData = negativeThinkingCourse.modules[i];
        
        console.log(`  📝 Module ${moduleId}: ${moduleData.title}`);
        
        // Create lessons for this module
        for (let j = 0; j < moduleData.lessons.length; j++) {
          const lessonData = moduleData.lessons[j];
          
          // Insert lesson
          const lessonResult = await pool.query(`
            INSERT INTO lessons (title, module_id, created_at, updated_at) 
            VALUES ($1, $2, NOW(), NOW()) 
            RETURNING id
          `, [lessonData.title, moduleId]);
          
          const lessonId = lessonResult.rows[0].id;
          console.log(`    📄 Lesson ${lessonId}: ${lessonData.title}`);
          
          // Insert lesson content
          await pool.query(`
            INSERT INTO lesson_content (lesson_id, content_type, title, body, created_at, updated_at) 
            VALUES ($1, $2, $3, $4, NOW(), NOW())
          `, [lessonId, 'text', lessonData.title, lessonData.content_markdown]);
        }
      }
    }
    
    // Course 2: Time Management (from course7_time_management_mastery.json)
    console.log('\n📚 Restoring Course 2: Time Management');
    const timeManagementData = JSON.parse(fs.readFileSync('./seeds/course7_time_management_mastery.json', 'utf8'));
    
    // Get modules for Course 2  
    const modules2 = await pool.query('SELECT id FROM modules WHERE course_id = 2 ORDER BY id');
    
    for (let i = 0; i < modules2.rows.length && i < timeManagementData.modules.length; i++) {
      const moduleId = modules2.rows[i].id;
      const moduleData = timeManagementData.modules[i];
      
      console.log(`  📝 Module ${moduleId}: ${moduleData.title}`);
      
      // Create lessons for this module
      for (let j = 0; j < moduleData.lessons.length; j++) {
        const lessonData = moduleData.lessons[j];
        
        // Insert lesson
        const lessonResult = await pool.query(`
          INSERT INTO lessons (title, module_id, created_at, updated_at) 
          VALUES ($1, $2, NOW(), NOW()) 
          RETURNING id
        `, [lessonData.title, moduleId]);
        
        const lessonId = lessonResult.rows[0].id;
        console.log(`    📄 Lesson ${lessonId}: ${lessonData.title}`);
        
        // Insert lesson content
        await pool.query(`
          INSERT INTO lesson_content (lesson_id, content_type, title, body, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, NOW(), NOW())
        `, [lessonId, 'text', lessonData.title, lessonData.content_markdown]);
      }
    }
    
    console.log('\n✅ Missing lessons restored successfully!');
    
    // Verify the restoration
    const verifyResult = await pool.query(`
      SELECT c.id as course_id, c.title as course_title, 
             COUNT(m.id) as module_count,
             COUNT(l.id) as lesson_count
      FROM courses c
      LEFT JOIN modules m ON c.id = m.course_id
      LEFT JOIN lessons l ON m.id = l.module_id
      WHERE c.id IN (1, 2, 3)
      GROUP BY c.id, c.title
      ORDER BY c.id
    `);
    
    console.log('\n📊 Course Summary:');
    verifyResult.rows.forEach(course => {
      console.log(`  📚 Course ${course.course_id}: ${course.course_title}`);
      console.log(`     📖 Modules: ${course.module_count}`);
      console.log(`     📄 Lessons: ${course.lesson_count}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

restoreMissingLessons();
