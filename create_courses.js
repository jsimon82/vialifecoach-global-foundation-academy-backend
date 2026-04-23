const pool = require('./src/config/postgres.js').pool;

async function insertCourse(title, description) {
  const result = await pool.query(
    'INSERT INTO courses (title, description, thumbnail_url, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
    [title, description, 'https://via.placeholder.com/300x200/1F2A44/FFFFFF?text=COURSE']
  );
  return result.rows[0];
}

async function main() {
  try {
    // Course 1: Overcoming Negative Thinking
    const course1 = await insertCourse(
      'Overcoming Negative Thinking: Rewiring Your Brain for Positivity',
      'Learn proven neuroscience techniques to rewire negative thought patterns and build lasting mental resilience. This comprehensive course teaches you how to identify automatic negative thoughts, understand their neurological basis, and systematically replace them with empowering alternatives using evidence-based cognitive restructuring methods.'
    );
    console.log('Course 1 created:', course1.id);

    // Course 2: How to Master Time Management
    const course2 = await insertCourse(
      'How to Master Time Management: Taking Control of Your Day',
      'Transform your relationship with time from reactive to strategic. Learn proven frameworks for prioritization, energy management, and focus optimization that help you accomplish more in less time while reducing stress and increasing satisfaction.'
    );
    console.log('Course 2 created:', course2.id);

    console.log('Two courses successfully created!');
    pool.end();
  } catch (error) {
    console.error('Error creating courses:', error);
    pool.end();
  }
}

main();
