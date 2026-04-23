const pool = require('./src/config/postgres.js').pool;

async function checkCourses() {
  try {
    const result = await pool.query('SELECT id, title, LEFT(description, 100) as preview FROM courses;');
    console.log('Courses in database:');
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}, Title: ${row.title}`);
      console.log(`Preview: ${row.preview}...`);
      console.log('---');
    });
    pool.end();
  } catch (error) {
    console.error('Error checking courses:', error);
    pool.end();
  }
}

checkCourses();
