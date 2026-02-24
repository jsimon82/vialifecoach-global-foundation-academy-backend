import { pool } from "../config/postgres.js";

// ======== GET CONTENT BLOCKS BY LESSON ID =============
export async function getContentByLessonId(lessonId) {
  const { rows } = await pool.query(
    "SELECT * FROM lesson_content WHERE lesson_id = $1 ORDER BY order_index",
    [lessonId]
  );
  return rows;
}

// ======== GET CONTENT BLOCK BY ID =============
export async function getContentById(id) {
  const { rows } = await pool.query("SELECT * FROM lesson_content WHERE id = $1", [id]);
  return rows[0];
}

// ======== ADD CONTENT BLOCK =============
export async function addContentBlock(lessonId, contentData) {
  const { content_type, title, body, file_url, external_url, order_index } = contentData;

  let idx = order_index;
  if (idx === undefined || idx === null) {
    const { rows: countRows } = await pool.query(
      "SELECT COALESCE(MAX(order_index), -1) + 1 AS next_index FROM lesson_content WHERE lesson_id = $1",
      [lessonId]
    );
    idx = countRows[0].next_index;
  }

  const { rows } = await pool.query(
    `INSERT INTO lesson_content (lesson_id, content_type, title, body, file_url, external_url, order_index)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [lessonId, content_type || 'text', title || null, body || null, file_url || null, external_url || null, idx]
  );
  return rows[0];
}

// ======== UPDATE CONTENT BLOCK =============
export async function updateContentBlock(id, updates) {
  const allowed = ['content_type', 'title', 'body', 'file_url', 'external_url', 'order_index'];
  const keys = Object.keys(updates).filter(k => allowed.includes(k));
  if (!keys.length) return null;

  const fields = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = keys.map(k => updates[k]);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE lesson_content SET ${fields}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0];
}

// ======== DELETE CONTENT BLOCK =============
export async function deleteContentBlock(id) {
  const { rowCount } = await pool.query("DELETE FROM lesson_content WHERE id = $1", [id]);
  return rowCount;
}

// ======== REORDER CONTENT BLOCKS =============
// items: [{ id, order_index }, ...]
export async function reorderContentBlocks(items) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of items) {
      await client.query(
        "UPDATE lesson_content SET order_index = $1 WHERE id = $2",
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
