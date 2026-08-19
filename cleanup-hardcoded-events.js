import { pool } from './src/config/postgres.js';

(async () => {
  try {
    console.log('Deleting hard-coded events and registrations...');

    const result = await pool.query(`
      DELETE FROM event_registrations
      WHERE event_id IN (
        SELECT id FROM events
        WHERE title IN (
          'Challenge Registration: 30-Day Fitness Challenge',
          'Live Q&A: Breaking Through Mental Blocks',
          'Webinar: Productivity Mastery for Remote Work'
        )
      )
    `);
    console.log('Deleted', result.rowCount, 'registrations');

    const eventResult = await pool.query(`
      DELETE FROM events
      WHERE title IN (
        'Challenge Registration: 30-Day Fitness Challenge',
        'Live Q&A: Breaking Through Mental Blocks',
        'Webinar: Productivity Mastery for Remote Work'
      )
    `);
    console.log('Deleted', eventResult.rowCount, 'events');

    console.log('Cleanup complete!');
    await pool.end();
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();