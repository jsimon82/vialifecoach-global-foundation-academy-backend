const { pool } = require('./src/config/postgres.js');

async function checkStudent() {
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', ['sgahimbare18@gmail.com']);
    console.log('Student found:', result.rows[0] || 'Not found');
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkStudent();
