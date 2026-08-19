import { pool } from '../config/postgres.js';
import { AppError } from '../utils/AppError.js';
import {
  mapEventTypeToDb,
  normalizeEventRecord,
  normalizeRegistrationRecord,
} from '../utils/eventResponse.js';
import {
  fetchGoogleSheetEvents,
  registerGoogleSheetEvent,
} from '../services/googleAppsScript.service.js';

function toInteger(value, fallback = null) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

function normalizeSource(value) {
  const source = String(value ?? 'dual').trim().toLowerCase();
  return ['coordinator', 'community', 'dual'].includes(source) ? source : 'dual';
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

async function resolveLocalEvent(eventId) {
  const localId = toInteger(eventId, null);
  if (localId) {
    const event = await fetchEventById(localId);
    if (event) {
      const { rows: syncRows } = await pool.query(
        `SELECT community_event_id FROM event_sync WHERE coordinator_event_id = $1 LIMIT 1`,
        [localId]
      );
      return {
        event,
        coordinatorId: localId,
        externalEventId: syncRows[0]?.community_event_id ?? null
      };
    }
  }

  const externalId = toInteger(eventId, null);
  if (externalId) {
    const { rows } = await pool.query(
      `SELECT coordinator_event_id, community_event_id
       FROM event_sync
       WHERE community_event_id = $1
       LIMIT 1`,
      [externalId]
    );
    if (rows[0]) {
      const event = await fetchEventById(rows[0].coordinator_event_id);
      if (event) {
        return {
          event,
          coordinatorId: rows[0].coordinator_event_id,
          externalEventId: rows[0].community_event_id
        };
      }
    }
  }

  return null;
}

async function fetchRegistrationByEventAndEmail(eventId, email) {
  const { rows } = await pool.query(
    `SELECT id
     FROM event_registrations
     WHERE event_id = $1
       AND LOWER(email) = LOWER($2)
     LIMIT 1`,
    [eventId, email]
  );

  return rows[0] || null;
}

async function refreshEventParticipantCount(eventIds = []) {
  const ids = [...new Set(
    eventIds
      .map((value) => toInteger(value, null))
      .filter((value) => Number.isFinite(value))
  )];

  if (ids.length === 0) {
    return;
  }

  await pool.query(
    `UPDATE events e
     SET current_participants = COALESCE((
       SELECT COUNT(*)::int
       FROM event_registrations r
       WHERE r.event_id = e.id
         AND COALESCE(r.status, 'registered') <> 'cancelled'
     ), 0),
         updated_at = NOW()
     WHERE e.id = ANY($1::int[])`,
    [ids]
  );
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

// Create public registration (no authentication required)
export async function createPublicRegistration(req, res, next) {
  try {
    const {
      event_id,
      first_name,
      last_name,
      email,
      phone,
      organization,
      job_title,
      source = 'dual'
    } = req.body;

    if (!event_id || !first_name || !last_name || !email || !phone) {
      throw new AppError('Missing required fields', 400);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const resolved = await resolveLocalEvent(event_id);

    if (!resolved || !resolved.event || resolved.event.status !== 'upcoming' || !resolved.externalEventId) {
      throw new AppError('Event not found or not available for registration', 404);
    }

    const event = resolved.event;
    const localEventId = resolved.coordinatorId;
    const externalEventId = resolved.externalEventId;

    if (event.max_participants && event.current_participants >= event.max_participants) {
      throw new AppError('Event is at full capacity', 400);
    }

    const existingRegistration = await fetchRegistrationByEventAndEmail(localEventId, normalizedEmail);
    if (existingRegistration) {
      throw new AppError('Email already registered for this event', 409);
    }

    const { rows } = await pool.query(
      `INSERT INTO event_registrations (
         event_id, first_name, last_name, email, phone,
         organization, job_title, source, status, sync_status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        localEventId,
        first_name,
        last_name,
        normalizedEmail,
        phone,
        organization || null,
        job_title || null,
        normalizeSource(source),
        'registered',
        'synced',
      ]
    );

    const registration = rows[0];
    if (!registration) {
      throw new AppError('Failed to create registration', 500);
    }

    await refreshEventParticipantCount([registration.event_id]);
    const refreshedEvent = await fetchEventById(localEventId);
    const normalizedEvent = buildEventFromRow(refreshedEvent || event);
    const publicEvent = {
      ...normalizedEvent,
      is_available: normalizedEvent.max_participants
        ? normalizedEvent.current_participants < normalizedEvent.max_participants
        : true
    };

    let sheetSync = { success: false };
    if (externalEventId) {
      try {
        const googleResult = await registerGoogleSheetEvent({
          eventId: externalEventId,
          fullName: `${first_name} ${last_name}`,
          email: normalizedEmail,
          phone,
          organization,
        });

        sheetSync = { success: true, result: googleResult };
      } catch (googleError) {
        console.error('Google Apps Script registration sync failed:', googleError);
        sheetSync = { success: false, error: String(googleError.message || googleError) };
      }
    } else {
      sheetSync = { success: false, error: 'Event is not synced to Google Sheets yet' };
    }

    const normalizedRegistration = normalizeRegistrationRecord({
      ...registration,
      event: publicEvent
    });

    res.status(201).json({
      success: true,
      sheet_sync: sheetSync,
      ...normalizedRegistration,
      registration: normalizedRegistration,
      event: publicEvent,
      data: {
        registration: normalizedRegistration,
        event: publicEvent
      },
      message: normalizeSource(source) === 'dual'
        ? 'Registration successful! You are registered for both the community event and coordinator dashboard.'
        : 'Registration successful!'
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicSheetEvents(req, res, next) {
  try {
    const googleResponse = await fetchGoogleSheetEvents();
    const events = googleResponse?.events ?? googleResponse?.data?.events ?? googleResponse?.data ?? googleResponse;

    res.json({
      success: true,
      events,
      data: events
    });
  } catch (error) {
    next(error);
  }
}

// Get public event details (no authentication required)
export async function getPublicEvent(req, res, next) {
  try {
    const { id } = req.params;

    const event = await fetchEventById(id);
    if (!event || event.status !== 'upcoming') {
      throw new AppError('Event not found', 404);
    }

    const publicEvent = {
      ...buildEventFromRow(event),
      is_available: event.max_participants ? (event.current_participants || 0) < event.max_participants : true
    };

    res.json({
      success: true,
      ...publicEvent,
      event: publicEvent,
      data: publicEvent
    });

  } catch (error) {
    next(error);
  }
}

// Get list of public events (no authentication required)
export async function getPublicEvents(req, res, next) {
  try {
    const { page = 1, limit = 10, event_type } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const clauses = [`status = 'upcoming'`];
    const params = [];

    if (event_type) {
      params.push(mapEventTypeToDb(event_type));
      clauses.push(`event_type = $${params.length}`);
    }

    const whereSql = `WHERE ${clauses.join(' AND ')}`;

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM events ${whereSql}`,
      params
    );

    const { rows: events } = await pool.query(
      `
        SELECT
          id, title, description, event_type, event_date, event_duration,
          max_participants, current_participants, registration_deadline,
          status, location, meeting_url, created_at, updated_at
        FROM events
        ${whereSql}
        ORDER BY event_date ASC
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
      `,
      [...params, Number(limit), offset]
    );

    const publicEvents = (events || []).map((event) => {
      const normalizedEvent = buildEventFromRow(event);
      return {
        ...normalizedEvent,
        is_available: normalizedEvent.max_participants
          ? (normalizedEvent.current_participants || 0) < normalizedEvent.max_participants
          : true
      };
    });

    const total = countRows[0]?.count || 0;

    res.json({
      success: true,
      events: publicEvents,
      total,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
      },
      data: publicEvents
    });

  } catch (error) {
    next(error);
  }
}

// Check registration status (no authentication required)
export async function checkRegistrationStatus(req, res, next) {
  try {
    const { event_id, email } = req.query;

    if (!event_id || !email) {
      throw new AppError('Event ID and email are required', 400);
    }

    const { rows } = await pool.query(
      `SELECT
         id, event_id, first_name, last_name, email, phone, organization,
         job_title, source, status, notes, reminder_sent, reminder_count,
         sync_status, community_registration_id, registration_date,
         created_at, updated_at
       FROM event_registrations
       WHERE event_id = $1
         AND LOWER(email) = LOWER($2)
       LIMIT 1`,
      [event_id, String(email).trim().toLowerCase()]
    );

    const registration = rows[0] || null;
    const isRegistered = Boolean(registration);
    const normalizedRegistration = isRegistered
      ? normalizeRegistrationRecord({
          id: registration.id,
          registration_date: registration.registration_date,
          status: registration.status,
          source: registration.source
        })
      : null;

    res.json({
      success: true,
      is_registered: isRegistered,
      registration: normalizedRegistration,
      data: {
        is_registered: isRegistered,
        registration: normalizedRegistration
      }
    });

  } catch (error) {
    next(error);
  }
}
