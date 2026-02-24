import { pool } from "../config/postgres.js";

// ======== MARK LESSON COMPLETE =============
export async function markLessonComplete(userId, courseId, lessonId) {
  const { rows } = await pool.query(
    `INSERT INTO progress (user_id, course_id, lesson_id, completed, completed_at)
     VALUES ($1, $2, $3, TRUE, NOW())
     ON CONFLICT (user_id, lesson_id)
     DO UPDATE SET completed = TRUE, completed_at = NOW()
     RETURNING *`,
    [userId, courseId, lessonId]
  );
  return rows[0];
}

// ======== GET PROGRESS BY USER & COURSE =============
export async function getCourseProgress(userId, courseId) {
  const { rows: progressRows } = await pool.query(
    `SELECT p.*, l.title AS lesson_title, l.module_id
     FROM progress p
     JOIN lessons l ON p.lesson_id = l.id
     WHERE p.user_id = $1 AND p.course_id = $2`,
    [userId, courseId]
  );

  // Get total lessons in course
  const { rows: totalRows } = await pool.query(
    `SELECT COUNT(l.id)::int AS total
     FROM lessons l
     JOIN modules m ON l.module_id = m.id
     WHERE m.course_id = $1`,
    [courseId]
  );

  const total = totalRows[0]?.total || 0;
  const completed = progressRows.filter(r => r.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { progress: progressRows, completed, total, percentage };
}

// ======== GET ALL PROGRESS FOR ADMIN =============
export async function getAllProgressForAdmin(courseId) {
  const { rows } = await pool.query(
    `SELECT u.id AS user_id, u.name, u.email,
       COUNT(p.id) FILTER (WHERE p.completed = TRUE)::int AS completed_lessons,
       (SELECT COUNT(l.id)::int FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = $1) AS total_lessons
     FROM users u
     JOIN enrollment e ON e.user_id = u.id AND e.course_id = $1
     LEFT JOIN progress p ON p.user_id = u.id AND p.course_id = $1
     GROUP BY u.id, u.name, u.email
     ORDER BY completed_lessons DESC`,
    [courseId]
  );
  return rows;
}

// ======== CHECK IF COURSE COMPLETED =============
export async function isCourseCompleted(userId, courseId) {
  const { rows: totalRows } = await pool.query(
    `SELECT COUNT(l.id)::int AS total
     FROM lessons l
     JOIN modules m ON l.module_id = m.id
     WHERE m.course_id = $1`,
    [courseId]
  );

  const { rows: completedRows } = await pool.query(
    `SELECT COUNT(*)::int AS completed
     FROM progress
     WHERE user_id = $1 AND course_id = $2 AND completed = TRUE`,
    [userId, courseId]
  );

  const total = totalRows[0]?.total || 0;
  const completed = completedRows[0]?.completed || 0;
  return total > 0 && completed >= total;
}
