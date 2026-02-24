import { pool } from './src/config/postgres.js';

(async () => {
  try {
    const { rows } = await pool.query('SELECT * FROM courses LIMIT 1');
    console.log(rows);
  } catch (e) {
    console.error('QUERY ERROR', e);
  } finally {
    process.exit();
  }
})();
