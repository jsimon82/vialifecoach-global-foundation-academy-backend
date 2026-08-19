import { pool } from "../config/postgres.js";

let auditSchemaPromise = null;

export async function ensureAuditLogSchema() {
  if (!auditSchemaPromise) {
    auditSchemaPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_audit_logs (
          id SERIAL PRIMARY KEY,
          actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          actor_email TEXT,
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT,
          details JSONB NOT NULL DEFAULT '{}'::jsonb,
          ip_address TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      await pool.query(`ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;`);
      await pool.query(`ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS actor_email TEXT;`);
      await pool.query(`ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS action TEXT DEFAULT 'unknown';`);
      await pool.query(`ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'unknown';`);
      await pool.query(`ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS entity_id TEXT;`);
      await pool.query(`ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb;`);
      await pool.query(`ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;`);
      await pool.query(`ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
    })().catch((error) => {
      auditSchemaPromise = null;
      throw error;
    });
  }

  return auditSchemaPromise;
}

export async function recordAuditLog({
  actorUserId = null,
  actorEmail = null,
  action,
  entityType,
  entityId = null,
  details = {},
  ipAddress = null,
}) {
  try {
    if (!action || !entityType) {
      return;
    }

    await ensureAuditLogSchema();

    let resolvedActorUserId = Number(actorUserId);
    if (!Number.isInteger(resolvedActorUserId) || resolvedActorUserId <= 0) {
      resolvedActorUserId = null;
    } else {
      const userCheck = await pool.query("SELECT 1 FROM users WHERE id = $1", [resolvedActorUserId]);
      if (userCheck.rows.length === 0) {
        resolvedActorUserId = null;
      }
    }

    await pool.query(
      `INSERT INTO admin_audit_logs (
        actor_user_id,
        actor_email,
        action,
        entity_type,
        entity_id,
        details,
        ip_address
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
      [
        resolvedActorUserId,
        actorEmail || null,
        action,
        entityType,
        entityId !== null && entityId !== undefined ? String(entityId) : null,
        JSON.stringify(details || {}),
        ipAddress || null,
      ]
    );
  } catch (error) {
    console.error("Failed to record audit log:", error.message);
  }
}
