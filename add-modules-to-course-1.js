import { pool } from './src/config/postgres.js';

async function addModulesToCourse1() {
  try {
    console.log('Adding modules to course 1...');
    
    // Add modules to course 1
    const modules = [
      { title: 'Module 1: Understanding Negative Thoughts', order_index: 3, description: 'Learn how negative thought patterns develop and impact your daily life' },
      { title: 'Module 2: Cognitive Restructuring', order_index: 4, description: 'Techniques to reframe negative thoughts into positive ones' },
      { title: 'Module 3: Building Positive Habits', order_index: 5, description: 'Create lasting positive changes through daily practice' }
    ];
    
    for (const module of modules) {
      const result = await pool.query(
        'INSERT INTO modules (course_id, title, description, order_index, published, quiz_required, min_pass_percentage, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *',
        [1, module.title, module.description, module.order_index, true, false, 80]
      );
      console.log('✅ Added module:', result.rows[0].title);
    }
    
    console.log('✅ Successfully added modules to course 1');
    
    // Verify the modules were added
    const verifyResult = await pool.query('SELECT * FROM modules WHERE course_id = 1 ORDER BY order_index');
    console.log('Course 1 now has modules:', verifyResult.rows.length);
    verifyResult.rows.forEach((mod, index) => {
      console.log(`${index + 1}. ${mod.title}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addModulesToCourse1();
