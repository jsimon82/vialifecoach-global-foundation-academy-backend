import { pool } from "../config/postgres.js";

// ======== GET LESSONS BY MODULE ID =============
export async function getLessonsByModuleId(moduleId) {
  const { rows } = await pool.query(
    "SELECT * FROM lessons WHERE module_id = $1 ORDER BY order_index",
    [moduleId]
  );
  return rows;
}

// ======== GET LESSON BY ID =============
export async function getLessonById(id) {
  const { rows } = await pool.query("SELECT * FROM lessons WHERE id = $1", [id]);
  return rows[0];
}

// ======== GET LESSON WITH CONTENT =============
export async function getLessonWithContent(id) {
  const { rows: lessonRows } = await pool.query(
    "SELECT * FROM lessons WHERE id = $1",
    [id]
  );
  if (!lessonRows[0]) return null;

  const { rows: contentRows } = await pool.query(
    "SELECT * FROM lesson_content WHERE lesson_id = $1 ORDER BY order_index",
    [id]
  );

  return { ...lessonRows[0], content: contentRows };
}

// ======== CREATE LESSON =============
export async function createLesson(moduleId, lessonData) {
  const { title, content_type, order_index, duration_minutes, is_free_preview } = lessonData;

  let idx = order_index;
  if (idx === undefined || idx === null) {
    const { rows: countRows } = await pool.query(
      "SELECT COALESCE(MAX(order_index), -1) + 1 AS next_index FROM lessons WHERE module_id = $1",
      [moduleId]
    );
    idx = countRows[0].next_index;
  }

  const { rows } = await pool.query(
    `INSERT INTO lessons (module_id, title, content_type, order_index, duration_minutes, is_free_preview)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [moduleId, title, content_type || 'video', idx, duration_minutes || 0, is_free_preview || false]
  );
  return rows[0];
}

// ======== UPDATE LESSON =============
export async function updateLesson(id, updates) {
  const allowed = ['title', 'content_type', 'order_index', 'duration_minutes', 'is_free_preview'];
  const keys = Object.keys(updates).filter(k => allowed.includes(k));
  if (!keys.length) return null;

  const fields = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = keys.map(k => updates[k]);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE lessons SET ${fields} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0];
}

// ======== DELETE LESSON =============
export async function deleteLesson(id) {
  const { rowCount } = await pool.query("DELETE FROM lessons WHERE id = $1", [id]);
  return rowCount;
}

// ======== REORDER LESSONS =============
// items: [{ id, order_index }, ...]
export async function reorderLessons(items) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of items) {
      await client.query(
        "UPDATE lessons SET order_index = $1 WHERE id = $2",
        [item.order_index, item.id]
      );
    }
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
