import { pool } from "../config/postgres.js";

async function isFeatureEnabled(key, fallback = true) {
  const row = await pool.query(`SELECT enabled FROM feature_flags WHERE key = $1 LIMIT 1`, [key]);
  if (!row.rows[0]) return fallback;
  return Boolean(row.rows[0].enabled);
}

export async function getStudentDashboardController(req, res) {
  try {
    const userId = req.user.id;
    
    // Get student's enrolled courses count
    const enrolledCoursesResult = await pool.query(
      "SELECT COUNT(*) as enrolled_courses FROM enrollment WHERE user_id = $1",
      [userId]
    );
    
    // Get recent progress
    const recentProgressResult = await pool.query(
      `SELECT c.title as course_title, p.completed_at, l.title as lesson_title
       FROM progress p
       JOIN lessons l ON l.id = p.lesson_id
       JOIN modules m ON m.id = l.module_id
       JOIN courses c ON c.id = m.course_id
       WHERE p.user_id = $1 AND p.completed = TRUE
       ORDER BY p.completed_at DESC
       LIMIT 5`,
      [userId]
    );
    
    // Get upcoming events (placeholder - you may need to implement events table)
    const upcomingEvents = [];
    
    return res.json({
      success: true,
      data: {
        enrolled_courses: Number(enrolledCoursesResult.rows[0].enrolled_courses),
        recent_progress: recentProgressResult.rows,
        upcoming_events: upcomingEvents,
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role
        }
      }
    });
  } catch (error) {
    console.error("Error getting student dashboard:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getStudentGradesController(req, res) {
  try {
    const userId = req.user.id;
    const rows = await pool.query(
      `SELECT
         c.id AS course_id,
         c.title AS course_title,
         COALESCE(lesson_totals.total_lessons, 0) AS total_lessons,
         COALESCE(progress.completed_lessons, 0) AS completed_lessons,
         CASE
           WHEN COALESCE(lesson_totals.total_lessons, 0) = 0 THEN 0
           ELSE ROUND((COALESCE(progress.completed_lessons, 0)::numeric / lesson_totals.total_lessons) * 100, 0)
         END AS progress_percent,
         COALESCE(quiz.attempts, 0) AS quiz_attempts,
         COALESCE(quiz.avg_score_percent, 0) AS avg_quiz_score_percent
       FROM enrollment e
       JOIN courses c ON c.id = e.course_id
       LEFT JOIN (
         SELECT m.course_id, COUNT(l.id)::int AS total_lessons
         FROM modules m
         LEFT JOIN lessons l ON l.module_id = m.id
         GROUP BY m.course_id
       ) lesson_totals ON lesson_totals.course_id = c.id
       LEFT JOIN (
         SELECT p.course_id, COUNT(*) FILTER (WHERE p.completed = TRUE)::int AS completed_lessons
         FROM progress p
         WHERE p.user_id = $1
         GROUP BY p.course_id
       ) progress ON progress.course_id = c.id
       LEFT JOIN (
         SELECT q.course_id,
                COUNT(qr.id)::int AS attempts,
                ROUND(AVG(
                  CASE WHEN qr.total_marks > 0
                    THEN (qr.score::numeric / qr.total_marks::numeric) * 100
                    ELSE 0
                  END
                ), 2) AS avg_score_percent
         FROM quiz_results qr
         JOIN quizzes q ON q.id = qr.quiz_id
         WHERE qr.user_id = $1
         GROUP BY q.course_id
       ) quiz ON quiz.course_id = c.id
       WHERE e.user_id = $1
       ORDER BY c.title ASC`,
      [userId]
    );

    const items = rows.rows.map((row) => ({
      ...row,
      avg_quiz_score_percent: Number(row.avg_quiz_score_percent || 0),
      progress_percent: Number(row.progress_percent || 0),
      quiz_attempts: Number(row.quiz_attempts || 0),
      total_lessons: Number(row.total_lessons || 0),
      completed_lessons: Number(row.completed_lessons || 0),
    }));

    const overallAvg =
      items.length > 0
        ? Math.round(
            items.reduce((sum, item) => sum + (item.avg_quiz_score_percent || 0), 0) / items.length
          )
        : 0;

    const cumulativeGpa = Math.min(4, Math.max(0, Number((overallAvg / 25).toFixed(2))));

    return res.json({
      success: true,
      data: {
        overall_average: overallAvg,
        cumulative_gpa: cumulativeGpa,
        items,
      },
    });
  } catch (error) {
    console.error("Error getting student grades:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getStudentGradesDetailController(req, res) {
  try {
    if (!(await isFeatureEnabled("student_grades_detail_enabled", true))) {
      return res.status(403).json({ message: "Detailed grades are currently disabled by admin." });
    }
    const userId = req.user.id;

    const coursesQ = await pool.query(
      `SELECT
         c.id AS course_id,
         c.title AS course_title,
         COALESCE(qs.quiz_attempts, 0)::int AS quiz_attempts,
         COALESCE(ds.discussion_posts, 0)::int AS discussion_posts,
         COALESCE(ds.discussion_replies, 0)::int AS discussion_replies,
         COALESCE(qs.assignment_attempts, 0)::int AS assignment_attempts,
         COALESCE(qs.exam_attempts, 0)::int AS exam_attempts,
         COALESCE(qs.avg_score_percent, 0)::numeric AS avg_score_percent
       FROM enrollment e
       JOIN courses c ON c.id = e.course_id
       LEFT JOIN (
         SELECT
           q.course_id,
           COUNT(qr.id)::int AS quiz_attempts,
           COUNT(qr.id) FILTER (WHERE LOWER(COALESCE(q.title, '')) LIKE '%assignment%')::int AS assignment_attempts,
           COUNT(qr.id) FILTER (WHERE LOWER(COALESCE(q.title, '')) LIKE '%exam%')::int AS exam_attempts,
           ROUND(AVG(
             CASE WHEN qr.total_marks > 0
               THEN (qr.score::numeric / qr.total_marks::numeric) * 100
               ELSE 0
             END
           ), 2) AS avg_score_percent
         FROM quiz_results qr
         JOIN quizzes q ON q.id = qr.quiz_id
         WHERE qr.user_id = $1
         GROUP BY q.course_id
       ) qs ON qs.course_id = c.id
       LEFT JOIN (
         SELECT
           p.course_id,
           COUNT(*) FILTER (WHERE p.user_id = $1)::int AS discussion_posts,
           (
             SELECT COUNT(*)::int
             FROM community_post_replies r
             JOIN community_posts p2 ON p2.id = r.post_id
             WHERE r.user_id = $1
               AND p2.course_id = p.course_id
           ) AS discussion_replies
         FROM community_posts p
         GROUP BY p.course_id
       ) ds ON ds.course_id = c.id
       WHERE e.user_id = $1
       ORDER BY c.title ASC`,
      [userId]
    );

    const courses = coursesQ.rows.map((row) => {
      const average = Number(row.avg_score_percent || 0);
      const gpa = Math.min(4, Math.max(0, Number((average / 25).toFixed(2))));
      return {
        course_id: Number(row.course_id),
        course_title: row.course_title,
        quiz_attempts: Number(row.quiz_attempts || 0),
        discussion_posts: Number(row.discussion_posts || 0),
        discussion_replies: Number(row.discussion_replies || 0),
        assignment_attempts: Number(row.assignment_attempts || 0),
        exam_attempts: Number(row.exam_attempts || 0),
        average_percent: average,
        gpa,
      };
    });

    const cumulativePercent =
      courses.length > 0
        ? Number((courses.reduce((sum, c) => sum + Number(c.average_percent || 0), 0) / courses.length).toFixed(2))
        : 0;
    const cumulativeGpa = Math.min(4, Math.max(0, Number((cumulativePercent / 25).toFixed(2))));

    return res.json({
      success: true,
      data: {
        cumulative_percent: cumulativePercent,
        cumulative_gpa: cumulativeGpa,
        courses,
      },
    });
  } catch (error) {
    console.error("Error getting student grades detail:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getStudentCourseGradesDetailController(req, res) {
  try {
    if (!(await isFeatureEnabled("student_grades_detail_enabled", true))) {
      return res.status(403).json({ message: "Detailed grades are currently disabled by admin." });
    }
    const userId = req.user.id;
    const courseId = Number(req.params.courseId);
    if (!courseId) return res.status(400).json({ message: "Valid courseId is required" });

    const enrolledQ = await pool.query(
      `SELECT 1 FROM enrollment WHERE user_id = $1 AND course_id = $2 LIMIT 1`,
      [userId, courseId]
    );
    if (!enrolledQ.rows[0]) {
      return res.status(403).json({ message: "You are not enrolled in this course." });
    }

    const courseQ = await pool.query(`SELECT id, title FROM courses WHERE id = $1 LIMIT 1`, [courseId]);
    if (!courseQ.rows[0]) return res.status(404).json({ message: "Course not found" });

    const attemptsQ = await pool.query(
      `SELECT
         qr.id AS result_id,
         q.id AS quiz_id,
         q.title AS quiz_title,
         qr.score,
         qr.total_marks,
         qr.passed,
         qr.submitted_at
       FROM quiz_results qr
       JOIN quizzes q ON q.id = qr.quiz_id
       WHERE qr.user_id = $1
         AND q.course_id = $2
       ORDER BY qr.submitted_at DESC`,
      [userId, courseId]
    );

    const discussionPostsQ = await pool.query(
      `SELECT id, content, created_at
       FROM community_posts
       WHERE user_id = $1
         AND course_id = $2
       ORDER BY created_at DESC`,
      [userId, courseId]
    );

    const discussionRepliesQ = await pool.query(
      `SELECT r.id, r.content, r.created_at, r.post_id
       FROM community_post_replies r
       JOIN community_posts p ON p.id = r.post_id
       WHERE r.user_id = $1
         AND p.course_id = $2
       ORDER BY r.created_at DESC`,
      [userId, courseId]
    );

    const normalized = attemptsQ.rows.map((row) => {
      const title = String(row.quiz_title || "").toLowerCase();
      const category =
        title.includes("assignment") ? "assignment" : title.includes("exam") ? "exam" : "quiz";
      return {
        result_id: Number(row.result_id),
        quiz_id: Number(row.quiz_id),
        title: row.quiz_title,
        category,
        score: Number(row.score || 0),
        total_marks: Number(row.total_marks || 0),
        percent:
          Number(row.total_marks || 0) > 0
            ? Number((((Number(row.score || 0) / Number(row.total_marks || 1)) * 100)).toFixed(2))
            : 0,
        passed: Boolean(row.passed),
        submitted_at: row.submitted_at,
      };
    });

    const quizzes = normalized.filter((x) => x.category === "quiz");
    const assignments = normalized.filter((x) => x.category === "assignment");
    const exams = normalized.filter((x) => x.category === "exam");
    const avgPercent =
      normalized.length > 0
        ? Number((normalized.reduce((sum, a) => sum + a.percent, 0) / normalized.length).toFixed(2))
        : 0;

    return res.json({
      success: true,
      data: {
        course: {
          id: Number(courseQ.rows[0].id),
          title: courseQ.rows[0].title,
          average_percent: avgPercent,
          gpa: Math.min(4, Math.max(0, Number((avgPercent / 25).toFixed(2)))),
        },
        quizzes,
        assignments,
        exams,
        discussions: {
          posts: discussionPostsQ.rows,
          replies: discussionRepliesQ.rows,
        },
      },
    });
  } catch (error) {
    console.error("Error getting course grades detail:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getStudentCatalogController(req, res) {
  try {
    const userId = req.user.id;
    const rows = await pool.query(
      `SELECT
         c.id,
         c.title,
         c.short_description,
         c.thumbnail_url,
         c.level,
         c.price,
         c.discount,
         c.rating,
         c.status,
         c.duration_weeks,
         cat.name AS category_name,
         (e.user_id IS NOT NULL) AS enrolled,
         COALESCE(lt.total_lessons, 0) AS total_lessons,
         COALESCE(p.completed_lessons, 0) AS completed_lessons,
         CASE
           WHEN COALESCE(lt.total_lessons, 0) = 0 THEN 0
           ELSE ROUND((COALESCE(p.completed_lessons, 0)::numeric / lt.total_lessons) * 100, 0)
         END AS progress_percent
       FROM courses c
       LEFT JOIN categories cat ON cat.id = c.category_id
       LEFT JOIN enrollment e ON e.course_id = c.id AND e.user_id = $1
       LEFT JOIN (
         SELECT m.course_id, COUNT(l.id)::int AS total_lessons
         FROM modules m
         LEFT JOIN lessons l ON l.module_id = m.id
         GROUP BY m.course_id
       ) lt ON lt.course_id = c.id
       LEFT JOIN (
         SELECT p.course_id, COUNT(*) FILTER (WHERE p.completed = TRUE)::int AS completed_lessons
         FROM progress p
         WHERE p.user_id = $1
         GROUP BY p.course_id
       ) p ON p.course_id = c.id
       WHERE c.archived_at IS NULL
       ORDER BY enrolled DESC, c.created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: rows.rows.map((row) => ({
        ...row,
        enrolled: Boolean(row.enrolled),
        total_lessons: Number(row.total_lessons || 0),
        completed_lessons: Number(row.completed_lessons || 0),
        progress_percent: Number(row.progress_percent || 0),
      })),
    });
  } catch (error) {
    console.error("Error getting student catalog:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
