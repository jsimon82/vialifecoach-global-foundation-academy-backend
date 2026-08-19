import { pool } from './src/config/postgres.js';

async function testQuery() {
  try {
    console.log('Testing community events query...');
    
    // Test the exact query from the controller
    const viewerId = null;
    const result = await pool.query(
      `
      SELECT 
        ce.id::text AS id, 
        ce.title, 
        ce.description, 
        ce.event_type, 
        ce.start_at, 
        ce.max_spots, 
        ce.is_active,
        u.name AS host_name,
        'community' AS event_source,
        (SELECT COUNT(*)::int FROM community_event_registrations r WHERE r.event_id = ce.id) AS registered_count,
        EXISTS (
          SELECT 1 FROM community_event_registrations r
          WHERE r.event_id = ce.id AND r.user_id = $1
        ) AS is_registered
      FROM community_events ce
      LEFT JOIN users u ON u.id = ce.host_user_id
      WHERE ce.is_active = TRUE
      
      UNION ALL
      
      SELECT 
        CONCAT('coord_', e.id)::text AS id,
        e.title,
        e.description,
        e.event_type,
        e.event_date AS start_at,
        e.max_participants AS max_spots,
        CASE WHEN e.status = 'upcoming' THEN TRUE ELSE FALSE END AS is_active,
        'Coordinator' AS host_name,
        'coordinator' AS event_source,
        e.current_participants AS registered_count,
        FALSE AS is_registered
      FROM events e
      INNER JOIN event_sync es ON e.id = es.coordinator_event_id
      WHERE e.status = 'upcoming'
        AND es.sync_status = 'synced'
      
      ORDER BY start_at ASC
      `,
      [viewerId]
    );
    
    console.log('Query successful, rows returned:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('Sample data:', JSON.stringify(result.rows[0], null, 2));
    }
  } catch (error) {
    console.error('Query error:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testQuery();
