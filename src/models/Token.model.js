import { pool } from "../config/postgres.js";

let tableInitPromise;

function ensureTokenTable() {
  if (!tableInitPromise) {
    tableInitPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_email TEXT UNIQUE NOT NULL,
        refresh_token TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }
  return tableInitPromise;
}

function mapTokenRow(row) {
  if (!row) return null;
  return {
    userEmail: row.userEmail,
    refreshToken: row.refreshToken,
    createdAt: row.createdAt,
  };
}

export const Token = {
  async findOneAndUpdate(filter, update) {
    await ensureTokenTable();
    const userEmail = filter?.userEmail;
    const refreshToken = update?.refreshToken;
    const createdAt = update?.createdAt ?? new Date();

    const { rows } = await pool.query(
      `INSERT INTO refresh_tokens (user_email, refresh_token, created_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_email) DO UPDATE
       SET refresh_token = EXCLUDED.refresh_token,
           created_at = EXCLUDED.created_at
       RETURNING user_email AS "userEmail",
                 refresh_token AS "refreshToken",
                 created_at AS "createdAt"`,
      [userEmail, refreshToken, createdAt]
    );
    return mapTokenRow(rows[0]);
  },

  async deleteOne(filter) {
    await ensureTokenTable();
    const refreshToken = filter?.refreshToken;
    const result = await pool.query(
      "DELETE FROM refresh_tokens WHERE refresh_token = $1",
      [refreshToken]
    );
    return { deletedCount: result.rowCount };
  },

  async findOne(filter) {
    await ensureTokenTable();
    const refreshToken = filter?.refreshToken;
    const { rows } = await pool.query(
      `SELECT user_email AS "userEmail",
              refresh_token AS "refreshToken",
              created_at AS "createdAt"
       FROM refresh_tokens
       WHERE refresh_token = $1
       LIMIT 1`,
      [refreshToken]
    );
    return mapTokenRow(rows[0]);
  },
};
