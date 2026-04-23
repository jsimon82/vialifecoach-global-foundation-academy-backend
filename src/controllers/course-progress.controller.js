// Course Progress Controller - handles sequential module unlocking
import { pool } from '../config/postgres.js';

async function getModuleCompletion(userId, moduleId) {
  const { rows } = await pool.query(
    `
    SELECT
      COUNT(l.id)::int AS total_lessons,
      COUNT(*) FILTER (WHERE cp.completed = true)::int AS completed_lessons
    FROM lessons l
    LEFT JOIN course_progress cp
      ON cp.lesson_id = l.id
      AND cp.user_id = $1
    WHERE l.module_id = $2
    `,
    [userId, moduleId]
  );
  return rows[0] || { total_lessons: 0, completed_lessons: 0 };
}

export async function getCourseProgress(req, res) {
  try {
    const userId = req.user.id;
    const courseId = parseInt(req.params.courseId);
    
    // Check if user is enrolled in the course
    const enrollmentCheck = await pool.query(`
      SELECT id FROM enrollment 
      WHERE user_id = $1 AND course_id = $2
    `, [userId, courseId]);
    
    if (enrollmentCheck.rows.length === 0) {
      return res.status(403).json({ message: 'User not enrolled in this course' });
    }
    
    // Get all lessons for this course with optional user progress
    const lessonResult = await pool.query(`
      SELECT 
        m.id as module_id,
        m.title as module_title,
        m.order_index as module_order,
        l.id as lesson_id,
        l.title as lesson_title,
        l.content as lesson_content,
        l.description as lesson_description,
        l.order_index as lesson_order,
        cp.completed_at,
        COALESCE(cp.completed, false) as completed
      FROM modules m
      LEFT JOIN lessons l ON l.module_id = m.id
      LEFT JOIN course_progress cp ON cp.lesson_id = l.id AND cp.user_id = $1
      WHERE m.course_id = $2
      ORDER BY m.order_index, l.order_index
    `, [userId, courseId]);
    
    // Get all modules for this course
    const modulesResult = await pool.query(`
      SELECT id, title, order_index
      FROM modules
      WHERE course_id = $1
      ORDER BY order_index
    `, [courseId]);
    
    // Calculate module completion status
    const moduleProgress = {};
    modulesResult.rows.forEach(module => {
      moduleProgress[module.id] = {
        ...module,
        lessons: [],
        completedLessons: 0,
        totalLessons: 0,
        isUnlocked: false,
        isCompleted: false
      };
    });
    
    // Populate lesson progress with all lessons (completed and not yet completed)
    lessonResult.rows.forEach(progress => {
      const moduleId = progress.module_id;
      if (moduleProgress[moduleId] && progress.lesson_id) {
        moduleProgress[moduleId].lessons.push({
          lesson_id: progress.lesson_id,
          lesson_title: progress.lesson_title,
          lesson_order: progress.lesson_order,
          completed: progress.completed,
          completed_at: progress.completed_at
        });
        
        moduleProgress[moduleId].totalLessons += 1;
        if (Boolean(progress.completed)) {
          moduleProgress[moduleId].completedLessons++;
        }
      }
    });
    
    // Determine module unlocking logic
    modulesResult.rows.forEach((module, index) => {
      const moduleData = moduleProgress[module.id];
      
      // Module is unlocked if:
      // 1. It's the first module, OR
      // 2. Previous module is completed (100% lessons completed)
      if (index === 0) {
        moduleData.isUnlocked = true;
      } else {
        const previousModule = modulesResult.rows[index - 1];
        const previousModuleData = moduleProgress[previousModule.id];
        moduleData.isUnlocked = previousModuleData.completedLessons === previousModuleData.totalLessons && previousModuleData.totalLessons > 0;
      }
      
      // Module is completed if all lessons are completed
      moduleData.isCompleted = moduleData.completedLessons === moduleData.totalLessons && moduleData.totalLessons > 0;
    });
    
    const moduleValues = Object.values(moduleProgress);
    const completedLessons = moduleValues.reduce((sum, m) => sum + m.completedLessons, 0);
    const totalLessons = moduleValues.reduce((sum, m) => sum + m.totalLessons, 0);

    res.json({
      success: true,
      data: {
        course_id: courseId,
        modules: moduleValues,
        overall_progress: {
          completed_modules: moduleValues.filter(m => m.isCompleted).length,
          total_modules: modulesResult.rows.length,
          completed_lessons: completedLessons,
          total_lessons: totalLessons
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting course progress:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function markLessonComplete(req, res) {
  try {
    const userId = req.user.id;
    const courseId = parseInt(req.params.courseId);
    const moduleId = parseInt(req.params.moduleId);
    const lessonId = parseInt(req.params.lessonId);

    if (!courseId || !moduleId || !lessonId) {
      return res.status(400).json({ message: 'Invalid course, module, or lesson id' });
    }

    // Check enrollment
    const enrollmentCheck = await pool.query(
      `SELECT id FROM enrollment WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId]
    );
    if (enrollmentCheck.rows.length === 0) {
      return res.status(403).json({ message: 'User not enrolled in this course' });
    }
    
    // Check if lesson exists and belongs to the specified module
    const lessonCheck = await pool.query(`
      SELECT l.id, l.module_id, m.course_id
      FROM lessons l
      JOIN modules m ON l.module_id = m.id
      WHERE l.id = $1 AND l.module_id = $2
    `, [lessonId, moduleId]);
    
    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Lesson not found' });
    }
    
    // Check if user has access to this module (sequential unlocking)
    const moduleOrder = await pool.query(
      `SELECT order_index FROM modules WHERE id = $1 AND course_id = $2`,
      [moduleId, courseId]
    );
    if (moduleOrder.rows.length === 0) {
      return res.status(404).json({ message: 'Module not found in this course' });
    }
    
    if (moduleOrder.rows[0].order_index > 1) {
      const previousModuleOrder = moduleOrder.rows[0].order_index - 1;
      const previousModuleId = await pool.query(`
        SELECT id FROM modules 
        WHERE course_id = $1 AND order_index = $2
      `, [lessonCheck.rows[0].course_id, previousModuleOrder]);
      
      if (previousModuleId.rows.length > 0) {
        const prev = await getModuleCompletion(userId, previousModuleId.rows[0].id);
        if (prev.completed_lessons < prev.total_lessons || prev.total_lessons === 0) {
          return res.status(403).json({ 
            message: 'Previous module must be completed before accessing this module' 
          });
        }
      }
    }
    
    // Mark lesson as complete
    await pool.query(`
      INSERT INTO course_progress (user_id, lesson_id, module_id, completed, completed_at)
      VALUES ($1, $2, $3, true, NOW())
      ON CONFLICT (user_id, lesson_id) 
      DO UPDATE SET 
        completed = true, 
        completed_at = NOW()
    `, [userId, lessonId, moduleId]);
    
    // Check if this completes the module
    const progress = await getModuleCompletion(userId, moduleId);
    const isModuleCompleted =
      progress.total_lessons > 0 && progress.completed_lessons === progress.total_lessons;
    
    res.json({
      success: true,
      message: 'Lesson marked as complete',
      data: {
        lesson_completed: true,
        module_completed: isModuleCompleted,
        module_progress: {
          completed: progress.completed_lessons,
          total: progress.total_lessons
        }
      }
    });
    
  } catch (error) {
    console.error('Error marking lesson complete:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getModuleAccess(req, res) {
  try {
    const userId = req.user.id;
    const { courseId, moduleId } = req.params;
    
    // Get module order
    const moduleInfo = await pool.query(`
      SELECT order_index FROM modules 
      WHERE id = $1 AND course_id = $2
    `, [moduleId, courseId]);
    
    if (moduleInfo.rows.length === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    const moduleOrder = moduleInfo.rows[0].order_index;
    
    // Check if user can access this module
    let canAccess = true;
    let reason = null;
    
    if (moduleOrder > 1) {
      const previousModuleOrder = moduleOrder - 1;
      const previousModuleId = await pool.query(`
        SELECT id FROM modules 
        WHERE course_id = $1 AND order_index = $2
      `, [courseId, previousModuleOrder]);
      
      if (previousModuleId.rows.length > 0) {
        const progress = await getModuleCompletion(userId, previousModuleId.rows[0].id);
        if (progress.completed_lessons < progress.total_lessons || progress.total_lessons === 0) {
          canAccess = false;
          reason = `Complete Module ${previousModuleOrder} first`;
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        can_access: canAccess,
        reason: reason,
        module_order: moduleOrder
      }
    });
    
  } catch (error) {
    console.error('Error checking module access:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
