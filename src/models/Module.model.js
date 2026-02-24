import { pool } from "../config/postgres.js";

// ======== GET MODULES BY COURSE ID =============
export async function getModulesByCourseId(courseId) {
  const { rows } = await pool.query(
    "SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index",
    [courseId]
  );
  return rows;
}

// ======== GET MODULE BY ID =============
export async function getModuleById(id) {
  const { rows } = await pool.query("SELECT * FROM modules WHERE id = $1", [id]);
  return rows[0];
}

// ======== CREATE MODULE =============
export async function createModule(courseId, title, orderIndex) {
  if (orderIndex === undefined || orderIndex === null) {
    const { rows: countRows } = await pool.query(
      "SELECT COALESCE(MAX(order_index), -1) + 1 AS next_index FROM modules WHERE course_id = $1",
      [courseId]
    );
    orderIndex = countRows[0].next_index;
  }

  const { rows } = await pool.query(
    "INSERT INTO modules (course_id, title, order_index) VALUES ($1, $2, $3) RETURNING *",
    [courseId, title, orderIndex]
  );
  return rows[0];
}

// ======== UPDATE MODULE =============
export async function updateModule(id, updates) {
  const allowed = ['title', 'order_index'];
  const keys = Object.keys(updates).filter(k => allowed.includes(k));
  if (!keys.length) return null;

  const fields = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = keys.map(k => updates[k]);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE modules SET ${fields} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0];
}

// ======== DELETE MODULE =============
export async function deleteModule(id) {
  const { rowCount } = await pool.query("DELETE FROM modules WHERE id = $1", [id]);
  return rowCount;
}

// ======== REORDER MODULES =============
export async function reorderModules(items) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of items) {
      await client.query(
        "UPDATE modules SET order_index = $1 WHERE id = $2",
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

// ======== QUIZ RULES ACKNOWLEDGMENT (FIXES YOUR ERROR) =============

/**
 * Checks if a user has already accepted the rules for a specific course
 */
export async function hasAcceptedQuizRules(userId, courseId) {
  const { rows } = await pool.query(
    "SELECT EXISTS (SELECT 1 FROM user_quiz_acknowledgments WHERE user_id = $1 AND course_id = $2)",
    [userId, courseId]
  );
  return rows[0].exists;
}

/**
 * Records the user's acceptance of quiz rules
 */
export async function acknowledgeQuizRules(userId, courseId) {
  const { rows } = await pool.query(
    `INSERT INTO user_quiz_acknowledgments (user_id, course_id, acknowledged_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id, course_id) DO UPDATE SET acknowledged_at = NOW()
     RETURNING *`,
    [userId, courseId]
  );
  return rows[0];
}