import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ 
  user: 'postgres', 
  host: 'localhost', 
  database: 'vialifecoach_db', 
  password: 'Si82monG@)$', 
  port: 5432 
});

async function checkLessonContent() {
  try {
    // Check lesson_contents table
    const contentCount = await pool.query("SELECT COUNT(*) as total FROM lesson_contents");
    console.log('Total lesson_contents:', contentCount.rows[0].total);
    
    // Check for videos
    const videoCount = await pool.query("SELECT COUNT(*) as total FROM lesson_contents WHERE video_url IS NOT NULL AND video_url != ''");
    console.log('Lessons with videos:', videoCount.rows[0].total);
    
    // Get sample of lesson contents
    const samples = await pool.query(`
      SELECT l.id, l.title, lc.video_url, lc.content_type, lc.youtube_url
      FROM lessons l 
      LEFT JOIN lesson_contents lc ON lc.lesson_id = l.id 
      LIMIT 10
    `);
    console.log('\nSample lessons with content:');
    console.log(JSON.stringify(samples.rows, null, 2));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkLessonContent();
