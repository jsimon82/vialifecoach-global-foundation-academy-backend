import { pool } from '../config/postgres.js';

function splitCoordinatorName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  const first_name = parts.shift() || 'Coordinator';
  const last_name = parts.length > 0 ? parts.join(' ') : 'Account';

  return { first_name, last_name };
}

// ========== FIND COORDINATOR BY EMAIL ============
export async function findCoordinatorByEmail(email) {
  try {
    const trimmedEmail = String(email || '').trim();
    if (!trimmedEmail) {
      return null;
    }

    console.log('🔍 [Coordinator Model] Looking up coordinator:', trimmedEmail);

    const result = await pool.query(
      'SELECT * FROM coordinators WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [trimmedEmail]
    );

    console.log('🔍 [Coordinator Model] Query result rows:', result.rows.length);
    return result.rows[0] || null;
  } catch (error) {
    console.error('[Coordinator Model] Failed to find coordinator:', error.message);
    return null;
  }
}

// ========== CREATE COORDINATOR ============
export async function createCoordinator(name, email, hashedPassword, department = 'Events Management') {
  try {
    const { first_name, last_name } = splitCoordinatorName(name);
    const { rows } = await pool.query(
      `INSERT INTO coordinators (
         email, password_hash, first_name, last_name, department, is_active, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
       RETURNING *`,
      [String(email || '').trim().toLowerCase(), hashedPassword, first_name, last_name, department]
    );

    return rows[0] || null;
  } catch (error) {
    console.error('Error creating coordinator:', error.message);
    return null;
  }
}

// ========== GET COORDINATOR BY ID ============
export async function getCoordinatorById(id) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM coordinators WHERE id = $1 LIMIT 1',
      [id]
    );

    return rows[0] || null;
  } catch (error) {
    console.error('Error getting coordinator:', error.message);
    return null;
  }
}

// ========== UPDATE COORDINATOR ============
export async function updateCoordinator(id, updates) {
  try {
    const sanitizedUpdates = { ...updates };
    delete sanitizedUpdates.id;
    delete sanitizedUpdates.created_at;
    delete sanitizedUpdates.updated_at;

    const entries = Object.entries(sanitizedUpdates).filter(([, value]) => value !== undefined);
    if (entries.length === 0) {
      return null;
    }

    const values = [];
    const setClauses = entries.map(([key, value]) => {
      values.push(value);
      return `${key} = $${values.length}`;
    });
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE coordinators
       SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    return rows[0] || null;
  } catch (error) {
    console.error('Error updating coordinator:', error.message);
    return null;
  }
}

// ========== DELETE COORDINATOR ============
export async function deleteCoordinator(id) {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM coordinators WHERE id = $1',
      [id]
    );

    return rowCount > 0;
  } catch (error) {
    console.error('Error deleting coordinator:', error.message);
    return false;
  }
}

// ========== GET ALL COORDINATORS ============
export async function getAllCoordinators() {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM coordinators ORDER BY created_at DESC'
    );

    return rows;
  } catch (error) {
    console.error('Error getting coordinators:', error.message);
    return [];
  }
}

// ========== TOGGLE COORDINATOR STATUS ============
export async function toggleCoordinatorStatus(id) {
  try {
    const { rows: currentRows } = await pool.query(
      'SELECT is_active FROM coordinators WHERE id = $1 LIMIT 1',
      [id]
    );

    const current = currentRows[0];
    if (!current) {
      return null;
    }

    const { rows } = await pool.query(
      `UPDATE coordinators
       SET is_active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [!current.is_active, id]
    );

    return rows[0] || null;
  } catch (error) {
    console.error('Error toggling coordinator status:', error.message);
    return null;
  }
}
