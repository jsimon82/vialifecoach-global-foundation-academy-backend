import { pool } from './src/config/postgres.js';

(async () => {
  try {
    const events = await pool.query(`SELECT id, title, status, coordinator_id, created_at FROM events ORDER BY created_at DESC LIMIT 20`);
    const syncs = await pool.query(`SELECT id, community_event_id, coordinator_event_id, sync_status, last_sync_at, created_at FROM event_sync ORDER BY created_at DESC LIMIT 20`);
    console.log('events:', events.rows);
    console.log('syncs:', syncs.rows);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();