const { pool } = require('./src/config/postgres.js');

async function verifyStudent() {
  try {
    const result = await pool.query('UPDATE users SET verified = true WHERE email = $1 RETURNING id, email, role, verified', ['sgahimbare18@gmail.com']);
    console.log('Student verified:', result.rows[0]);
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

verifyStudent();
