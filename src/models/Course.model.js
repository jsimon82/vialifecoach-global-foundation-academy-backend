import { pool } from "../config/postgres.js";

//  ======== GET COURSE BY ID =============
export async function getCourseById(id) {
  const { rows } = await pool.query(
    `SELECT c.*, cat.name AS category_name, u.name AS instructor_name
     FROM courses c
     LEFT JOIN categories cat ON c.category_id = cat.id
     LEFT JOIN users u ON c.instructor_id = u.id
     WHERE c.id = $1`,
    [id]
  );
  return rows[0];
}

//  ======== GET ALL COURSES =============
export async function getAllCourses(filters = {}) {
  let query = `
    SELECT c.*, cat.name AS category_name, u.name AS instructor_name
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN users u ON c.instructor_id = u.id
  `;
  const params = [];
  const conditions = [];

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`c.status = $${params.length}`);
  }
  if (filters.category_id) {
    params.push(filters.category_id);
    conditions.push(`c.category_id = $${params.length}`);
  }
  if (filters.level) {
    params.push(filters.level);
    conditions.push(`c.level = $${params.length}`);
  }
  if (filters.instructor_id) {
    params.push(filters.instructor_id);
    conditions.push(`c.instructor_id = $${params.length}`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += ` ORDER BY c.created_at DESC`;

  const { rows } = await pool.query(query, params);
  return rows;
}

//  ======== CREATE NEW COURSE =============
export async function createCourse(courseData) {
  const {
    title, subtitle, description, short_description, long_description,
    thumbnail_url, intro_video_url, delivery_mode, level, price, discount,
    has_certificate, duration_weeks, status, passing_grade, enrollment_limit,
    enable_drip, enable_discussion, schedule_release_date, category_id, instructor_id, slug
  } = courseData;

  const { rows } = await pool.query(
    `INSERT INTO courses (
      title, subtitle, description, short_description, long_description,
      thumbnail_url, intro_video_url, delivery_mode, level, price, discount,
      has_certificate, duration_weeks, status, passing_grade, enrollment_limit,
      enable_drip, enable_discussion, schedule_release_date, category_id, instructor_id, slug
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
    ) RETURNING *`,
    [
      title, subtitle || null, description, short_description || null, long_description || null,
      thumbnail_url || null, intro_video_url || null, delivery_mode || null, level || 'beginner',
      price || 0, discount || 0, has_certificate || false, duration_weeks || 0,
      status || 'draft', passing_grade || 70, enrollment_limit || null,
      enable_drip || false, enable_discussion || false, schedule_release_date || null,
      category_id || null, instructor_id || null, slug || null
    ]
  );
  return rows[0];
}

//  ======== UPDATE COURSE =============
export async function updateCourse(id, updates) {
  const allowedFields = [
    'title', 'subtitle', 'description', 'short_description', 'long_description',
    'thumbnail_url', 'intro_video_url', 'delivery_mode', 'level', 'price', 'discount',
    'has_certificate', 'duration_weeks', 'status', 'passing_grade', 'enrollment_limit',
    'enable_drip', 'enable_discussion', 'schedule_release_date', 'category_id',
    'instructor_id', 'slug', 'rating', 'enrollment_count'
  ];

  const keys = Object.keys(updates).filter(k => allowedFields.includes(k));
  if (!keys.length) return null;

  const fields = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = keys.map(k => updates[k]);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE courses SET ${fields}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0];
}

//  ======== DELETE COURSE =============
export async function deleteCourse(id) {
  const { rowCount } = await pool.query("DELETE FROM courses WHERE id = $1", [id]);
  return rowCount;
}

//  ======== PUBLISH / UNPUBLISH COURSE =============
export async function publishCourse(id) {
  const { rows } = await pool.query(
    "UPDATE courses SET status = 'published', updated_at = NOW() WHERE id = $1 RETURNING *",
    [id]
  );
  return rows[0];
}

export async function unpublishCourse(id) {
  const { rows } = await pool.query(
    "UPDATE courses SET status = 'draft', updated_at = NOW() WHERE id = $1 RETURNING *",
    [id]
  );
  return rows[0];
}

//  ======== DUPLICATE COURSE =============
export async function duplicateCourse(id) {
  const { rows: original } = await pool.query("SELECT * FROM courses WHERE id = $1", [id]);
  if (!original[0]) return null;

  const c = original[0];
  const { rows } = await pool.query(
    `INSERT INTO courses (
      title, subtitle, description, short_description, long_description,
      thumbnail_url, intro_video_url, delivery_mode, level, price, discount,
      has_certificate, duration_weeks, status, passing_grade, enrollment_limit,
      enable_drip, enable_discussion, category_id, instructor_id
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'draft',$14,$15,$16,$17,$18,$19
    ) RETURNING *`,
    [
      `${c.title} (Copy)`, c.subtitle, c.description, c.short_description, c.long_description,
      c.thumbnail_url, c.intro_video_url, c.delivery_mode, c.level, c.price, c.discount,
      c.has_certificate, c.duration_weeks, c.passing_grade, c.enrollment_limit,
      c.enable_drip, c.enable_discussion, c.category_id, c.instructor_id
    ]
  );

  const newCourse = rows[0];

  // Duplicate modules and lessons
  const { rows: modules } = await pool.query(
    "SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index", [id]
  );

  for (const mod of modules) {
    const { rows: newMod } = await pool.query(
      "INSERT INTO modules (course_id, title, order_index) VALUES ($1, $2, $3) RETURNING id",
      [newCourse.id, mod.title, mod.order_index]
    );

    const { rows: lessons } = await pool.query(
      "SELECT * FROM lessons WHERE module_id = $1 ORDER BY order_index", [mod.id]
    );

    for (const lesson of lessons) {
      await pool.query(
        `INSERT INTO lessons (module_id, title, content_type, order_index, duration_minutes, is_free_preview)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [newMod[0].id, lesson.title, lesson.content_type, lesson.order_index, lesson.duration_minutes, lesson.is_free_preview]
      );
    }
  }

  return newCourse;
}

//  ======== COURSE WITH MODULES =============
export async function getCourseWithModules(id) {
  const { rows: courseRows } = await pool.query(
    `SELECT 
      c.*,
      cat.name AS category,
      u.name AS instructor
     FROM courses c
     LEFT JOIN categories cat ON c.category_id = cat.id
     LEFT JOIN users u ON c.instructor_id = u.id
     WHERE c.id = $1`,
    [id]
  );

  if (courseRows.length === 0) return null;
  const course = courseRows[0];

  const { rows: moduleLessonRows } = await pool.query(
    `SELECT 
      m.id AS module_id, m.title AS module_title, m.order_index AS module_order,
      l.id AS lesson_id, l.title AS lesson_title, l.content_type, l.order_index AS lesson_order,
      l.duration_minutes, l.is_free_preview
     FROM modules m
     LEFT JOIN lessons l ON l.module_id = m.id
     WHERE m.course_id = $1
     ORDER BY m.order_index, l.order_index`,
    [id]
  );

  return { course, moduleLessonRows };
}

//  ======== GET ALL CATEGORIES =============
export async function getAllCategories() {
  const { rows } = await pool.query("SELECT * FROM categories ORDER BY name");
  return rows;
}

//  ======== CREATE CATEGORY =============
export async function createCategory(name) {
  const { rows } = await pool.query(
    "INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *",
    [name]
  );
  return rows[0];
}
