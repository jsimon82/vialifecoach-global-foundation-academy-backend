// Course Progress Model
import { pool } from '../config/postgres.js';

export async function createCourseProgressTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS course_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      module_id INTEGER NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      completed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (lesson_id) REFERENCES lessons(id),
      FOREIGN KEY (module_id) REFERENCES modules(id),
      UNIQUE(user_id, lesson_id)
    );
  `;
  
  try {
    await pool.query(createTableQuery);
    console.log('Course progress table created or already exists');
  } catch (error) {
    console.error('Error creating course progress table:', error);
  }
}

export async function getUserProgress(userId, courseId) {
  const query = `
    SELECT 
      cp.module_id,
      cp.lesson_id,
      cp.completed,
      cp.completed_at,
      m.title as module_title,
      m.order_index as module_order,
      l.title as lesson_title,
      l.order_index as lesson_order
    FROM course_progress cp
    JOIN lessons l ON cp.lesson_id = l.id
    JOIN modules m ON l.module_id = m.id
    WHERE cp.user_id = $1 AND m.course_id = $2
    ORDER BY m.order_index, l.order_index
  `;
  
  try {
    const result = await pool.query(query, [userId, courseId]);
    return result.rows;
  } catch (error) {
    console.error('Error getting user progress:', error);
    throw error;
  }
}

export async function markLessonComplete(userId, lessonId, moduleId) {
  const query = `
    INSERT INTO course_progress (user_id, lesson_id, module_id, completed, completed_at)
    VALUES ($1, $2, $3, true, NOW())
    ON CONFLICT (user_id, lesson_id) 
    DO UPDATE SET 
      completed = true, 
      completed_at = NOW()
  `;
  
  try {
    const result = await pool.query(query, [userId, lessonId, moduleId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error marking lesson complete:', error);
    throw error;
  }
}

export async function getModuleProgress(userId, moduleId) {
  const query = `
    SELECT 
      COUNT(*) as total_lessons,
      COUNT(*) FILTER (WHERE completed = true) as completed_lessons
    FROM course_progress cp
    JOIN lessons l ON cp.lesson_id = l.id
    WHERE cp.user_id = $1 AND l.module_id = $2
  `;
  
  try {
    const result = await pool.query(query, [userId, moduleId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting module progress:', error);
    throw error;
  }
}
