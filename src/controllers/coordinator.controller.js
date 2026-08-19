import { catchAsync } from '../utils/asyncHelpers.js';
import { AppError } from '../utils/AppError.js';
import { generateAccessToken } from '../utils/utils.jwt.js';
import { Token } from '../models/Token.model.js';
import { findCoordinatorByEmail } from '../models/Coordinator.model.js';
import { pool } from '../config/postgres.js';
import { ensureAuditLogSchema, recordAuditLog } from '../utils/auditLog.js';
import { createGoogleSheetEvent } from '../services/googleAppsScript.service.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

function buildCoordinatorResponse(coordinator) {
  if (!coordinator) {
    return null;
  }

  const fullName = [coordinator.first_name, coordinator.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    id: coordinator.id,
    email: coordinator.email,
    first_name: coordinator.first_name,
    last_name: coordinator.last_name,
    name: fullName || coordinator.email,
    phone: coordinator.phone || null,
    department: coordinator.department || null,
    is_active: coordinator.is_active,
    last_login: coordinator.last_login || null,
    created_at: coordinator.created_at || null,
    updated_at: coordinator.updated_at || null
  };
}

async function revokeCoordinatorRefreshToken(email) {
  if (!email) return;
  try {
    await pool.query('DELETE FROM refresh_tokens WHERE user_email = $1', [email]);
  } catch (error) {
    console.warn('[coordinator] Failed to revoke refresh token:', error.message);
  }
}

async function logCoordinatorAction(req, action, entityId, details = {}) {
  await recordAuditLog({
    actorUserId: req.user?.id || null,
    actorEmail: req.user?.email || null,
    action,
    entityType: 'coordinator',
    entityId: entityId !== undefined && entityId !== null ? String(entityId) : null,
    details,
    ipAddress: req.ip || req.connection?.remoteAddress || null,
  });
}

// Coordinator login
export const coordinatorLogin = catchAsync(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    console.warn('[coordinatorLogin] Missing required fields', {
      hasEmail: Boolean(email),
      hasPassword: Boolean(password)
    });
    throw new AppError('Email and password are required', 400);
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  // Find coordinator
  const { rows: coordinatorRows } = await pool.query(
    'SELECT * FROM coordinators WHERE LOWER(email) = LOWER($1) AND is_active = true LIMIT 1',
    [normalizedEmail]
  );

  const coordinator = coordinatorRows[0];
  if (!coordinator) {
    console.warn('[coordinatorLogin] Coordinator lookup failed', {
      email: normalizedEmail,
      hasSupabaseError: false
    });
    throw new AppError('Invalid email or password', 401);
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, coordinator.password_hash);
  if (!isValidPassword) {
    console.warn('[coordinatorLogin] Password mismatch', {
      coordinatorId: coordinator.id,
      email: normalizedEmail
    });
    throw new AppError('Invalid email or password', 401);
  }

  // Generate tokens
  const accessToken = generateAccessToken({ 
    id: coordinator.id, 
    email: coordinator.email, 
    role: 'coordinator' 
  });
  
  const refreshToken = jwt.sign({ 
    email: coordinator.email, 
    role: 'coordinator' 
  }, process.env.REFRESH_TOKEN_SECRET);

  // Store refresh token
  await Token.findOneAndUpdate(
    { userEmail: coordinator.email },
    { refreshToken, createdAt: new Date() },
    { upsert: true, new: true }
  );

  // Update last login
  await pool.query(
    `UPDATE coordinators
     SET last_login = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [coordinator.id]
  );

  res.cookie('refreshToken', refreshToken, refreshCookieOptions);

  const coordinatorResponse = {
    id: coordinator.id,
    name: `${coordinator.first_name} ${coordinator.last_name}`,
    email: coordinator.email,
    role: 'coordinator',
    department: coordinator.department
  };

  res.json({
    accessToken,
    coordinator: coordinatorResponse,
    user: {
      ...coordinatorResponse
    }
  });
});

// Get coordinator profile
export const getCoordinatorProfile = catchAsync(async (req, res) => {
  const email = String(req.user?.email || '').trim().toLowerCase();
  const coordinator = email ? await findCoordinatorByEmail(email) : null;

  if (!coordinator) {
    return res.json({
      success: true,
      data: {
        id: req.user?.id || null,
        email: req.user?.email || null,
        name: req.user?.name || null,
        role: 'coordinator',
        verified: true,
        department: req.user?.department || null,
        is_active: true,
        last_login: null,
      }
    });
  }

  res.json({
    success: true,
    data: buildCoordinatorResponse(coordinator)
  });
});

// Create new coordinator (admin only)
export const createCoordinator = catchAsync(async (req, res) => {
  const { email, password, first_name, last_name, phone, department } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail || !password || !first_name || !last_name) {
    throw new AppError('Email, password, first name, and last name are required', 400);
  }

  const { rows: existingRows } = await pool.query(
    'SELECT id FROM coordinators WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [normalizedEmail]
  );

  if (existingRows.length > 0) {
    throw new AppError('Coordinator with this email already exists', 400);
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 12);

  const { rows } = await pool.query(
    `INSERT INTO coordinators (
       email, password_hash, first_name, last_name, phone, department, is_active, created_at, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
     RETURNING id, email, first_name, last_name, phone, department, is_active, last_login, created_at, updated_at`,
    [normalizedEmail, password_hash, first_name, last_name, phone || null, department || null]
  );

  const coordinator = rows[0];
  if (!coordinator) throw new AppError('Failed to create coordinator', 500);

  await logCoordinatorAction(req, 'coordinator.create', coordinator.id, {
    email: coordinator.email,
    department: coordinator.department || null,
    is_active: coordinator.is_active,
  });

  res.status(201).json({
    success: true,
    data: buildCoordinatorResponse(coordinator)
  });
});

// Update coordinator
export const updateCoordinator = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  if (!id) {
    throw new AppError('Coordinator ID is required', 400);
  }

  delete updateData.password_hash;
  delete updateData.password;
  delete updateData.new_password;

  if (updateData.email) {
    updateData.email = String(updateData.email).trim().toLowerCase();
  }

  // Allow password reset here for admins, but keep the raw password out of the update payload.
  const resetPassword = req.body?.password || req.body?.new_password;
  if (resetPassword) {
    updateData.password_hash = await bcrypt.hash(resetPassword, 12);
  }

  const { rows: currentRows } = await pool.query(
    'SELECT id, email, first_name, last_name, phone, department, is_active, last_login, created_at, updated_at FROM coordinators WHERE id = $1 LIMIT 1',
    [id]
  );

  const currentCoordinator = currentRows[0];
  if (!currentCoordinator) {
    throw new AppError('Coordinator not found', 404);
  }

  const updateFields = [];
  const updateValues = [];
  for (const [key, value] of Object.entries(updateData)) {
    updateValues.push(value);
    updateFields.push(`${key} = $${updateValues.length}`);
  }

  if (updateFields.length === 0) {
    throw new AppError('No coordinator fields provided', 400);
  }

  updateValues.push(id);

  const { rows } = await pool.query(
    `UPDATE coordinators
     SET ${updateFields.join(', ')}, updated_at = NOW()
     WHERE id = $${updateValues.length}
     RETURNING id, email, first_name, last_name, phone, department, is_active, last_login, created_at, updated_at`,
    updateValues
  );

  const coordinator = rows[0];
  if (!coordinator) throw new AppError('Failed to update coordinator', 500);

  if (resetPassword) {
    await revokeCoordinatorRefreshToken(coordinator.email);
  }

  await logCoordinatorAction(req, 'coordinator.update', coordinator.id, {
    changes: Object.keys(updateData),
    email: coordinator.email,
    department: coordinator.department || null,
    is_active: coordinator.is_active,
    password_reset: Boolean(resetPassword),
  });

  res.json({
    success: true,
    data: buildCoordinatorResponse(coordinator)
  });
});

// Change coordinator password
export const changeCoordinatorPassword = catchAsync(async (req, res) => {
  const { current_password, new_password } = req.body || {};
  const { id } = req.user;

  // Get current coordinator
  const { rows: coordinatorRows } = await pool.query(
    'SELECT password_hash, email, department FROM coordinators WHERE id = $1 LIMIT 1',
    [id]
  );
  const coordinator = coordinatorRows[0];

  if (!coordinator) {
    throw new AppError('Coordinator not found', 404);
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(current_password, coordinator.password_hash);
  if (!isValidPassword) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Hash new password
  const new_password_hash = await bcrypt.hash(new_password, 12);

  // Update password
  const { rows: refreshedRows } = await pool.query(
    `UPDATE coordinators
     SET password_hash = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING email, id, department`,
    [new_password_hash, id]
  );
  const refreshedCoordinator = refreshedRows[0];

  await revokeCoordinatorRefreshToken(refreshedCoordinator?.email || req.user?.email);
  await logCoordinatorAction(req, 'coordinator.password_change', id, {
    password_reset: true,
    department: refreshedCoordinator?.department || null,
  });

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Get all coordinators (admin only)
export const getAllCoordinators = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, is_active } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const params = [];
  const clauses = [];

  if (is_active !== undefined) {
    params.push(is_active === 'true');
    clauses.push(`is_active = $${params.length}`);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM coordinators ${whereSql}`,
    params
  );

  const { rows: coordinators } = await pool.query(
    `SELECT id, email, first_name, last_name, phone, department, is_active, last_login, created_at, updated_at
     FROM coordinators
     ${whereSql}
     ORDER BY created_at DESC
     LIMIT $${params.length + 1}
     OFFSET $${params.length + 2}`,
    [...params, Number(limit), offset]
  );

  const count = countRows[0]?.count || 0;

  res.json({
    success: true,
    data: coordinators.map(buildCoordinatorResponse),
    pagination: {
      page: Number.parseInt(page, 10),
      limit: Number.parseInt(limit, 10),
      total: count,
      pages: Math.ceil(count / Number(limit))
    }
  });
});

// Toggle coordinator status (admin only)
export const toggleCoordinatorStatus = catchAsync(async (req, res) => {
  const { id } = req.params;

  const { rows: currentRows } = await pool.query(
    'SELECT id, email, first_name, last_name, phone, department, is_active, last_login, created_at, updated_at FROM coordinators WHERE id = $1 LIMIT 1',
    [id]
  );
  const coordinator = currentRows[0];

  if (!coordinator) {
    throw new AppError('Coordinator not found', 404);
  }

  const newStatus = !coordinator.is_active;

  const { rows: updatedRows } = await pool.query(
    `UPDATE coordinators
     SET is_active = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, email, first_name, last_name, phone, department, is_active, last_login, created_at, updated_at`,
    [newStatus, id]
  );
  const updatedCoordinator = updatedRows[0];

  if (!updatedCoordinator) throw new AppError('Failed to update coordinator status', 500);

  if (!newStatus) {
    await revokeCoordinatorRefreshToken(updatedCoordinator.email);
  }

  await logCoordinatorAction(req, 'coordinator.toggle_status', updatedCoordinator.id, {
    email: updatedCoordinator.email,
    department: updatedCoordinator.department || null,
    is_active: updatedCoordinator.is_active,
  });

  res.json({
    success: true,
    data: buildCoordinatorResponse(updatedCoordinator),
    message: `Coordinator ${newStatus ? 'activated' : 'deactivated'} successfully`
  });
});

// Get a coordinator by ID (admin only)
export const getCoordinatorById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const { rows: coordinators } = await pool.query(
    'SELECT id, email, first_name, last_name, phone, department, is_active, last_login, created_at, updated_at FROM coordinators WHERE id = $1 LIMIT 1',
    [id]
  );
  const coordinator = coordinators[0];

  if (!coordinator) {
    throw new AppError('Coordinator not found', 404);
  }

  res.json({
    success: true,
    data: buildCoordinatorResponse(coordinator)
  });
});

// Delete coordinator (admin only)
export const deleteCoordinator = catchAsync(async (req, res) => {
  const { id } = req.params;

  const { rows: coordinators } = await pool.query(
    'SELECT id, email, first_name, last_name, phone, department, is_active, last_login, created_at, updated_at FROM coordinators WHERE id = $1 LIMIT 1',
    [id]
  );
  const coordinator = coordinators[0];

  if (!coordinator) {
    throw new AppError('Coordinator not found', 404);
  }

  const { rowCount } = await pool.query('DELETE FROM coordinators WHERE id = $1', [id]);

  if (!rowCount) {
    throw new AppError('Failed to delete coordinator', 500);
  }

  await revokeCoordinatorRefreshToken(coordinator.email);
  await logCoordinatorAction(req, 'coordinator.delete', coordinator.id, {
    email: coordinator.email,
    department: coordinator.department || null,
    was_active: coordinator.is_active,
  });

  res.json({
    success: true,
    message: 'Coordinator deleted successfully'
  });
});

function buildCoordinatorEventResponse(event) {
  if (!event) return null;
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    event_type: event.event_type,
    event_date: event.event_date,
    event_duration: event.event_duration,
    max_participants: event.max_participants,
    current_participants: event.current_participants,
    registration_deadline: event.registration_deadline,
    status: event.status,
    location: event.location,
    meeting_url: event.meeting_url,
    coordinator_id: event.coordinator_id,
    created_at: event.created_at,
    updated_at: event.updated_at,
  };
}

export const createCoordinatorEvent = catchAsync(async (req, res) => {
  const {
    title,
    description,
    event_type,
    event_date,
    event_duration,
    max_participants,
    registration_deadline,
    status,
    location,
    meeting_url
  } = req.body || {};

  if (!title || !event_type || !event_date) {
    throw new AppError('Title, event type, and event date are required', 400);
  }

  const { rows } = await pool.query(
    `INSERT INTO events (
       title, description, event_type, event_date, event_duration,
       max_participants, registration_deadline, status, location, meeting_url, coordinator_id, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
     RETURNING *`,
    [
      title,
      description || null,
      event_type,
      event_date,
      event_duration || 60,
      max_participants || null,
      registration_deadline || null,
      status || 'upcoming',
      location || 'Online',
      meeting_url || null,
      req.user.id
    ]
  );

  const event = rows[0];
  await logCoordinatorAction(req, 'coordinator.event.create', event.id, {
    title: event.title,
    event_type: event.event_type,
    status: event.status,
  });

  let sheetSync = { success: false };
  try {
    const eventDate = new Date(event.event_date);
    const sheetDate = Number.isFinite(eventDate.valueOf())
      ? eventDate.toISOString().slice(0, 10)
      : String(event.event_date || '');
    const sheetTime = Number.isFinite(eventDate.valueOf())
      ? eventDate.toISOString().slice(11, 16)
      : '';

    const googleResult = await createGoogleSheetEvent({
      title: event.title,
      description: event.description,
      type: event.event_type,
      date: sheetDate,
      time: sheetTime,
      location: event.location,
      maxParticipants: event.max_participants,
    });

    const externalEventId = Number(
      googleResult?.eventId ?? googleResult?.id ?? googleResult?.data?.id ?? googleResult?.data?.eventId
    );

    if (Number.isFinite(externalEventId)) {
      await pool.query(
        `INSERT INTO event_sync (
           community_event_id, coordinator_event_id, sync_status, last_sync_at, created_at, updated_at
         ) VALUES ($1, $2, 'synced', NOW(), NOW(), NOW())
         ON CONFLICT (community_event_id) DO UPDATE
         SET coordinator_event_id = EXCLUDED.coordinator_event_id,
             sync_status = EXCLUDED.sync_status,
             last_sync_at = EXCLUDED.last_sync_at,
             updated_at = NOW()`,
        [externalEventId, event.id]
      );

      sheetSync = { success: true, externalEventId };
    } else {
      sheetSync = { success: false, error: 'Google Apps Script response did not include an event ID' };
    }
  } catch (googleError) {
    console.error('Google Apps Script event sync failed:', googleError);
    sheetSync = { success: false, error: String(googleError.message || googleError) };
  }

  res.status(201).json({
    success: true,
    sheet_sync: sheetSync,
    data: buildCoordinatorEventResponse(event)
  });
});

export const getCoordinatorEvents = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status, event_type } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const params = [req.user.id];
  const whereClauses = ['coordinator_id = $1'];

  if (status) {
    params.push(String(status).trim());
    whereClauses.push(`status = $${params.length}`);
  }

  if (event_type) {
    params.push(String(event_type).trim());
    whereClauses.push(`event_type = $${params.length}`);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int as count FROM events ${whereSql}`,
    params
  );

  const { rows: events } = await pool.query(
    `SELECT * FROM events
     ${whereSql}
     ORDER BY event_date ASC NULLS LAST, created_at DESC
     LIMIT $${params.length + 1}
     OFFSET $${params.length + 2}`,
    [...params, Number(limit), offset]
  );

  res.json({
    success: true,
    data: events.map(buildCoordinatorEventResponse),
    pagination: {
      page: Number.parseInt(page, 10),
      limit: Number.parseInt(limit, 10),
      total: countRows[0]?.count || 0,
      pages: Math.ceil((countRows[0]?.count || 0) / Number(limit))
    }
  });
});

export const getCoordinatorEventById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT * FROM events WHERE id = $1 AND coordinator_id = $2 LIMIT 1`,
    [id, req.user.id]
  );

  const event = rows[0];
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  res.json({
    success: true,
    data: buildCoordinatorEventResponse(event)
  });
});

async function createCoordinatorCommunityPlaceholder(event) {
  const { rows } = await pool.query(
    `INSERT INTO community_events (
       title, description, event_type, start_at, host_user_id, max_spots, is_active, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, FALSE, NOW())
     RETURNING id`,
    [
      event.title,
      event.description || null,
      event.event_type || 'webinar',
      event.event_date,
      null,
      event.max_participants || null
    ]
  );

  return rows[0]?.id || null;
}

export const syncCoordinatorEvent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const communityEventId = req.body?.community_event_id ? Number(req.body.community_event_id) : null;

  const { rows } = await pool.query(
    `SELECT * FROM events WHERE id = $1 AND coordinator_id = $2 LIMIT 1`,
    [id, req.user.id]
  );

  const event = rows[0];
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  let mappedCommunityEventId = communityEventId;
  if (mappedCommunityEventId) {
    const { rows: existingCommunityRows } = await pool.query(
      `SELECT id FROM community_events WHERE id = $1 LIMIT 1`,
      [mappedCommunityEventId]
    );
    if (!existingCommunityRows[0]) {
      throw new AppError('Community event not found', 404);
    }
  } else {
    mappedCommunityEventId = await createCoordinatorCommunityPlaceholder(event);
    if (!mappedCommunityEventId) {
      throw new AppError('Failed to create community event placeholder', 500);
    }
  }

  await pool.query(
    `INSERT INTO event_sync (
       community_event_id, coordinator_event_id, sync_status, last_sync_at, created_at, updated_at
     ) VALUES ($1, $2, 'synced', NOW(), NOW(), NOW())
     ON CONFLICT (community_event_id) DO UPDATE SET
       coordinator_event_id = EXCLUDED.coordinator_event_id,
       sync_status = EXCLUDED.sync_status,
       last_sync_at = NOW(),
       updated_at = NOW()`,
    [mappedCommunityEventId, event.id]
  );

  await logCoordinatorAction(req, 'coordinator.event.sync', event.id, {
    community_event_id: mappedCommunityEventId,
  });

  res.json({
    success: true,
    data: {
      coordinator_event_id: event.id,
      community_event_id: mappedCommunityEventId,
      sync_status: 'synced'
    }
  });
});

export const updateCoordinatorEvent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  const allowedFields = [
    'title',
    'description',
    'event_type',
    'event_date',
    'event_duration',
    'max_participants',
    'registration_deadline',
    'status',
    'location',
    'meeting_url'
  ];

  const updateFields = [];
  const updateValues = [];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updateData, field)) {
      updateValues.push(updateData[field] === '' ? null : updateData[field]);
      updateFields.push(`${field} = $${updateValues.length}`);
    }
  }

  if (updateFields.length === 0) {
    throw new AppError('No event fields provided for update', 400);
  }

  updateValues.push(id);
  updateValues.push(req.user.id);

  const { rows } = await pool.query(
    `UPDATE events
     SET ${updateFields.join(', ')}, updated_at = NOW()
     WHERE id = $${updateValues.length - 1} AND coordinator_id = $${updateValues.length}
     RETURNING *`,
    updateValues
  );

  const event = rows[0];
  if (!event) {
    throw new AppError('Event not found or access denied', 404);
  }

  await logCoordinatorAction(req, 'coordinator.event.update', event.id, {
    updatedFields: Object.keys(updateData),
    status: event.status,
  });

  res.json({
    success: true,
    data: buildCoordinatorEventResponse(event)
  });
});

export const deleteCoordinatorEvent = catchAsync(async (req, res) => {
  const { id } = req.params;

  const { rows } = await pool.query(
    `DELETE FROM events WHERE id = $1 AND coordinator_id = $2 RETURNING id`,
    [id, req.user.id]
  );

  const event = rows[0];
  if (!event) {
    throw new AppError('Event not found or access denied', 404);
  }

  await logCoordinatorAction(req, 'coordinator.event.delete', event.id, {});

  res.json({
    success: true,
    message: 'Event deleted successfully'
  });
});

export const getCoordinatorEventRegistrations = catchAsync(async (req, res) => {
  const { id } = req.params;

  const { rows: eventRows } = await pool.query(
    `SELECT id FROM events WHERE id = $1 AND coordinator_id = $2 LIMIT 1`,
    [id, req.user.id]
  );

  const event = eventRows[0];
  if (!event) {
    throw new AppError('Event not found or access denied', 404);
  }

  const { rows: registrations } = await pool.query(
    `SELECT * FROM event_registrations WHERE event_id = $1 ORDER BY created_at DESC`,
    [id]
  );

  res.json({
    success: true,
    data: registrations
  });
});

// Coordinator activity feed for admin monitoring
export const getCoordinatorActivity = catchAsync(async (req, res) => {
  const { limit = 50, email } = req.query || {};
  await ensureAuditLogSchema();

  const params = [Math.min(Math.max(Number(limit) || 50, 1), 200)];
  const filters = [
    `(action LIKE 'coordinator.%' OR (action = 'auth.login' AND COALESCE(details->>'role', '') = 'coordinator'))`
  ];

  if (email) {
    params.push(String(email).trim().toLowerCase());
    filters.push(`LOWER(actor_email) = LOWER($${params.length})`);
  }

  const query = `
    SELECT id, actor_user_id, actor_email, action, entity_type, entity_id, details, ip_address, created_at
    FROM admin_audit_logs
    WHERE ${filters.join(' AND ')}
    ORDER BY created_at DESC
    LIMIT $1
  `;

  const { rows } = await pool.query(query, params);

  res.json({
    success: true,
    data: rows
  });
});
