import { pool } from './src/config/postgres.js';

async function fixCourse1() {
  try {
    console.log('Adding modules to course 1...');
    
    // Add modules to course 1
    const modules = [
      { title: 'Module 1: Understanding Negative Thoughts', order_index: 1, description: 'Learn how negative thought patterns develop' },
      { title: 'Module 2: Cognitive Restructuring', order_index: 2, description: 'Techniques to reframe negative thoughts' },
      { title: 'Module 3: Building Positive Habits', order_index: 3, description: 'Create lasting positive changes' }
    ];
    
    for (const module of modules) {
      await pool.query(
        'INSERT INTO modules (course_id, title, description, order_index, published, quiz_required, min_pass_percentage, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [1, module.title, module.description, module.order_index, true, false, 80, new Date()]
      );
    }
    
    console.log('✅ Successfully added modules to course 1');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixCourse1();
