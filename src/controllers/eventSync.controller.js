import { pool } from '../config/postgres.js';
import { AppError } from '../utils/AppError.js';
import { normalizeEventRecord } from '../utils/eventResponse.js';

function mapCommunityEventType(eventType) {
  const type = String(eventType || '').trim().toLowerCase();
  const mapping = {
    live_session: 'live_qa',
    webinar: 'webinar',
    workshop: 'other',
    challenge: 'challenge',
    meeting: 'other',
  };

  return mapping[type] || 'other';
}

function buildEventFromRow(row) {
  if (!row) return null;

  return normalizeEventRecord({
    id: row.id,
    title: row.title,
    description: row.description,
    event_type: row.event_type,
    event_date: row.event_date,
    event_duration: row.event_duration,
    max_participants: row.max_participants,
    current_participants: row.current_participants,
    registration_deadline: row.registration_deadline,
    status: row.status,
    location: row.location,
    meeting_url: row.meeting_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
  });
}

async function fetchSyncRecord(community_event_id) {
  const { rows } = await pool.query(
    `SELECT community_event_id, coordinator_event_id, sync_status, last_sync_at
     FROM event_sync
     WHERE community_event_id = $1
     LIMIT 1`,
    [community_event_id]
  );

  return rows[0] || null;
}

async function fetchEventById(id) {
  const { rows } = await pool.query(
    `SELECT
       id, title, description, event_type, event_date, event_duration,
       max_participants, current_participants, registration_deadline,
       status, location, meeting_url, created_at, updated_at
     FROM events
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function upsertCommunitySyncRecord({ community_event_id, coordinator_event_id }) {
  await pool.query(
    `INSERT INTO event_sync (
       community_event_id, coordinator_event_id, sync_status, last_sync_at, updated_at
     )
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (community_event_id) DO UPDATE
     SET coordinator_event_id = EXCLUDED.coordinator_event_id,
         sync_status = EXCLUDED.sync_status,
         last_sync_at = EXCLUDED.last_sync_at,
         updated_at = NOW()`,
    [community_event_id, coordinator_event_id, 'synced']
  );
}

async function syncSingleEvent(eventData) {
  const {
    community_event_id,
    title,
    description,
    event_type,
    start_at,
    duration = 120,
    location = 'Online',
    max_spots = 100,
    registered_count = 0
  } = eventData;

  const mappedEventType = mapCommunityEventType(event_type);
  const existingSync = await fetchSyncRecord(community_event_id);

  if (existingSync) {
    const { rows } = await pool.query(
      `UPDATE events
       SET title = $1,
           description = $2,
           event_type = $3,
           event_date = $4,
           event_duration = $5,
           location = $6,
           max_participants = $7,
           current_participants = $8,
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        title,
        description || null,
        mappedEventType,
        new Date(start_at).toISOString(),
        duration,
        location,
        max_spots,
        registered_count,
        existingSync.coordinator_event_id,
      ]
    );

    const coordinatorEvent = rows[0];
    if (!coordinatorEvent) {
      throw new AppError('Failed to update existing event', 500);
    }

    await upsertCommunitySyncRecord({
      community_event_id,
      coordinator_event_id: coordinatorEvent.id,
    });

    return {
      coordinator_event: buildEventFromRow(coordinatorEvent),
      community_event_id,
      action: 'updated',
    };
  }

  const { rows } = await pool.query(
    `INSERT INTO events (
       title, description, event_type, event_date, event_duration,
       location, max_participants, current_participants, status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      title,
      description || null,
      mappedEventType,
      new Date(start_at).toISOString(),
      duration,
      location,
      max_spots,
      registered_count,
      'upcoming',
    ]
  );

  const coordinatorEvent = rows[0];
  if (!coordinatorEvent) {
    throw new AppError('Failed to create new event', 500);
  }

  await upsertCommunitySyncRecord({
    community_event_id,
    coordinator_event_id: coordinatorEvent.id,
  });

  return {
    coordinator_event: buildEventFromRow(coordinatorEvent),
    community_event_id,
    action: 'created',
  };
}

// Sync event from community system
export async function syncEvent(req, res, next) {
  try {
    const {
      community_event_id,
      title,
      description,
      event_type,
      start_at,
      duration = 120,
      location = 'Online',
      max_spots = 100,
      registered_count = 0
    } = req.body;

    if (!community_event_id || !title || !start_at) {
      throw new AppError('Missing required fields: community_event_id, title, start_at', 400);
    }

    const result = await syncSingleEvent({
      community_event_id,
      title,
      description,
      event_type,
      start_at,
      duration,
      location,
      max_spots,
      registered_count,
    });

    res.json({
      success: true,
      data: {
        coordinator_event: result.coordinator_event,
        community_event_id,
        sync_status: 'synced'
      },
      message: result.action === 'updated' ? 'Event updated successfully' : 'Event created successfully'
    });

  } catch (error) {
    next(error);
  }
}

// Sync multiple events (batch sync)
export async function syncEvents(req, res, next) {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      throw new AppError('Events array is required', 400);
    }

    const results = [];
    const errors = [];

    for (const eventData of events) {
      try {
        const result = await syncSingleEvent(eventData);
        results.push(result);
      } catch (error) {
        errors.push({
          community_event_id: eventData.community_event_id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        synced: results,
        failed: errors,
        total: events.length,
        success_count: results.length,
        error_count: errors.length
      }
    });

  } catch (error) {
    next(error);
  }
}

// Get sync status
export async function getSyncStatus(req, res, next) {
  try {
    const { community_event_id } = req.query;
    const params = [];
    const where = [];

    if (community_event_id) {
      params.push(community_event_id);
      where.push(`s.community_event_id = $${params.length}`);
    }

    const { rows } = await pool.query(
      `
        SELECT
          s.community_event_id,
          s.coordinator_event_id,
          s.sync_status,
          s.last_sync_at,
          s.created_at,
          s.updated_at,
          e.id AS event_id,
          e.title,
          e.event_date,
          e.status,
          e.event_type,
          e.current_participants,
          e.max_participants
        FROM event_sync s
        LEFT JOIN events e ON e.id = s.coordinator_event_id
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY s.last_sync_at DESC NULLS LAST, s.created_at DESC
      `,
      params
    );

    const syncRecords = rows.map((row) => ({
      ...row,
      events: row.event_id
        ? {
            id: row.event_id,
            title: row.title,
            event_date: row.event_date,
            status: row.status,
            event_type: row.event_type,
            current_participants: row.current_participants,
            max_participants: row.max_participants,
          }
        : null,
    }));

    res.json({
      success: true,
      data: syncRecords
    });

  } catch (error) {
    next(error);
  }
}

// Delete sync record (when community event is deleted)
export async function deleteSync(req, res, next) {
  try {
    const { community_event_id } = req.params;

    const syncRecord = await fetchSyncRecord(community_event_id);
    if (!syncRecord) {
      throw new AppError('Sync record not found', 404);
    }

    const { rowCount } = await pool.query(
      'DELETE FROM event_sync WHERE community_event_id = $1',
      [community_event_id]
    );

    if (!rowCount) {
      throw new AppError('Failed to delete sync record', 500);
    }

    res.json({
      success: true,
      message: 'Sync record deleted successfully'
    });

  } catch (error) {
    next(error);
  }
}
