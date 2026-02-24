import { pool } from "../config/postgres.js";

//  ======== CREATING USER ============= 
// model
export async function createUser(name, email, hashedPassword, role, verificationCode, expiry) {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, verified, verification_token, verification_expires)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [name, email, hashedPassword, role, false, verificationCode, expiry ?? null]
  );
  return rows[0]?.id;
}


// ========== FIND USER BY EMAIL ============
export async function findUserByEmail(email) {
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return rows[0];
}

// =========== FIND USER BY ID ============
export async function findUserById(id) {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0];
}

// ============ UPDATE USER ==============
export async function updateUser(id, updates) {
  const keys = Object.keys(updates);
  if (!keys.length) return 0;

  const fields = keys.map((key, index) => `${key} = $${index + 1}`).join(", ");
  const values = Object.values(updates);
  values.push(id);

  const result = await pool.query(
    `UPDATE users SET ${fields} WHERE id = $${values.length}`,
    values
  );
  return result.rowCount;
}

// ============ DELETE USER ==============
export async function deleteUser(id) {
  const result = await pool.query("DELETE FROM users WHERE id = $1", [id]);
  return result.rowCount;
}

// varify usr
export async function verifyUser(userId) {
  await pool.query(
    "UPDATE users SET verified = TRUE, verification_token = NULL, verification_expires = NULL WHERE id = $1",
    [userId]
  );
}

export async function getAllUsersForAdmin() {
  const { rows } = await pool.query(
    `SELECT id, name, email, role, verified
     FROM users
     ORDER BY id DESC`
  );
  return rows;
}

export async function updateUserRole(userId, role) {
  const { rowCount, rows } = await pool.query(
    "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role",
    [role, userId]
  );

  if (!rowCount) return null;
  return rows[0];
}

export async function getAdminDashboardStats() {
  const { rows } = await pool.query(
    `SELECT
      (SELECT COUNT(*)::int FROM users) AS total_users,
      (SELECT COUNT(*)::int FROM users WHERE role = 'student') AS total_students,
      (SELECT COUNT(*)::int FROM users WHERE role = 'instructor') AS total_lecturers,
      (SELECT COUNT(*)::int FROM courses) AS total_courses,
      (SELECT COUNT(*)::int FROM enrollment) AS total_enrollments`
  );

  return rows[0];
}
