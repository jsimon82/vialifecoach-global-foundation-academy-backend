import { catchAsync } from '../utils/asyncHelpers.js';
import { AppError } from '../utils/AppError.js';
import { sendEventEmail } from '../services/email.service.js';
import { pool } from '../config/postgres.js';
import { getRegistrationStats as getCoordinatorRegistrationStats } from './registrationStats.controller.js';
import {
  buildEventMutationPayload,
  mapEventStatusToDb,
  mapEventTypeToDb,
  normalizeEventRecord,
  normalizeEmailCampaignRecord,
  normalizeRegistrationRecord,
} from '../utils/eventResponse.js';

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

function buildRegistrationFromRow(row) {
  const event = buildEventFromRow({
    id: row.event_ref_id,
    title: row.event_ref_title,
    description: row.event_ref_description,
    event_type: row.event_ref_event_type,
    event_date: row.event_ref_event_date,
    event_duration: row.event_ref_event_duration,
    max_participants: row.event_ref_max_participants,
    current_participants: row.event_ref_current_participants,
    registration_deadline: row.event_ref_registration_deadline,
    status: row.event_ref_status,
    location: row.event_ref_location,
    meeting_url: row.event_ref_meeting_url,
    created_at: row.event_ref_created_at,
    updated_at: row.event_ref_updated_at,
  });

  return normalizeRegistrationRecord({
    id: row.id,
    event_id: row.event_id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    phone: row.phone,
    organization: row.organization,
    job_title: row.job_title,
    source: row.source,
    status: row.status,
    notes: row.notes,
    reminder_sent: row.reminder_sent,
    reminder_count: row.reminder_count,
    sync_status: row.sync_status,
    community_registration_id: row.community_registration_id,
    registration_date: row.registration_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    event,
    events: event,
  });
}

function normalizeRegistrationSource(value) {
  const source = String(value ?? 'coordinator').trim().toLowerCase();
  return ['coordinator', 'community', 'dual'].includes(source) ? source : 'coordinator';
}

function normalizeRegistrationStatus(value) {
  const status = String(value ?? 'registered').trim().toLowerCase();
  return ['registered', 'confirmed', 'cancelled', 'attended', 'no_show'].includes(status)
    ? status
    : 'registered';
}

function normalizeSyncStatus(value) {
  const syncStatus = String(value ?? 'synced').trim().toLowerCase();
  return ['pending', 'synced', 'failed'].includes(syncStatus) ? syncStatus : 'synced';
}

function toInteger(value, fallback = null) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function buildInsertParts(payload = {}) {
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined);

  return {
    columns: entries.map(([key]) => key),
    values: entries.map(([, value]) => value),
    placeholders: entries.map((_, index) => `$${index + 1}`),
  };
}

function buildUpdateParts(payload = {}) {
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined);
  const values = [];
  const setClauses = entries.map(([key, value]) => {
    values.push(value);
    return `${key} = $${values.length}`;
  });

  return { setClauses, values };
}

function buildEventCampaignFromRow(row) {
  if (!row) return null;

  const event = buildEventFromRow({
    id: row.event_ref_id,
    title: row.event_ref_title,
    description: row.event_ref_description,
    event_type: row.event_ref_event_type,
    event_date: row.event_ref_event_date,
    event_duration: row.event_ref_event_duration,
    max_participants: row.event_ref_max_participants,
    current_participants: row.event_ref_current_participants,
    registration_deadline: row.event_ref_registration_deadline,
    status: row.event_ref_status,
    location: row.event_ref_location,
    meeting_url: row.event_ref_meeting_url,
    created_at: row.event_ref_created_at,
    updated_at: row.event_ref_updated_at,
  });

  return normalizeEmailCampaignRecord({
    id: row.id,
    event_id: row.event_id,
    campaign_type: row.campaign_type,
    subject: row.subject,
    content: row.content,
    recipient_count: row.recipient_count,
    sent_count: row.sent_count,
    failed_count: row.failed_count,
    sent_at: row.sent_at,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    event,
    events: event,
  });
}

function buildRegistrationInsertPayload(input = {}) {
  const payload = {
    event_id: toInteger(input.event_id, null),
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email ? String(input.email).trim().toLowerCase() : undefined,
    phone: input.phone ?? null,
    organization: input.organization ?? null,
    job_title: input.job_title ?? null,
    source: normalizeRegistrationSource(input.source),
    status: normalizeRegistrationStatus(input.status),
    notes: input.notes ?? null,
    reminder_sent: toBoolean(input.reminder_sent, false),
    reminder_count: input.reminder_count !== undefined ? toInteger(input.reminder_count, 0) : 0,
    sync_status: normalizeSyncStatus(input.sync_status),
    community_registration_id: input.community_registration_id !== undefined
      ? toInteger(input.community_registration_id, null)
      : null,
  };

  if (input.registration_date !== undefined) {
    payload.registration_date = input.registration_date ? new Date(input.registration_date).toISOString() : null;
  }

  return payload;
}

function buildRegistrationUpdatePayload(input = {}) {
  const payload = {};

  if (input.event_id !== undefined) payload.event_id = toInteger(input.event_id, null);
  if (input.first_name !== undefined) payload.first_name = input.first_name;
  if (input.last_name !== undefined) payload.last_name = input.last_name;
  if (input.email !== undefined) payload.email = String(input.email).trim().toLowerCase();
  if (input.phone !== undefined) payload.phone = input.phone ?? null;
  if (input.organization !== undefined) payload.organization = input.organization ?? null;
  if (input.job_title !== undefined) payload.job_title = input.job_title ?? null;
  if (input.source !== undefined) payload.source = normalizeRegistrationSource(input.source);
  if (input.status !== undefined) payload.status = normalizeRegistrationStatus(input.status);
  if (input.notes !== undefined) payload.notes = input.notes ?? null;
  if (input.reminder_sent !== undefined) payload.reminder_sent = toBoolean(input.reminder_sent, false);
  if (input.reminder_count !== undefined) payload.reminder_count = toInteger(input.reminder_count, 0);
  if (input.sync_status !== undefined) payload.sync_status = normalizeSyncStatus(input.sync_status);
  if (input.community_registration_id !== undefined) {
    payload.community_registration_id = toInteger(input.community_registration_id, null);
  }
  if (input.registration_date !== undefined) {
    payload.registration_date = input.registration_date ? new Date(input.registration_date).toISOString() : null;
  }

  return payload;
}

async function refreshEventParticipantCounts(eventIds = []) {
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

async function fetchRegistrationById(id) {
  const { rows } = await pool.query(
    `
      SELECT
        r.id,
        r.event_id,
        r.first_name,
        r.last_name,
        r.email,
        r.phone,
        r.organization,
        r.job_title,
        r.source,
        r.status,
        r.notes,
        r.reminder_sent,
        r.reminder_count,
        r.sync_status,
        r.community_registration_id,
        r.registration_date,
        r.created_at,
        r.updated_at,
        e.id AS event_ref_id,
        e.title AS event_ref_title,
        e.description AS event_ref_description,
        e.event_type AS event_ref_event_type,
        e.event_date AS event_ref_event_date,
        e.event_duration AS event_ref_event_duration,
        e.max_participants AS event_ref_max_participants,
        e.current_participants AS event_ref_current_participants,
        e.registration_deadline AS event_ref_registration_deadline,
        e.status AS event_ref_status,
        e.location AS event_ref_location,
        e.meeting_url AS event_ref_meeting_url,
        e.created_at AS event_ref_created_at,
        e.updated_at AS event_ref_updated_at
      FROM event_registrations r
      LEFT JOIN events e ON e.id = r.event_id
      WHERE r.id = $1
      LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
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

async function fetchEventCampaigns(eventId) {
  const params = [];
  const where = [];

  if (eventId) {
    params.push(eventId);
    where.push(`c.event_id = $${params.length}`);
  }

  const { rows } = await pool.query(
    `
      SELECT
        c.id,
        c.event_id,
        c.campaign_type,
        c.subject,
        c.content,
        c.recipient_count,
        c.sent_count,
        c.failed_count,
        c.sent_at,
        c.status,
        c.created_at,
        c.updated_at,
        e.id AS event_ref_id,
        e.title AS event_ref_title,
        e.description AS event_ref_description,
        e.event_type AS event_ref_event_type,
        e.event_date AS event_ref_event_date,
        e.event_duration AS event_ref_event_duration,
        e.max_participants AS event_ref_max_participants,
        e.current_participants AS event_ref_current_participants,
        e.registration_deadline AS event_ref_registration_deadline,
        e.status AS event_ref_status,
        e.location AS event_ref_location,
        e.meeting_url AS event_ref_meeting_url,
        e.created_at AS event_ref_created_at,
        e.updated_at AS event_ref_updated_at
      FROM email_campaigns c
      LEFT JOIN events e ON e.id = c.event_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY c.created_at DESC
    `,
    params
  );

  return rows.map(buildEventCampaignFromRow);
}

const eventSelectSql = `
  SELECT
    id,
    title,
    description,
    event_type,
    event_date,
    event_duration,
    max_participants,
    current_participants,
    registration_deadline,
    status,
    location,
    meeting_url,
    created_at,
    updated_at
`;

const registrationSelectSql = `
  SELECT
    r.id,
    r.event_id,
    r.first_name,
    r.last_name,
    r.email,
    r.phone,
    r.organization,
    r.job_title,
    r.source,
    r.status,
    r.notes,
    r.reminder_sent,
    r.reminder_count,
    r.sync_status,
    r.community_registration_id,
    r.registration_date,
    r.created_at,
    r.updated_at,
    e.id AS event_ref_id,
    e.title AS event_ref_title,
    e.description AS event_ref_description,
    e.event_type AS event_ref_event_type,
    e.event_date AS event_ref_event_date,
    e.event_duration AS event_ref_event_duration,
    e.max_participants AS event_ref_max_participants,
    e.current_participants AS event_ref_current_participants,
    e.registration_deadline AS event_ref_registration_deadline,
    e.status AS event_ref_status,
    e.location AS event_ref_location,
    e.meeting_url AS event_ref_meeting_url,
    e.created_at AS event_ref_created_at,
    e.updated_at AS event_ref_updated_at
`;

// Get all events
export const getAllEvents = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status, event_type } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const clauses = [];
  const params = [];

  if (status) {
    params.push(mapEventStatusToDb(status));
    clauses.push(`status = $${params.length}`);
  }
  if (event_type) {
    params.push(mapEventTypeToDb(event_type));
    clauses.push(`event_type = $${params.length}`);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM events ${whereSql}`,
    params
  );

  const { rows: events } = await pool.query(
    `SELECT * FROM events ${whereSql} ORDER BY event_date ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, Number(limit), offset]
  );

  const normalizedEvents = events.map(buildEventFromRow);
  const count = countRows[0]?.count || 0;

  res.json({
    success: true,
    events: normalizedEvents,
    total: count,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / Number(limit))
    }
    ,
    data: normalizedEvents
  });
});

// Get single event with registrations
export const getEventById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const { rows: eventRows } = await pool.query(
    'SELECT * FROM events WHERE id = $1 LIMIT 1',
    [id]
  );

  if (eventRows.length === 0) throw new AppError('Event not found', 404);

  const { rows: registrationRows } = await pool.query(
    `
      SELECT
        r.id,
        r.event_id,
        r.first_name,
        r.last_name,
        r.email,
        r.phone,
        r.organization,
        r.job_title,
        r.source,
        r.status,
        r.notes,
        r.reminder_sent,
        r.reminder_count,
        r.sync_status,
        r.community_registration_id,
        r.registration_date,
        r.created_at,
        r.updated_at,
        e.id AS event_ref_id,
        e.title AS event_ref_title,
        e.description AS event_ref_description,
        e.event_type AS event_ref_event_type,
        e.event_date AS event_ref_event_date,
        e.event_duration AS event_ref_event_duration,
        e.max_participants AS event_ref_max_participants,
        e.current_participants AS event_ref_current_participants,
        e.registration_deadline AS event_ref_registration_deadline,
        e.status AS event_ref_status,
        e.location AS event_ref_location,
        e.meeting_url AS event_ref_meeting_url,
        e.created_at AS event_ref_created_at,
        e.updated_at AS event_ref_updated_at
      FROM event_registrations r
      LEFT JOIN events e ON e.id = r.event_id
      WHERE r.event_id = $1
      ORDER BY COALESCE(r.registration_date, r.created_at, NOW()) DESC
    `,
    [id]
  );

  const normalizedEvent = buildEventFromRow(eventRows[0]);
  const normalizedRegistrations = registrationRows.map(buildRegistrationFromRow);

  res.json({
    success: true,
    ...normalizedEvent,
    registrations: normalizedRegistrations,
    data: {
      ...normalizedEvent,
      registrations: normalizedRegistrations
    }
  });
});

// Create new event
export const createEvent = catchAsync(async (req, res) => {
  const eventData = buildEventMutationPayload(req.body, { isCreate: true });

  if (!eventData.title || !eventData.event_date) {
    throw new AppError('Event title and date are required', 400);
  }

  const { columns, values, placeholders } = buildInsertParts(eventData);
  const { rows } = await pool.query(
    `INSERT INTO events (${columns.join(', ')})
     VALUES (${placeholders.join(', ')})
     RETURNING *`,
    values
  );

  const event = rows[0];
  if (!event) {
    throw new AppError('Failed to create event', 500);
  }

  const normalizedEvent = normalizeEventRecord(event);

  res.status(201).json({
    success: true,
    ...normalizedEvent,
    data: normalizedEvent,
  });
});

// Update event
export const updateEvent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = buildEventMutationPayload(req.body);

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No event fields provided', 400);
  }

  const { setClauses, values } = buildUpdateParts(updateData);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE events
     SET ${setClauses.join(', ')}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  const event = rows[0];
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  const normalizedEvent = normalizeEventRecord(event);

  res.json({
    success: true,
    ...normalizedEvent,
    data: normalizedEvent,
  });
});

// Delete event
export const deleteEvent = catchAsync(async (req, res) => {
  const { id } = req.params;

  const { rowCount } = await pool.query('DELETE FROM events WHERE id = $1', [id]);
  if (!rowCount) {
    throw new AppError('Event not found', 404);
  }

  res.json({
    success: true,
    message: 'Event deleted successfully',
  });
});

// Get all registrations (with optional filters)
export const getAllRegistrations = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    event_id,
    status,
    event_type,
    search,
  } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const clauses = [];
  const params = [];

  if (event_id) {
    params.push(event_id);
    clauses.push(`r.event_id = $${params.length}`);
  }
  if (status) {
    params.push(String(status).trim().toLowerCase());
    clauses.push(`LOWER(COALESCE(r.status, 'registered')) = $${params.length}`);
  }
  if (event_type) {
    params.push(mapEventTypeToDb(event_type));
    clauses.push(`e.event_type = $${params.length}`);
  }
  if (search) {
    params.push(`%${String(search).trim()}%`);
    clauses.push(`(r.first_name ILIKE $${params.length} OR r.last_name ILIKE $${params.length} OR r.email ILIKE $${params.length})`);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const { rows: countRows } = await pool.query(
    `
      SELECT COUNT(*)::int AS count
      FROM event_registrations r
      LEFT JOIN events e ON e.id = r.event_id
      ${whereSql}
    `,
    params
  );

  const { rows: registrations } = await pool.query(
    `
      ${registrationSelectSql}
      FROM event_registrations r
      LEFT JOIN events e ON e.id = r.event_id
      ${whereSql}
      ORDER BY COALESCE(r.registration_date, r.created_at, NOW()) DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `,
    [...params, Number(limit), offset]
  );

  const normalizedRegistrations = registrations.map(buildRegistrationFromRow);
  const count = countRows[0]?.count || 0;

  res.json({
    success: true,
    registrations: normalizedRegistrations,
    total: count,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / Number(limit))
    },
    data: normalizedRegistrations
  });
});

// Create new registration
export const createRegistration = catchAsync(async (req, res) => {
  const registrationData = req.body || {};
  const normalizedEmail = String(registrationData.email || '').trim().toLowerCase();

  if (!registrationData.event_id || !registrationData.first_name || !registrationData.last_name || !normalizedEmail) {
    throw new AppError('Event ID, first name, last name, and email are required', 400);
  }

  const event = await fetchEventById(registrationData.event_id);
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
    throw new AppError('Registration deadline has passed', 400);
  }

  const existingRegistration = await fetchRegistrationByEventAndEmail(registrationData.event_id, normalizedEmail);
  if (existingRegistration) {
    throw new AppError('Already registered for this event', 400);
  }

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM event_registrations
     WHERE event_id = $1
       AND COALESCE(status, 'registered') <> 'cancelled'`,
    [registrationData.event_id]
  );
  const activeCount = countRows[0]?.count || 0;

  if (event.max_participants && activeCount >= event.max_participants) {
    throw new AppError('Event is fully booked', 400);
  }

  const payload = buildRegistrationInsertPayload({
    ...registrationData,
    email: normalizedEmail,
  });
  const { columns, values, placeholders } = buildInsertParts(payload);
  const { rows } = await pool.query(
    `INSERT INTO event_registrations (${columns.join(', ')})
     VALUES (${placeholders.join(', ')})
     RETURNING *`,
    values
  );

  const registration = rows[0];
  if (!registration) {
    throw new AppError('Failed to create registration', 500);
  }

  await refreshEventParticipantCounts([registration.event_id]);
  const refreshedRegistration = await fetchRegistrationById(registration.id);
  const normalizedEvent = normalizeEventRecord(event);
  const normalizedRegistration = normalizeRegistrationRecord({
    ...(refreshedRegistration || registration),
    event: normalizedEvent,
    events: normalizedEvent,
  });

  try {
    await sendEventEmail({
      type: 'confirmation',
      recipient: normalizedEmail,
      event: normalizedEvent,
      registration: normalizedRegistration,
    });
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
  }

  res.status(201).json({
    success: true,
    ...normalizedRegistration,
    data: normalizedRegistration,
  });
});

// Update registration
export const updateRegistration = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = buildRegistrationUpdatePayload(req.body || {});

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No registration fields provided', 400);
  }

  const { rows: currentRows } = await pool.query(
    'SELECT id, event_id, email FROM event_registrations WHERE id = $1 LIMIT 1',
    [id]
  );
  const currentRegistration = currentRows[0];

  if (!currentRegistration) {
    throw new AppError('Registration not found', 404);
  }

  const targetEventId = updateData.event_id ?? currentRegistration.event_id;
  const isMovingEvents =
    updateData.event_id !== undefined &&
    Number(updateData.event_id) !== Number(currentRegistration.event_id);

  if (isMovingEvents) {
    const targetEvent = await fetchEventById(updateData.event_id);
    if (!targetEvent) {
      throw new AppError('Event not found', 404);
    }

    if (targetEvent.registration_deadline && new Date() > new Date(targetEvent.registration_deadline)) {
      throw new AppError('Registration deadline has passed', 400);
    }

    const { rows: targetCountRows } = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM event_registrations
       WHERE event_id = $1
         AND COALESCE(status, 'registered') <> 'cancelled'`,
      [updateData.event_id]
    );
    const targetCount = targetCountRows[0]?.count || 0;
    if (targetEvent.max_participants && targetCount >= targetEvent.max_participants) {
      throw new AppError('Event is fully booked', 400);
    }
  }

  const { setClauses, values } = buildUpdateParts(updateData);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE event_registrations
     SET ${setClauses.join(', ')}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );

  const registration = rows[0];
  if (!registration) {
    throw new AppError('Registration not found', 404);
  }

  await refreshEventParticipantCounts([currentRegistration.event_id, targetEventId]);
  const refreshedRegistration = await fetchRegistrationById(registration.id);
  const normalizedRegistration = normalizeRegistrationRecord(refreshedRegistration || registration);

  res.json({
    success: true,
    ...normalizedRegistration,
    data: normalizedRegistration,
  });
});

// Delete registration
export const deleteRegistration = catchAsync(async (req, res) => {
  const { id } = req.params;

  const { rows } = await pool.query(
    'DELETE FROM event_registrations WHERE id = $1 RETURNING event_id',
    [id]
  );

  const deleted = rows[0];
  if (!deleted) {
    throw new AppError('Registration not found', 404);
  }

  await refreshEventParticipantCounts([deleted.event_id]);

  res.json({
    success: true,
    message: 'Registration deleted successfully'
  });
});

// Send reminder emails
export const sendReminderEmails = catchAsync(async (req, res) => {
  const { event_id, custom_message } = req.body || {};

  const event = await fetchEventById(event_id);
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  const { rows: registrations } = await pool.query(
    `
      SELECT
        r.id,
        r.event_id,
        r.first_name,
        r.last_name,
        r.email,
        r.phone,
        r.organization,
        r.job_title,
        r.source,
        r.status,
        r.notes,
        r.reminder_sent,
        r.reminder_count,
        r.sync_status,
        r.community_registration_id,
        r.registration_date,
        r.created_at,
        r.updated_at,
        e.id AS event_ref_id,
        e.title AS event_ref_title,
        e.description AS event_ref_description,
        e.event_type AS event_ref_event_type,
        e.event_date AS event_ref_event_date,
        e.event_duration AS event_ref_event_duration,
        e.max_participants AS event_ref_max_participants,
        e.current_participants AS event_ref_current_participants,
        e.registration_deadline AS event_ref_registration_deadline,
        e.status AS event_ref_status,
        e.location AS event_ref_location,
        e.meeting_url AS event_ref_meeting_url,
        e.created_at AS event_ref_created_at,
        e.updated_at AS event_ref_updated_at
      FROM event_registrations r
      LEFT JOIN events e ON e.id = r.event_id
      WHERE r.event_id = $1
        AND COALESCE(r.status, 'registered') = 'registered'
        AND COALESCE(r.reminder_count, 0) < 3
      ORDER BY COALESCE(r.created_at, r.registration_date, NOW()) DESC
    `,
    [event_id]
  );

  if (!registrations || registrations.length === 0) {
    return res.json({
      success: true,
      message: 'No registrations to send reminders to',
      sent_count: 0
    });
  }

  const { rows: campaignRows } = await pool.query(
    `INSERT INTO email_campaigns (
       event_id, campaign_type, subject, content, recipient_count, status
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      event_id,
      'reminder',
      `Reminder: ${event.title} starts soon!`,
      custom_message || `This is a reminder that ${event.title} is starting soon.`,
      registrations.length,
      'sending',
    ]
  );

  const campaign = campaignRows[0];
  if (!campaign) {
    throw new AppError('Failed to create email campaign', 500);
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const registration of registrations) {
    const normalizedEvent = normalizeEventRecord(event);
    const normalizedRegistration = normalizeRegistrationRecord({
      ...registration,
      event: normalizedEvent,
      events: normalizedEvent,
    });

    try {
      await sendEventEmail({
        type: 'reminder',
        recipient: registration.email,
        event: normalizedEvent,
        registration: normalizedRegistration,
        custom_message,
      });

      await pool.query(
        `UPDATE event_registrations
         SET reminder_sent = true,
             reminder_count = COALESCE(reminder_count, 0) + 1,
             updated_at = NOW()
         WHERE id = $1`,
        [registration.id]
      );

      await pool.query(
        `INSERT INTO email_delivery_logs (
           campaign_id, registration_id, recipient_email, status
         )
         VALUES ($1, $2, $3, $4)`,
        [campaign.id, registration.id, registration.email, 'sent']
      );

      sentCount++;
    } catch (error) {
      console.error(`Failed to send reminder to ${registration.email}:`, error);

      await pool.query(
        `INSERT INTO email_delivery_logs (
           campaign_id, registration_id, recipient_email, status, error_message
         )
         VALUES ($1, $2, $3, $4, $5)`,
        [campaign.id, registration.id, registration.email, 'failed', error.message]
      );

      failedCount++;
    }
  }

  await pool.query(
    `UPDATE email_campaigns
     SET sent_count = $1,
         failed_count = $2,
         status = $3,
         sent_at = NOW(),
         updated_at = NOW()
     WHERE id = $4`,
    [sentCount, failedCount, 'sent', campaign.id]
  );

  res.json({
    success: true,
    message: 'Reminder emails sent successfully',
    sent_count: sentCount,
    failed_count: failedCount,
    campaign_id: campaign.id
  });
});

// Get email campaigns
export const getEmailCampaigns = catchAsync(async (req, res) => {
  const campaigns = await fetchEventCampaigns(req.query?.event_id);

  res.json({
    success: true,
    data: campaigns,
  });
});

// Get registration statistics
export const getRegistrationStats = getCoordinatorRegistrationStats;
