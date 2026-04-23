import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { EmailTemplates } from "../services/emailTemplates.service.js";
import { sendEmail, sendPasswordResetEmail, sendVerificationEmail } from "../services/email.service.js";
import { generateAdmissionPdfBuffer } from "../services/pdf.service.js";
import { pool } from "../config/postgres.js";
import * as ScriptGenerationModel from "../models/ScriptGeneration.model.js";
// Quiz policy helpers are not implemented in Quiz.model.js.
// Provide safe fallbacks here to keep admin routes online.
async function getQuizPolicy() {
  return null;
}

async function upsertQuizPolicy(policy) {
  return policy || {};
}

async function getQuizPolicyComplianceStats() {
  return {
    total: 0,
    compliant: 0,
    non_compliant: 0,
  };
}

const RBAC_ROLES = ["owner", "admin", "manager", "content_editor", "support", "instructor", "student"];

export async function generateAdmissionPdfController(req, res) {
  try {
    const { htmlContent, fileName, meta } = req.body || {};
    if (!htmlContent) {
      return res.status(400).json({ message: "htmlContent is required" });
    }

    const pdfBuffer = await generateAdmissionPdfBuffer({
      title: "Official Admission Letter",
      htmlContent,
      meta: meta || {}
    });

    const safeName = (fileName || "Admission_Letter.pdf").replace(/[^a-z0-9._-]/gi, "_");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
    res.end(pdfBuffer);
  } catch (error) {
    console.error("Error generating admission PDF:", error);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
}

async function ensureAdminOpsSchema() {
  // Support tickets compatibility for legacy DBs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      subject TEXT,
      message TEXT,
      status TEXT DEFAULT 'open',
      priority TEXT DEFAULT 'normal',
      requester_name TEXT,
      requester_email TEXT,
      channel TEXT DEFAULT 'web',
      assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
      closed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;`);
  await pool.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS subject TEXT;`);
  await pool.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS message TEXT;`);
  await pool.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';`);
  await pool.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';`);
  await pool.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS requester_name TEXT;`);
  await pool.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS requester_email TEXT;`);
  await pool.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'web';`);
  await pool.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL;`);
  await pool.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;`);
  await pool.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await pool.query(`ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'title'
      ) THEN
        EXECUTE 'UPDATE support_tickets SET subject = COALESCE(subject, title) WHERE subject IS NULL';
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'description'
      ) THEN
        EXECUTE 'UPDATE support_tickets SET message = COALESCE(message, description) WHERE message IS NULL';
      END IF;
    END $$;
  `);

  // Admin audit logs compatibility for legacy DBs
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

  // Media assets
  await pool.query(`
    CREATE TABLE IF NOT EXISTS media_assets (
      id SERIAL PRIMARY KEY,
      asset_url TEXT NOT NULL,
      asset_type TEXT NOT NULL,
      mime_type TEXT,
      size_bytes BIGINT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Script generation jobs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS script_generation_jobs (
      id SERIAL PRIMARY KEY,
      course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
      lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
      script_text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      provider TEXT NOT NULL DEFAULT 'local-storyboard',
      output_video_url TEXT,
      output_ppt_url TEXT,
      output_slides JSONB NOT NULL DEFAULT '[]'::jsonb,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // System settings
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Feature flags
  await pool.query(`
    CREATE TABLE IF NOT EXISTS feature_flags (
      key TEXT PRIMARY KEY,
      enabled BOOLEAN NOT NULL DEFAULT FALSE,
      config JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Payments / refunds / coupons (for ops reports)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
      amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      currency TEXT DEFAULT 'USD',
      status TEXT DEFAULT 'paid',
      coupon_code TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS refunds (
      id SERIAL PRIMARY KEY,
      payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
      amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      reason TEXT,
      status TEXT DEFAULT 'processed',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT DEFAULT 'percent',
      discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Course versions (snapshots)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS course_versions (
      id SERIAL PRIMARY KEY,
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
      notes TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Community success stories (admin)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_success_stories (
      id SERIAL PRIMARY KEY,
      display_name TEXT NOT NULL,
      image_url TEXT,
      video_url TEXT,
      story TEXT NOT NULL,
      course TEXT,
      role_label TEXT,
      rating INTEGER DEFAULT 5,
      is_approved BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Community messages (admin moderation)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      recipient_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      read_at TIMESTAMPTZ,
      edited_at TIMESTAMPTZ,
      is_deleted BOOLEAN DEFAULT FALSE,
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // User safety columns used by admin ops
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_reason TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_reset BOOLEAN DEFAULT FALSE;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;`);
}

async function ensureAnalyticsSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS share_links (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      url TEXT NOT NULL,
      label TEXT,
      shared_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      shared_by_email TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS share_clicks (
      id SERIAL PRIMARY KEY,
      share_link_id INTEGER REFERENCES share_links(id) ON DELETE CASCADE,
      visitor_id TEXT,
      path TEXT,
      referrer TEXT,
      referrer_domain TEXT,
      user_agent TEXT,
      ip_address TEXT,
      country_code TEXT,
      timezone TEXT,
      locale TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_visits (
      id SERIAL PRIMARY KEY,
      visitor_id TEXT,
      path TEXT,
      referrer TEXT,
      referrer_domain TEXT,
      user_agent TEXT,
      ip_address TEXT,
      share_link_id INTEGER REFERENCES share_links(id) ON DELETE SET NULL,
      country_code TEXT,
      timezone TEXT,
      locale TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`ALTER TABLE share_clicks ADD COLUMN IF NOT EXISTS referrer_domain TEXT;`);
  await pool.query(`ALTER TABLE share_clicks ADD COLUMN IF NOT EXISTS country_code TEXT;`);
  await pool.query(`ALTER TABLE share_clicks ADD COLUMN IF NOT EXISTS timezone TEXT;`);
  await pool.query(`ALTER TABLE share_clicks ADD COLUMN IF NOT EXISTS locale TEXT;`);
  await pool.query(`ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS referrer_domain TEXT;`);
  await pool.query(`ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS country_code TEXT;`);
  await pool.query(`ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS timezone TEXT;`);
  await pool.query(`ALTER TABLE site_visits ADD COLUMN IF NOT EXISTS locale TEXT;`);
}

async function audit(req, action, entityType, entityId = null, details = {}) {
  try {
    console.log('🔍 AUDIT: Creating audit log:', { action, entityType, entityId, user: req.user?.email });
    
    // Don't audit the deletion of audit logs themselves to avoid infinite loop
    if (entityType === "admin_audit_log" && action.includes("delete")) {
      console.log("🔕 Skipping audit log for audit log deletion to avoid infinite loop");
      return;
    }
    
    // Check if user_id exists in users table before creating audit log
    let userId = req.user?.id || null;
    if (userId) {
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        console.log("⚠️ AUDIT: User ID not found in users table, setting to null");
        userId = null;
      }
    }
    
    await pool.query(
      `INSERT INTO admin_audit_logs (actor_user_id, actor_email, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
      [userId, req.user?.email || null, action, entityType, entityId ? String(entityId) : null, JSON.stringify(details || {}), req.ip || req.connection.remoteAddress || null]
    );
    
    console.log('✅ AUDIT: Audit log inserted successfully');
  } catch (e) {
    console.error("❌ AUDIT: Audit log write failed:", e.message);
    // Don't fail the entire operation if audit log fails
  }
}

function toDateRange(from, to) {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { start, end };
}

export async function getKpisController(req, res) {
  try {
    await ensureAnalyticsSchema();
    const { start, end } = toDateRange(req.query.from, req.query.to);
    const span = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - span);
    const prevEnd = start;

    const current = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int
         FROM users
         WHERE created_at BETWEEN $1 AND $2
           AND COALESCE(status, 'active') <> 'deleted') AS new_users,
        (SELECT COUNT(*)::int
         FROM enrollment e
         JOIN users u ON u.id = e.user_id
         WHERE e.enrolled_at BETWEEN $1 AND $2
           AND COALESCE(u.status, 'active') <> 'deleted') AS enrollments,
        (SELECT COALESCE(SUM(amount),0)::numeric FROM payments WHERE status = 'paid' AND created_at BETWEEN $1 AND $2) AS revenue,
        (SELECT COUNT(*)::int FROM progress WHERE completed = TRUE AND completed_at BETWEEN $1 AND $2) AS lesson_completions`,
      [start, end]
    );
    const previous = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int
         FROM users
         WHERE created_at BETWEEN $1 AND $2
           AND COALESCE(status, 'active') <> 'deleted') AS new_users,
        (SELECT COUNT(*)::int
         FROM enrollment e
         JOIN users u ON u.id = e.user_id
         WHERE e.enrolled_at BETWEEN $1 AND $2
           AND COALESCE(u.status, 'active') <> 'deleted') AS enrollments,
        (SELECT COALESCE(SUM(amount),0)::numeric FROM payments WHERE status = 'paid' AND created_at BETWEEN $1 AND $2) AS revenue,
        (SELECT COUNT(*)::int FROM progress WHERE completed = TRUE AND completed_at BETWEEN $1 AND $2) AS lesson_completions`,
      [prevStart, prevEnd]
    );

    const cur = current.rows[0];
    const prev = previous.rows[0];

    res.json({
      success: true,
      data: {
        range: { from: start, to: end },
        kpis: cur,
        previous: prev
      }
    });
  } catch (error) {
    console.error("Error fetching KPIs:", error);
    res.status(500).json({ message: "Server error" });
  }
}

function makeSlug() {
  return Math.random().toString(36).slice(2, 10);
}

export async function getTrafficAnalyticsController(req, res) {
  try {
    await ensureAnalyticsSchema();
    const totalQ = await pool.query(`SELECT COUNT(*)::int AS total FROM site_visits`);
    const uniqueQ = await pool.query(
      `SELECT COUNT(DISTINCT visitor_id)::int AS total FROM site_visits WHERE visitor_id IS NOT NULL`
    );
    const topPagesQ = await pool.query(
      `SELECT path, COUNT(*)::int AS visits
       FROM site_visits
       WHERE path IS NOT NULL
       GROUP BY path
       ORDER BY visits DESC
       LIMIT 10`
    );
    const recentQ = await pool.query(
      `SELECT path, referrer, created_at
       FROM site_visits
       ORDER BY created_at DESC
       LIMIT 20`
    );
    const geoQ = await pool.query(
      `SELECT country_code, COUNT(*)::int AS visits
       FROM site_visits
       WHERE country_code IS NOT NULL AND country_code <> ''
       GROUP BY country_code
       ORDER BY visits DESC
       LIMIT 10`
    );
    const refQ = await pool.query(
      `SELECT referrer_domain, COUNT(*)::int AS visits
       FROM site_visits
       WHERE referrer_domain IS NOT NULL AND referrer_domain <> ''
       GROUP BY referrer_domain
       ORDER BY visits DESC
       LIMIT 10`
    );
    const dailyQ = await pool.query(
      `SELECT DATE(created_at) AS day, COUNT(*)::int AS visits
       FROM site_visits
       GROUP BY DATE(created_at)
       ORDER BY day DESC
       LIMIT 14`
    );

    res.json({
      success: true,
      data: {
        total_visits: totalQ.rows[0]?.total || 0,
        unique_visitors: uniqueQ.rows[0]?.total || 0,
        top_pages: topPagesQ.rows || [],
        recent_visits: recentQ.rows || [],
        geo: geoQ.rows || [],
        referrers: refQ.rows || [],
        daily_visits: dailyQ.rows.reverse() || [],
      },
    });
  } catch (error) {
    console.error("Error fetching traffic analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getShareAnalyticsController(req, res) {
  try {
    await ensureAnalyticsSchema();
    const linksQ = await pool.query(
      `SELECT
        l.id,
        l.slug,
        l.url,
        l.label,
        l.shared_by_email,
        l.shared_by_user_id,
        l.created_at,
        (SELECT COUNT(*)::int FROM share_clicks c WHERE c.share_link_id = l.id) AS click_count,
        (SELECT MAX(created_at) FROM share_clicks c WHERE c.share_link_id = l.id) AS last_click_at
       FROM share_links l
       ORDER BY l.created_at DESC`
    );
    const shareCountQ = await pool.query(`SELECT COUNT(*)::int AS total FROM share_links`);
    const clickCountQ = await pool.query(`SELECT COUNT(*)::int AS total FROM share_clicks`);
    const dailyClicksQ = await pool.query(
      `SELECT DATE(created_at) AS day, COUNT(*)::int AS clicks
       FROM share_clicks
       GROUP BY DATE(created_at)
       ORDER BY day DESC
       LIMIT 14`
    );

    res.json({
      success: true,
      data: {
        totals: {
          shares: shareCountQ.rows[0]?.total || 0,
          clicks: clickCountQ.rows[0]?.total || 0,
        },
        links: linksQ.rows || [],
        daily_clicks: dailyClicksQ.rows.reverse() || [],
      },
    });
  } catch (error) {
    console.error("Error fetching share analytics:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function createShareLinkAdminController(req, res) {
  try {
    await ensureAnalyticsSchema();
    const { url, label, shared_by_email } = req.body || {};
    if (!url || !String(url).trim()) {
      return res.status(400).json({ message: "url is required" });
    }
    const slug = makeSlug();
    const out = await pool.query(
      `INSERT INTO share_links (slug, url, label, shared_by_user_id, shared_by_email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [slug, String(url).trim(), label ? String(label).trim() : null, req.user?.id || null, shared_by_email || req.user?.email || null]
    );
    res.status(201).json({ success: true, data: out.rows[0] });
  } catch (error) {
    console.error("Error creating share link:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function suspendUserController(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE users SET status = 'suspended', suspended_at = NOW(), suspended_reason = $1
       WHERE id = $2
       RETURNING id, name, email, role, status, suspended_at, suspended_reason`,
      [reason || null, id]
    );
    if (!rows[0]) return res.status(404).json({ message: "User not found" });
    await audit(req, "user.suspend", "user", id, { reason: reason || null });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error suspending user:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function reactivateUserController(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE users SET status = 'active', suspended_at = NULL, suspended_reason = NULL
       WHERE id = $1
       RETURNING id, name, email, role, status`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ message: "User not found" });
    await audit(req, "user.reactivate", "user", id, {});
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error reactivating user:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function forcePasswordResetController(req, res) {
  try {
    const { id } = req.params;
    const token = crypto.randomBytes(4).toString("hex").toUpperCase();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    const { rows } = await pool.query(
      `UPDATE users SET force_password_reset = TRUE WHERE id = $1 RETURNING id, email`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ message: "User not found" });
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [id, token, expires]
    );
    try {
      await sendPasswordResetEmail(rows[0].email, token, "support");
    } catch (e) {
      console.error("Password reset email send failed:", e.message);
    }
    await audit(req, "user.force_password_reset", "user", id, {});
    res.json({ success: true, data: { user_id: Number(id), token, expires_at: expires } });
  } catch (error) {
    console.error("Error forcing password reset:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function resendVerificationController(req, res) {
  try {
    const { id } = req.params;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    const { rows } = await pool.query(
      `UPDATE users
       SET verification_token = $1, verification_expires = $2
       WHERE id = $3
       RETURNING id, email`,
      [code, expiry, id]
    );
    if (!rows[0]) return res.status(404).json({ message: "User not found" });
    try {
      await sendVerificationEmail(rows[0].email, code, "support");
    } catch (e) {
      console.error("Verification email send failed:", e.message);
    }
    await audit(req, "user.resend_verification", "user", id, {});
    res.json({ success: true, data: { user_id: Number(id), verification_code: code, expires_at: expiry } });
  } catch (error) {
    console.error("Error resending verification:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function toggleUser2faController(req, res) {
  try {
    const { id } = req.params;
    const { enabled } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE users SET two_factor_enabled = $1 WHERE id = $2 RETURNING id, email, two_factor_enabled`,
      [Boolean(enabled), id]
    );
    if (!rows[0]) return res.status(404).json({ message: "User not found" });
    await audit(req, "user.2fa_toggle", "user", id, { enabled: Boolean(enabled) });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error toggling 2FA:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getCoursePublishChecklistController(req, res) {
  try {
    const { id } = req.params;
    const courseQ = await pool.query(`SELECT * FROM courses WHERE id = $1`, [id]);
    const course = courseQ.rows[0];
    if (!course) return res.status(404).json({ message: "Course not found" });
    const modulesQ = await pool.query(`SELECT COUNT(*)::int AS total FROM modules WHERE course_id = $1`, [id]);
    const lessonsQ = await pool.query(
      `SELECT COUNT(*)::int AS total FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = $1`,
      [id]
    );
    const checklist = {
      has_title: Boolean(course.title),
      has_description: Boolean(course.description),
      has_thumbnail: Boolean(course.thumbnail_url),
      has_intro_video: Boolean(course.intro_video_url),
      has_category: Boolean(course.category_id),
      has_instructor: Boolean(course.instructor_id),
      has_modules: modulesQ.rows[0].total > 0,
      has_lessons: lessonsQ.rows[0].total > 0,
    };
    const ready = Object.values(checklist).every(Boolean);
    res.json({ success: true, data: { checklist, ready } });
  } catch (error) {
    console.error("Error checking course quality:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function createCourseVersionSnapshotController(req, res) {
  try {
    await ensureAdminOpsSchema();
    const { id } = req.params;
    const { notes } = req.body || {};
    const [courseQ, modulesQ, lessonsQ, contentQ] = await Promise.all([
      pool.query(`SELECT * FROM courses WHERE id = $1`, [id]),
      pool.query(`SELECT * FROM modules WHERE course_id = $1 ORDER BY order_index`, [id]),
      pool.query(
        `SELECT l.* FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = $1 ORDER BY l.order_index`,
        [id]
      ),
      pool.query(
        `SELECT lc.* FROM lesson_content lc
         JOIN lessons l ON lc.lesson_id = l.id
         JOIN modules m ON l.module_id = m.id
         WHERE m.course_id = $1
         ORDER BY lc.order_index`,
        [id]
      ),
    ]);
    if (!courseQ.rows[0]) return res.status(404).json({ message: "Course not found" });
    const snapshot = {
      course: courseQ.rows[0],
      modules: modulesQ.rows,
      lessons: lessonsQ.rows,
      lesson_content: contentQ.rows,
      saved_at: new Date().toISOString(),
    };
    const saved = await pool.query(
      `INSERT INTO course_versions (course_id, snapshot, notes, created_by)
       VALUES ($1, $2::jsonb, $3, $4)
       RETURNING *`,
      [id, JSON.stringify(snapshot), notes || null, req.user?.id || null]
    );
    await audit(req, "course.snapshot", "course", id, { version_id: saved.rows[0].id });
    res.status(201).json({ success: true, data: saved.rows[0] });
  } catch (error) {
    console.error("Error creating course snapshot:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function listCourseVersionsController(req, res) {
  try {
    await ensureAdminOpsSchema();
    const { id } = req.params;
    const versions = await pool.query(
      `SELECT id, course_id, notes, created_by, created_at FROM course_versions WHERE course_id = $1 ORDER BY id DESC`,
      [id]
    );
    res.json({ success: true, data: versions.rows });
  } catch (error) {
    console.error("Error listing course versions:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function rollbackCourseVersionController(req, res) {
  try {
    await ensureAdminOpsSchema();
    const { id, versionId } = req.params;
    const verQ = await pool.query(`SELECT * FROM course_versions WHERE id = $1 AND course_id = $2`, [versionId, id]);
    const version = verQ.rows[0];
    if (!version) return res.status(404).json({ message: "Version not found" });
    const snap = version.snapshot;
    await pool.query(`UPDATE courses SET title=$1, subtitle=$2, description=$3, short_description=$4, long_description=$5,
      thumbnail_url=$6, intro_video_url=$7, delivery_mode=$8, level=$9, price=$10, discount=$11,
      has_certificate=$12, duration_weeks=$13, status=$14, passing_grade=$15, enrollment_limit=$16,
      enable_drip=$17, enable_discussion=$18, schedule_release_date=$19, category_id=$20, instructor_id=$21, slug=$22, updated_at=NOW()
      WHERE id = $23`,
      [
        snap.course.title, snap.course.subtitle, snap.course.description, snap.course.short_description, snap.course.long_description,
        snap.course.thumbnail_url, snap.course.intro_video_url, snap.course.delivery_mode, snap.course.level, snap.course.price, snap.course.discount,
        snap.course.has_certificate, snap.course.duration_weeks, snap.course.status, snap.course.passing_grade, snap.course.enrollment_limit,
        snap.course.enable_drip, snap.course.enable_discussion, snap.course.schedule_release_date, snap.course.category_id, snap.course.instructor_id, snap.course.slug, id
      ]
    );
    await audit(req, "course.rollback", "course", id, { version_id: versionId });
    res.json({ success: true, data: { rolled_back_to: Number(versionId) } });
  } catch (error) {
    console.error("Error rolling back version:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function bulkCourseActionController(req, res) {
  try {
    const { ids, action } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "ids[] is required" });
    const valid = new Set(["publish", "unpublish", "archive", "unarchive", "delete"]);
    if (!valid.has(action)) return res.status(400).json({ message: "Invalid action" });
    let rowCount = 0;
    if (action === "publish") rowCount = (await pool.query(`UPDATE courses SET status='published', updated_at=NOW() WHERE id = ANY($1::int[])`, [ids])).rowCount;
    if (action === "unpublish") rowCount = (await pool.query(`UPDATE courses SET status='draft', updated_at=NOW() WHERE id = ANY($1::int[])`, [ids])).rowCount;
    if (action === "archive") rowCount = (await pool.query(`UPDATE courses SET archived_at=NOW(), updated_at=NOW() WHERE id = ANY($1::int[])`, [ids])).rowCount;
    if (action === "unarchive") rowCount = (await pool.query(`UPDATE courses SET archived_at=NULL, updated_at=NOW() WHERE id = ANY($1::int[])`, [ids])).rowCount;
    if (action === "delete") rowCount = (await pool.query(`DELETE FROM courses WHERE id = ANY($1::int[])`, [ids])).rowCount;
    await audit(req, "course.bulk_action", "course", null, { action, ids });
    res.json({ success: true, data: { action, affected: rowCount } });
  } catch (error) {
    console.error("Error bulk course action:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getContentQualityController(req, res) {
  try {
    const { courseId } = req.params;
    const rows = await pool.query(
      `SELECT c.id AS course_id, c.title, c.thumbnail_url, c.intro_video_url,
              m.id AS module_id, l.id AS lesson_id, lc.id AS content_id, lc.external_url, lc.image_url, lc.video_url
       FROM courses c
       LEFT JOIN modules m ON m.course_id = c.id
       LEFT JOIN lessons l ON l.module_id = m.id
       LEFT JOIN lesson_content lc ON lc.lesson_id = l.id
       WHERE c.id = $1`,
      [courseId]
    );
    if (!rows.rows.length) return res.status(404).json({ message: "Course not found" });
    const missing = [];
    const course = rows.rows[0];
    if (!course.thumbnail_url) missing.push("course.thumbnail_url");
    if (!course.intro_video_url) missing.push("course.intro_video_url");
    const brokenLike = rows.rows.filter(r => r.external_url && !/^https?:\/\//i.test(r.external_url)).map(r => ({ content_id: r.content_id, field: "external_url", value: r.external_url }));
    res.json({ success: true, data: { missing, invalid_urls: brokenLike } });
  } catch (error) {
    console.error("Error checking content quality:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function createUploadIntentController(req, res) {
  try {
    const { filename, mime_type, size_bytes, folder } = req.body || {};
    if (!filename) return res.status(400).json({ message: "filename is required" });
    const token = crypto.randomBytes(16).toString("hex");
    res.status(201).json({
      success: true,
      data: {
        upload_token: token,
        upload_url: `/uploads/${folder || "general"}/${token}-${filename}`,
        method: "PUT",
        expires_in_seconds: 900,
        mime_type: mime_type || null,
        size_bytes: size_bytes || null
      }
    });
  } catch (error) {
    console.error("Error creating upload intent:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function registerMediaAssetController(req, res) {
  try {
    await ensureAdminOpsSchema();
    const { asset_url, asset_type, mime_type, size_bytes, metadata } = req.body || {};
    if (!asset_url || !asset_type) return res.status(400).json({ message: "asset_url and asset_type are required" });
    const out = await pool.query(
      `INSERT INTO media_assets (asset_url, asset_type, mime_type, size_bytes, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6)
       RETURNING *`,
      [asset_url, asset_type, mime_type || null, size_bytes || null, JSON.stringify(metadata || {}), req.user?.id || null]
    );
    await audit(req, "media.register", "media_asset", out.rows[0].id, { asset_type });
    res.status(201).json({ success: true, data: out.rows[0] });
  } catch (error) {
    console.error("Error registering media asset:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function listMediaAssetsController(req, res) {
  try {
    await ensureAdminOpsSchema();
    const { asset_type, limit = 100 } = req.query;
    const params = [];
    let query = `SELECT * FROM media_assets`;
    if (asset_type) {
      params.push(asset_type);
      query += ` WHERE asset_type = $1`;
    }
    params.push(Math.min(Number(limit) || 100, 200));
    query += ` ORDER BY id DESC LIMIT $${params.length}`;
    const rows = await pool.query(query, params);
    res.json({ success: true, data: rows.rows });
  } catch (error) {
    console.error("Error listing media assets:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function retryGenerationJobController(req, res) {
  try {
    const { id } = req.params;
    const job = await ScriptGenerationModel.getScriptGenerationJobById(id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    const updated = await ScriptGenerationModel.updateScriptGenerationJob(id, { status: "queued", error_message: null });
    await audit(req, "generation.retry", "script_generation_job", id, {});
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error retrying generation job:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function createScriptToPptVideoController(req, res) {
  try {
    await ensureAdminOpsSchema();
    const { script_text, course_id = null, lesson_id = null } = req.body || {};
    if (!script_text || typeof script_text !== "string") {
      return res.status(400).json({ message: "script_text is required" });
    }
    const job = await ScriptGenerationModel.createScriptGenerationJob({
      script_text,
      course_id,
      lesson_id,
      status: "queued",
      provider: "local-storyboard",
    });
    await audit(req, "generation.create", "script_generation_job", job.id, { course_id, lesson_id });
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    console.error("Error creating generation job:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function listGenerationJobsController(req, res) {
  try {
    await ensureAdminOpsSchema();
    const { course_id, lesson_id, limit = 50 } = req.query;
    const rows = await ScriptGenerationModel.listScriptGenerationJobs({
      course_id: course_id ? Number(course_id) : undefined,
      lesson_id: lesson_id ? Number(lesson_id) : undefined,
      limit: Number(limit) || 50,
    });
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error listing generation jobs:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getRevenueReportController(req, res) {
  try {
    const { start, end } = toDateRange(req.query.from, req.query.to);
    const rows = await pool.query(
      `SELECT DATE_TRUNC('day', created_at) AS day, COALESCE(SUM(amount),0)::numeric AS revenue, COUNT(*)::int AS tx_count
       FROM payments
       WHERE status='paid' AND created_at BETWEEN $1 AND $2
       GROUP BY 1
       ORDER BY 1`,
      [start, end]
    );
    res.json({ success: true, data: rows.rows });
  } catch (error) {
    console.error("Error revenue report:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getCouponPerformanceController(req, res) {
  try {
    const rows = await pool.query(
      `SELECT coupon_code, COUNT(*)::int AS uses, COALESCE(SUM(amount),0)::numeric AS revenue
       FROM payments
       WHERE coupon_code IS NOT NULL
       GROUP BY coupon_code
       ORDER BY uses DESC`
    );
    res.json({ success: true, data: rows.rows });
  } catch (error) {
    console.error("Error coupon report:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getRefundReportController(req, res) {
  try {
    const rows = await pool.query(
      `SELECT DATE_TRUNC('day', created_at) AS day, COUNT(*)::int AS refund_count, COALESCE(SUM(amount),0)::numeric AS refund_amount
       FROM refunds
       GROUP BY 1
       ORDER BY 1 DESC`
    );
    res.json({ success: true, data: rows.rows });
  } catch (error) {
    console.error("Error refund report:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function exportReportController(req, res) {
  try {
    const { type = "revenue" } = req.query;
    let rows = [];
    if (type === "revenue") rows = (await pool.query(`SELECT id, user_id, course_id, amount, currency, status, coupon_code, created_at FROM payments ORDER BY id DESC LIMIT 2000`)).rows;
    else if (type === "refunds") rows = (await pool.query(`SELECT id, payment_id, amount, reason, status, created_at FROM refunds ORDER BY id DESC LIMIT 2000`)).rows;
    else if (type === "coupons") rows = (await pool.query(`SELECT id, code, discount_type, discount_value, active, created_at FROM coupons ORDER BY id DESC LIMIT 2000`)).rows;
    else return res.status(400).json({ message: "Unsupported report type" });

    if (!rows.length) {
      res.setHeader("Content-Type", "text/csv");
      return res.send("");
    }
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map(r => headers.map(h => `"${String(r[h] ?? "").replaceAll('"', '""')}"`).join(","))
    ].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${type}-report.csv"`);
    res.send(csv);
  } catch (error) {
    console.error("Error exporting report:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function listSupportTicketsAdminController(req, res) {
  try {
    console.log('🔍 BACKEND: Starting listSupportTicketsAdminController');
    await ensureAdminOpsSchema();
    console.log('🔍 BACKEND: Schema ensured');
    
    const { status, priority, limit = 100 } = req.query;
    const params = [];
    const where = [];
    if (status) { params.push(status); where.push(`t.status = $${params.length}`); }
    if (priority) { params.push(priority); where.push(`t.priority = $${params.length}`); }
    params.push(Math.min(Number(limit) || 100, 200));

    console.log('🔍 BACKEND: Admin requesting support tickets with filters:', { status, priority, limit });
    console.log('🔍 BACKEND: Query params:', params);
    console.log('🔍 BACKEND: Where clauses:', where);

    let query = `SELECT t.*, u.email AS user_email
                 FROM support_tickets t
                 LEFT JOIN users u ON u.id = t.user_id`;
    if (where.length) query += ` WHERE ${where.join(" AND ")}`;
    query += ` ORDER BY t.updated_at DESC LIMIT $${params.length}`;
    
    console.log('🔍 BACKEND: Final query:', query);
    
    const { rows } = await pool.query(query, params);
    
    console.log('📋 BACKEND: Found', rows.length, 'support tickets in database');
    if (rows.length > 0) {
      console.log('📋 BACKEND: First ticket:', rows[0]);
    }
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("❌ BACKEND: Error listing support tickets:", error);
    console.error("❌ BACKEND: Error stack:", error.stack);
    console.error("❌ BACKEND: Error details:", {
      message: error.message,
      code: error.code,
      severity: error.severity,
      detail: error.detail,
      hint: error.hint
    });
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

export async function updateSupportTicketAdminController(req, res) {
  try {
    await ensureAdminOpsSchema();
    const { id } = req.params;
    const { status, priority, assigned_to } = req.body || {};
    const out = await pool.query(
      `UPDATE support_tickets
       SET status = COALESCE($1, status),
           priority = COALESCE($2, priority),
           assigned_to = COALESCE($3, assigned_to),
           closed_at = CASE WHEN $1 = 'closed' THEN NOW() ELSE closed_at END,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status || null, priority || null, assigned_to || null, id]
    );
    if (!out.rows[0]) return res.status(404).json({ message: "Ticket not found" });
    await audit(req, "support.ticket_update", "support_ticket", id, { status, priority, assigned_to });
    res.json({ success: true, data: out.rows[0] });
  } catch (error) {
    console.error("Error updating support ticket:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function deleteSupportTicketAdminController(req, res) {
  try {
    await ensureAdminOpsSchema();
    const { id } = req.params;
    console.log('🗑️ BACKEND: Delete request received for ticket ID:', id);
    
    // First check if ticket exists
    const ticketCheck = await pool.query(
      'SELECT id FROM support_tickets WHERE id = $1',
      [id]
    );
    
    console.log('🔍 BACKEND: Ticket exists check:', ticketCheck.rows.length > 0 ? 'YES' : 'NO');
    
    if (!ticketCheck.rows[0]) {
      console.log('❌ BACKEND: Ticket not found');
      return res.status(404).json({ message: "Ticket not found" });
    }
    
    // Delete the ticket
    const result = await pool.query(
      'DELETE FROM support_tickets WHERE id = $1',
      [id]
    );
    
    console.log('✅ BACKEND: Delete result:', result.rowCount, 'rows affected');
    
    console.log('🔍 BACKEND: About to create audit log...');
    await audit(req, "support.ticket_delete", "support_ticket", id);
    console.log('✅ BACKEND: Audit log created successfully');
    
    res.json({ 
      success: true, 
      message: "Ticket deleted successfully",
      deleted: result.rowCount > 0
    });
  } catch (error) {
    console.error("❌ BACKEND: Error deleting support ticket:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function replyToSupportTicketAdminController(req, res) {
  try {
    await ensureAdminOpsSchema();
    const { id } = req.params;
    const { message, admin_reply } = req.body || {};
    const adminId = req.user?.id;
    
    console.log('💬 BACKEND: Admin reply request received');
    console.log('💬 BACKEND: Ticket ID:', id);
    console.log('💬 BACKEND: Admin ID:', adminId);
    console.log('💬 BACKEND: Message:', message?.substring(0, 100) + '...');
    console.log('💬 BACKEND: Admin reply:', admin_reply);
    
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      console.log('❌ BACKEND: Validation failed - empty message');
      return res.status(400).json({ message: "Reply message is required" });
    }

    // First check if ticket exists
    const ticketCheck = await pool.query(
      'SELECT id, requester_name, requester_email, subject, created_at FROM support_tickets WHERE id = $1',
      [id]
    );
    
    console.log('💬 BACKEND: Ticket exists check:', ticketCheck.rows.length > 0 ? 'YES' : 'NO');
    
    if (!ticketCheck.rows[0]) {
      console.log('❌ BACKEND: Ticket not found');
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Simple approach: Just update the ticket status and timestamp
    console.log('💬 BACKEND: Updating ticket with admin reply...');
    
    const updateResult = await pool.query(
      `UPDATE support_tickets 
       SET updated_at = NOW(), 
           status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END
       WHERE id = $1
       RETURNING id, updated_at`,
      [id]
    );

    console.log('✅ BACKEND: Ticket updated with admin reply:', updateResult.rows[0].id);
    
    let emailSent = false;
    // Send email notification to customer about the reply
    try {
      const ticket = ticketCheck.rows[0];
      
      console.log('📧 BACKEND: Preparing professional email template...');
      console.log('📧 BACKEND: Ticket data:', {
        requester_name: ticket.requester_name,
        requester_email: ticket.requester_email,
        subject: ticket.subject,
        created_at: ticket.created_at
      });
      
      // Use the professional email template
      const emailContent = EmailTemplates.adminReply(
        ticket.requester_name || 'Customer',
        ticket.requester_email,
        message.trim(),
        ticket.subject,
        new Date(ticket.created_at).toLocaleString()
      );
      
      console.log('📧 BACKEND: Email template generated successfully');
      console.log('📧 BACKEND: Sending email to:', ticket.requester_email);
      
      await sendEmail({
        to: ticket.requester_email,
        subject: `Re: [Support Ticket] ${ticket.subject}`,
        text: emailContent.text,
        html: emailContent.html,
        from: "support"
      });
      
      emailSent = true;
      console.log('✅ BACKEND: Professional email notification sent successfully to:', ticket.requester_email);
    } catch (emailError) {
      console.error('⚠️ BACKEND: Failed to send email notification:', emailError);
      console.error('⚠️ BACKEND: Email error details:', {
        message: emailError?.message,
        stack: emailError?.stack,
        name: emailError?.name
      });
      // Don't fail the request if email fails, but log it clearly
      // The reply is still saved in the system
    }
    
    // Create audit log
    console.log('📋 BACKEND: Creating audit log...');
    await audit(req, "support.ticket_reply", "support_ticket", id);
    console.log('✅ BACKEND: Audit log created');
    
    console.log('✅ BACKEND: Sending success response');
    res.json({ 
      success: true, 
      message: "Reply sent successfully",
      reply_id: updateResult.rows[0].id,
      created_at: updateResult.rows[0].updated_at,
      email_sent: emailSent
    });
  } catch (error) {
    console.error("❌ BACKEND: Error replying to support ticket:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function deleteAuditLogAdminController(req, res) {
  try {
    await ensureAdminOpsSchema();
    const { id } = req.params;
    console.log('🗑️ BACKEND: Delete audit log request received for ID:', id);
    
    // First check if audit log exists
    const logCheck = await pool.query(
      'SELECT id FROM admin_audit_logs WHERE id = $1',
      [id]
    );
    
    console.log('🔍 BACKEND: Audit log exists check:', logCheck.rows.length > 0 ? 'YES' : 'NO');
    
    if (!logCheck.rows[0]) {
      console.log('❌ BACKEND: Audit log not found');
      return res.status(404).json({ message: "Audit log not found" });
    }
    
    // Delete the audit log
    const result = await pool.query(
      'DELETE FROM admin_audit_logs WHERE id = $1',
      [id]
    );
    
    console.log('✅ BACKEND: Audit log delete result:', result.rowCount, 'rows affected');

    // Do not write a new audit entry for deleting audit logs, otherwise the
    // timeline repopulates while user is trying to clear it.
    res.json({ 
      success: true, 
      message: "Audit log deleted successfully",
      deleted: result.rowCount > 0
    });
  } catch (error) {
    console.error("❌ BACKEND: Error deleting audit log:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function listIncidentsController(req, res) {
  try {
    await ensureAdminOpsSchema();
    const failedJobs = await pool.query(
      `SELECT id, provider, error_message, updated_at
       FROM script_generation_jobs
       WHERE status IN ('failed', 'error')
       ORDER BY updated_at DESC
       LIMIT 50`
    );
    res.json({ success: true, data: failedJobs.rows });
  } catch (error) {
    console.error("Error listing incidents:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getAuditLogsController(req, res) {
  try {
    await ensureAdminOpsSchema();
    const { limit = 100 } = req.query;
    const rows = await pool.query(
      `SELECT * FROM admin_audit_logs ORDER BY id DESC LIMIT $1`,
      [Math.min(Number(limit) || 100, 500)]
    );
    res.json({ success: true, data: rows.rows });
  } catch (error) {
    console.error("Error listing audit logs:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getRbacRolesController(req, res) {
  res.json({ success: true, data: RBAC_ROLES });
}

export async function getSystemSettingController(req, res) {
  try {
    await ensureAdminOpsSchema();
    const { key } = req.params;
    const row = await pool.query(`SELECT * FROM system_settings WHERE key = $1`, [key]);
    res.json({ success: true, data: row.rows[0] || { key, value: {} } });
  } catch (error) {
    console.error("Error getting setting:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function upsertSystemSettingController(req, res) {
  try {
    await ensureAdminOpsSchema();
    const { key } = req.params;
    const value = req.body?.value ?? {};
    const row = await pool.query(
      `INSERT INTO system_settings (key, value, updated_by, updated_at)
       VALUES ($1, $2::jsonb, $3, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()
       RETURNING *`,
      [key, JSON.stringify(value), req.user?.id || null]
    );
    await audit(req, "settings.update", "system_setting", key, { value });
    res.json({ success: true, data: row.rows[0] });
  } catch (error) {
    console.error("Error updating setting:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getFeatureFlagController(req, res) {
  try {
    await ensureAdminOpsSchema();
    const { key } = req.params;
    const row = await pool.query(`SELECT * FROM feature_flags WHERE key = $1`, [key]);
    res.json({ success: true, data: row.rows[0] || { key, enabled: false, config: {} } });
  } catch (error) {
    console.error("Error getting feature flag:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function upsertFeatureFlagController(req, res) {
  try {
    await ensureAdminOpsSchema();
    const { key } = req.params;
    const enabled = Boolean(req.body?.enabled);
    const config = req.body?.config ?? {};
    const row = await pool.query(
      `INSERT INTO feature_flags (key, enabled, config, updated_by, updated_at)
       VALUES ($1, $2, $3::jsonb, $4, NOW())
       ON CONFLICT (key) DO UPDATE SET enabled = EXCLUDED.enabled, config = EXCLUDED.config, updated_by = EXCLUDED.updated_by, updated_at = NOW()
       RETURNING *`,
      [key, enabled, JSON.stringify(config), req.user?.id || null]
    );
    await audit(req, "feature_flag.update", "feature_flag", key, { enabled, config });
    res.json({ success: true, data: row.rows[0] });
  } catch (error) {
    console.error("Error updating feature flag:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function listSuccessStoriesAdminController(req, res) {
  try {
    await ensureAdminOpsSchema();
    await ensureAdminOpsSchema();
    const rows = await pool.query(
      `SELECT id, display_name, image_url, video_url, story, course, role_label, rating, is_approved, created_at
       FROM community_success_stories
       ORDER BY id DESC
       LIMIT 300`
    );
    res.json({ success: true, data: rows.rows });
  } catch (error) {
    console.error("Error listing success stories:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function createSuccessStoryAdminController(req, res) {
  try {
    await ensureAdminOpsSchema();
    await ensureAdminOpsSchema();
    const {
      display_name,
      image_url = null,
      video_url = null,
      story,
      course = null,
      role_label = null,
      rating = 5,
      is_approved = true,
    } = req.body || {};

    if (!display_name || !String(display_name).trim()) {
      return res.status(400).json({ message: "display_name is required" });
    }
    if (!story || !String(story).trim()) {
      return res.status(400).json({ message: "story is required" });
    }

    const out = await pool.query(
      `INSERT INTO community_success_stories
       (user_id, display_name, image_url, video_url, story, course, role_label, rating, is_approved)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        req.user?.id || null,
        String(display_name).trim(),
        image_url ? String(image_url).trim() : null,
        video_url ? String(video_url).trim() : null,
        String(story).trim(),
        course ? String(course).trim() : null,
        role_label ? String(role_label).trim() : null,
        Math.max(1, Math.min(5, Number(rating) || 5)),
        Boolean(is_approved),
      ]
    );
    await audit(req, "success_story.create", "community_success_story", out.rows[0].id, {});
    res.status(201).json({ success: true, data: out.rows[0] });
  } catch (error) {
    console.error("Error creating success story:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function updateSuccessStoryAdminController(req, res) {
  try {
    await ensureAdminOpsSchema();
    const { id } = req.params;
    const allowed = ["display_name", "image_url", "video_url", "story", "course", "role_label", "rating", "is_approved"];
    const updates = req.body || {};
    const keys = Object.keys(updates).filter((k) => allowed.includes(k));
    if (!keys.length) return res.status(400).json({ message: "No valid fields to update" });
    const fields = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const values = keys.map((k) => updates[k]);
    values.push(Number(id));
    const out = await pool.query(
      `UPDATE community_success_stories SET ${fields} WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (!out.rows[0]) return res.status(404).json({ message: "Success story not found" });
    await audit(req, "success_story.update", "community_success_story", id, { keys });
    res.json({ success: true, data: out.rows[0] });
  } catch (error) {
    console.error("Error updating success story:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function deleteSuccessStoryAdminController(req, res) {
  try {
    await ensureAdminOpsSchema();
    const { id } = req.params;
    const out = await pool.query(`DELETE FROM community_success_stories WHERE id = $1`, [Number(id)]);
    if (!out.rowCount) return res.status(404).json({ message: "Success story not found" });
    await audit(req, "success_story.delete", "community_success_story", id, {});
    res.json({ success: true, message: "Success story deleted" });
  } catch (error) {
    console.error("Error deleting success story:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getQuizPolicyAdminController(req, res) {
  try {
    const policy = await getQuizPolicy();
    res.json({ success: true, data: policy || {} });
  } catch (error) {
    console.error("Error getting quiz policy:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function upsertQuizPolicyAdminController(req, res) {
  try {
    const policy = await upsertQuizPolicy(req.body || {}, req.user?.id || null);
    await audit(req, "quiz_policy.update", "quiz_policy", policy.id, req.body || {});
    res.json({ success: true, data: policy });
  } catch (error) {
    console.error("Error updating quiz policy:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getQuizPolicyComplianceAdminController(req, res) {
  try {
    const stats = await getQuizPolicyComplianceStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching quiz compliance:", error);
    res.status(500).json({ message: "Server error" });
  }
}

const TODAY_CONTROL_KEYS = [
  "student_live_messages_enabled",
  "student_profile_view_enabled",
  "student_grades_detail_enabled",
];

export async function getTodayExperienceControlsController(req, res) {
  try {
    await ensureAdminOpsSchema();
    await ensureAdminOpsSchema();
    const flagsQ = await pool.query(
      `SELECT key, enabled, config
       FROM feature_flags
       WHERE key = ANY($1::text[])`,
      [TODAY_CONTROL_KEYS]
    );

    const byKey = new Map(flagsQ.rows.map((row) => [row.key, row]));
    const controls = {};
    for (const key of TODAY_CONTROL_KEYS) {
      const row = byKey.get(key);
      controls[key] = row ? Boolean(row.enabled) : true;
    }

    res.json({ success: true, data: controls });
  } catch (error) {
    console.error("Error getting today controls:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function upsertTodayExperienceControlsController(req, res) {
  try {
    await ensureAdminOpsSchema();
    await ensureAdminOpsSchema();
    const payload = req.body?.controls || {};
    const updates = TODAY_CONTROL_KEYS.filter((key) => typeof payload[key] === "boolean");
    if (!updates.length) {
      return res.status(400).json({ message: "Provide at least one boolean control in controls payload." });
    }

    const out = {};
    for (const key of updates) {
      const enabled = Boolean(payload[key]);
      const row = await pool.query(
        `INSERT INTO feature_flags (key, enabled, config, updated_by, updated_at)
         VALUES ($1, $2, '{}'::jsonb, $3, NOW())
         ON CONFLICT (key) DO UPDATE
           SET enabled = EXCLUDED.enabled,
               updated_by = EXCLUDED.updated_by,
               updated_at = NOW()
         RETURNING key, enabled`,
        [key, enabled, req.user?.id || null]
      );
      out[key] = Boolean(row.rows[0]?.enabled);
    }

    await audit(req, "control.today.update", "feature_flag", null, { updates: out });
    res.json({ success: true, data: out });
  } catch (error) {
    console.error("Error updating today controls:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function listCommunityMessagesAdminController(req, res) {
  try {
    await ensureAdminOpsSchema();
    await ensureAdminOpsSchema();
    const { limit = 100, q = "" } = req.query;
    const cap = Math.min(Number(limit) || 100, 500);
    const search = String(q || "").trim();
    const params = [];
    let where = "";
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where = `WHERE LOWER(COALESCE(m.content, '')) LIKE $1
               OR LOWER(COALESCE(s.name, '')) LIKE $1
               OR LOWER(COALESCE(r.name, '')) LIKE $1`;
    }
    params.push(cap);

    const rows = await pool.query(
      `SELECT
         m.id,
         m.sender_id,
         s.name AS sender_name,
         m.recipient_id,
         r.name AS recipient_name,
         m.content,
         m.created_at,
         m.is_read,
         m.edited_at,
         m.is_deleted,
         m.deleted_at
       FROM community_messages m
       LEFT JOIN users s ON s.id = m.sender_id
       LEFT JOIN users r ON r.id = m.recipient_id
       ${where}
       ORDER BY m.created_at DESC
       LIMIT $${params.length}`,
      params
    );

    res.json({ success: true, data: rows.rows });
  } catch (error) {
    console.error("Error listing community messages (admin):", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function moderateCommunityMessageAdminController(req, res) {
  try {
    await ensureAdminOpsSchema();
    await ensureAdminOpsSchema();
    const messageId = Number(req.params.id);
    if (!messageId) return res.status(400).json({ message: "Valid message id is required" });
    const { action, content } = req.body || {};
    const safeAction = String(action || "").toLowerCase();

    if (!["delete", "restore", "edit", "mark_read"].includes(safeAction)) {
      return res.status(400).json({ message: "action must be one of: delete, restore, edit, mark_read" });
    }

    let row;
    if (safeAction === "delete") {
      row = await pool.query(
        `UPDATE community_messages
         SET is_deleted = TRUE,
             deleted_at = NOW(),
             edited_at = NULL,
             content = 'message deleted'
         WHERE id = $1
         RETURNING *`,
        [messageId]
      );
    }
    if (safeAction === "restore") {
      row = await pool.query(
        `UPDATE community_messages
         SET is_deleted = FALSE,
             deleted_at = NULL
         WHERE id = $1
         RETURNING *`,
        [messageId]
      );
    }
    if (safeAction === "edit") {
      if (!content || !String(content).trim()) {
        return res.status(400).json({ message: "content is required for edit action" });
      }
      row = await pool.query(
        `UPDATE community_messages
         SET content = $1,
             edited_at = NOW(),
             is_deleted = FALSE,
             deleted_at = NULL
         WHERE id = $2
         RETURNING *`,
        [String(content).trim(), messageId]
      );
    }
    if (safeAction === "mark_read") {
      row = await pool.query(
        `UPDATE community_messages
         SET is_read = TRUE,
             read_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [messageId]
      );
    }

    if (!row?.rows?.[0]) return res.status(404).json({ message: "Message not found" });
    await audit(req, "community.message.moderate", "community_message", messageId, { action: safeAction });
    res.json({ success: true, data: row.rows[0] });
  } catch (error) {
    console.error("Error moderating community message:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function uploadFileController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { type } = req.body;
    const file = req.file;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create subdirectory based on type
    const subDir = type || 'general';
    const typeDir = path.join(uploadsDir, subDir);
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(file.originalname);
    const filename = `${timestamp}-${randomString}${extension}`;
    
    // Save file
    const filePath = path.join(typeDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    // Return the URL
    const fileUrl = `/uploads/${subDir}/${filename}`;
    
    // Also register as media asset for tracking
    await pool.query(
      `INSERT INTO media_assets (asset_url, asset_type, mime_type, size_bytes, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6)
       RETURNING *`,
      [fileUrl, 'image', file.mimetype, file.size, JSON.stringify({
        originalname: file.originalname,
        type: type,
        uploadDate: new Date().toISOString()
      }), req.user?.id || null]
    );

    res.status(201).json({
      success: true,
      url: fileUrl,
      filename: filename,
      size: file.size,
      mimetype: file.mimetype
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Server error during upload" });
  }
}
