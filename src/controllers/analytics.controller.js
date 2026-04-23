import { pool } from "../config/postgres.js";

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

export async function recordSiteVisitController(req, res) {
  try {
    await ensureAnalyticsSchema();
    const { path, referrer, visitor_id, share_slug, referrer_domain, country_code, timezone, locale } = req.body || {};
    let shareLinkId = null;
    if (share_slug) {
      const linkQ = await pool.query(`SELECT id FROM share_links WHERE slug = $1`, [String(share_slug)]);
      shareLinkId = linkQ.rows[0]?.id || null;
    }

    await pool.query(
      `INSERT INTO site_visits (visitor_id, path, referrer, referrer_domain, user_agent, ip_address, share_link_id, country_code, timezone, locale)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        visitor_id || null,
        path || null,
        referrer || null,
        referrer_domain || null,
        req.headers["user-agent"] || null,
        req.ip || req.connection?.remoteAddress || null,
        shareLinkId,
        country_code || null,
        timezone || null,
        locale || null,
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error recording site visit:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function recordShareClickController(req, res) {
  try {
    await ensureAnalyticsSchema();
    const { slug, visitor_id, path, referrer, referrer_domain, country_code, timezone, locale } = req.body || {};
    if (!slug) {
      return res.status(400).json({ message: "slug is required" });
    }
    const linkQ = await pool.query(`SELECT id FROM share_links WHERE slug = $1`, [String(slug)]);
    const linkId = linkQ.rows[0]?.id;
    if (!linkId) {
      return res.status(404).json({ message: "Share link not found" });
    }

    await pool.query(
      `INSERT INTO share_clicks (share_link_id, visitor_id, path, referrer, referrer_domain, user_agent, ip_address, country_code, timezone, locale)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        linkId,
        visitor_id || null,
        path || null,
        referrer || null,
        referrer_domain || null,
        req.headers["user-agent"] || null,
        req.ip || req.connection?.remoteAddress || null,
        country_code || null,
        timezone || null,
        locale || null,
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error recording share click:", error);
    res.status(500).json({ message: "Server error" });
  }
}
