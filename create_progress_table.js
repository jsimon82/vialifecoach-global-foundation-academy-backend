// Create the course progress table
import { createCourseProgressTable } from './src/models/CourseProgress.model.js';

async function setupProgressTable() {
  console.log('🔧 Setting up Course Progress Table...');
  
  try {
    await createCourseProgressTable();
    console.log('✅ Course progress table ready!');
  } catch (error) {
    console.error('❌ Failed to create progress table:', error.message);
  }
}

setupProgressTable();
