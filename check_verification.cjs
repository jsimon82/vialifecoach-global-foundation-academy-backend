const { pool } = require('./src/config/postgres.js');

async function checkVerification() {
  try {
    const result = await pool.query('SELECT id, email, role, verified, status FROM users WHERE email = $1', ['sgahimbare18@gmail.com']);
    console.log('Student verification status:', result.rows[0]);
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkVerification();
