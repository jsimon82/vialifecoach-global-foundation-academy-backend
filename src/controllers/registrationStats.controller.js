import { pool } from '../config/postgres.js';
import { AppError } from '../utils/AppError.js';
import { mapEventTypeToDb, normalizeEventRecord, normalizeRegistrationRecord } from '../utils/eventResponse.js';

function buildEventFromRow(row, prefix = 'event_ref_') {
  if (!row || row[`${prefix}id`] == null) {
    return null;
  }

  return normalizeEventRecord({
    id: row[`${prefix}id`],
    title: row[`${prefix}title`],
    description: row[`${prefix}description`],
    event_type: row[`${prefix}event_type`],
    event_date: row[`${prefix}event_date`],
    event_duration: row[`${prefix}event_duration`],
    max_participants: row[`${prefix}max_participants`],
    current_participants: row[`${prefix}current_participants`],
    registration_deadline: row[`${prefix}registration_deadline`],
    status: row[`${prefix}status`],
    location: row[`${prefix}location`],
    meeting_url: row[`${prefix}meeting_url`],
    created_at: row[`${prefix}created_at`],
    updated_at: row[`${prefix}updated_at`],
  });
}

function buildRegistrationFromRow(row) {
  const event = buildEventFromRow(row);
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

function buildRegistrationWhereClause(filters = {}) {
  const clauses = [];
  const params = [];

  if (filters.event_id) {
    params.push(filters.event_id);
    clauses.push(`r.event_id = $${params.length}`);
  }

  if (filters.source) {
    params.push(String(filters.source).trim().toLowerCase());
    clauses.push(`LOWER(COALESCE(r.source, 'coordinator')) = LOWER($${params.length})`);
  }

  if (filters.status) {
    params.push(String(filters.status).trim().toLowerCase());
    clauses.push(`LOWER(COALESCE(r.status, 'registered')) = LOWER($${params.length})`);
  }

  if (filters.event_type) {
    params.push(mapEventTypeToDb(filters.event_type));
    clauses.push(`e.event_type = $${params.length}`);
  }

  if (filters.search) {
    params.push(`%${String(filters.search).trim()}%`);
    clauses.push(
      `(r.first_name ILIKE $${params.length} OR r.last_name ILIKE $${params.length} OR r.email ILIKE $${params.length})`
    );
  }

  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

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

export async function getRegistrationStats(req, res, next) {
  try {
    console.log('🔍 Registration Stats Debug:');
    console.log('   req.user:', req.user);
    console.log('   req.user.role:', req.user?.role);

    if (!req.user || (req.user.role !== 'coordinator' && req.user.role !== 'admin')) {
      console.log('❌ Role check failed:', req.user?.role);
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
      });
    }

    console.log('✅ Role check passed:', req.user.role);

    const { rows: allRegistrations } = await pool.query(`
      SELECT
        COALESCE(source, 'coordinator') AS source,
        COALESCE(status, 'registered') AS status
      FROM event_registrations
    `);

    const countBy = (predicate) => (Array.isArray(allRegistrations) ? allRegistrations.filter((row) => row && predicate(row)).length : 0);
    const getSource = (row) => String(row?.source || 'coordinator').toLowerCase();

    const sourceStats = {
      total_registrations: allRegistrations.length,
      coordinator_registrations: countBy((row) => getSource(row) === 'coordinator'),
      community_registrations: countBy((row) => getSource(row) === 'community'),
      dual_registrations: countBy((row) => getSource(row) === 'dual'),
    };

    const statusStats = {
      confirmed_registrations: countBy((row) => String(row.status).toLowerCase() === 'confirmed'),
      pending_registrations: countBy((row) => String(row.status).toLowerCase() === 'registered'),
      attended_registrations: countBy((row) => String(row.status).toLowerCase() === 'attended'),
      no_show_registrations: countBy((row) => String(row.status).toLowerCase() === 'no_show'),
    };

    const recentRegistrationSql = `
      ${registrationSelectSql}
      FROM event_registrations r
      LEFT JOIN events e ON e.id = r.event_id
      WHERE COALESCE(r.status, 'registered') = 'registered'
      ORDER BY COALESCE(r.created_at, r.registration_date, NOW()) DESC
      LIMIT 5
    `;
    const { rows: recentRows } = await pool.query(recentRegistrationSql);
    const normalizedRecentRegistrations = recentRows.map(buildRegistrationFromRow);

    const eventParams = [];
    const eventClauses = [];
    if (req.query?.event_id) {
      eventParams.push(req.query.event_id);
      eventClauses.push(`e.id = $${eventParams.length}`);
    }
    if (req.query?.date_range) {
      const days = Number.parseInt(req.query.date_range, 10);
      if (Number.isFinite(days) && days > 0) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        eventParams.push(startDate.toISOString());
        eventClauses.push(`e.event_date >= $${eventParams.length}`);
      }
    }

    const eventStatsSql = `
      SELECT
        e.id,
        e.title,
        e.event_type,
        e.status,
        e.max_participants,
        COALESCE(e.current_participants, COUNT(r.id)::int) AS current_participants,
        COUNT(r.id)::int AS registration_count,
        e.event_date
      FROM events e
      LEFT JOIN event_registrations r ON r.event_id = e.id
      ${eventClauses.length ? `WHERE ${eventClauses.join(' AND ')}` : ''}
      GROUP BY e.id
      ORDER BY e.event_date ASC
    `;
    const { rows: eventRows } = await pool.query(eventStatsSql, eventParams);

    const upcomingEventRows = eventRows.filter((event) => event && event.status === 'upcoming');
    const completedEvents = eventRows.filter((event) => event && event.status === 'completed').length;

    const upcomingEvents = upcomingEventRows.length;
    const totalCapacity = upcomingEventRows.reduce((sum, event) => sum + (event.max_participants || 0), 0);
    const totalParticipants = upcomingEventRows.reduce(
      (sum, event) => sum + (event.current_participants || event.registration_count || 0),
      0
    );

    const eventsSummary = upcomingEventRows.map((event) => ({
      id: event.id,
      title: event.title,
      event_type: event.event_type,
      registrations: event.registration_count || 0,
      max_participants: event.max_participants || 0,
      current_participants: event.current_participants || 0,
      fill_percentage: event.max_participants
        ? Math.round(((event.current_participants || 0) / event.max_participants) * 100)
        : 0,
    }));

    const responseData = {
      ...sourceStats,
      ...statusStats,
      upcoming_events: upcomingEvents,
      completed_events: completedEvents,
      registration_stats: sourceStats,
      event_stats: {
        upcoming_events: upcomingEvents,
        total_capacity: totalCapacity,
        total_participants: totalParticipants,
        fill_rate: totalCapacity > 0 ? Math.round((totalParticipants / totalCapacity) * 100) : 0,
      },
      recent_registrations: normalizedRecentRegistrations,
      events_summary: eventsSummary,
    };

    res.json({
      success: true,
      ...responseData,
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
}

export async function getRegistrationList(req, res, next) {
  try {
    if (!req.user || (req.user.role !== 'coordinator' && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
      });
    }

    const {
      page = 1,
      limit = 10,
      event_id,
      source,
      status = 'registered',
      event_type,
      search,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const { whereSql, params } = buildRegistrationWhereClause({
      event_id,
      source,
      status,
      event_type,
      search,
    });

    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM event_registrations r
      LEFT JOIN events e ON e.id = r.event_id
      ${whereSql}
    `;
    const { rows: countRows } = await pool.query(countSql, params);

    const dataSql = `
      ${registrationSelectSql}
      FROM event_registrations r
      LEFT JOIN events e ON e.id = r.event_id
      ${whereSql}
      ORDER BY COALESCE(r.created_at, r.registration_date, NOW()) DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;
    const { rows: registrations } = await pool.query(dataSql, [...params, Number(limit), offset]);

    const normalizedRegistrations = registrations.map(buildRegistrationFromRow);
    const total = countRows[0]?.count || 0;
    const pagination = {
      page: Number.parseInt(page, 10),
      limit: Number.parseInt(limit, 10),
      total,
      pages: Math.ceil(total / Number(limit)),
    };

    res.json({
      success: true,
      registrations: normalizedRegistrations,
      total,
      pagination,
      data: {
        registrations: normalizedRegistrations,
        pagination,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function exportRegistrations(req, res, next) {
  try {
    if (!req.user || (req.user.role !== 'coordinator' && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
      });
    }

    const { event_id, source, status = 'registered' } = req.query;
    const { whereSql, params } = buildRegistrationWhereClause({ event_id, source, status });

    const exportSql = `
      ${registrationSelectSql}
      FROM event_registrations r
      LEFT JOIN events e ON e.id = r.event_id
      ${whereSql}
      ORDER BY COALESCE(r.created_at, r.registration_date, NOW()) DESC
    `;
    const { rows: registrations } = await pool.query(exportSql, params);

    const csvHeaders = [
      'Registration ID',
      'Event Title',
      'Event Type',
      'Event Date',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Organization',
      'Job Title',
      'Source',
      'Status',
      'Registration Date',
    ];

    const csvRows = registrations.map((row) => {
      const event = buildEventFromRow(row);
      return [
        row.id,
        event?.title || '',
        event?.event_type || '',
        event?.event_date || '',
        row.first_name || '',
        row.last_name || '',
        row.email || '',
        row.phone || '',
        row.organization || '',
        row.job_title || '',
        row.source || '',
        row.status || '',
        row.created_at || row.registration_date || '',
      ];
    });

    const csvContent = [csvHeaders, ...csvRows].map((row) => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="registrations-${new Date().toISOString().split('T')[0]}.csv"`
    );

    res.send(csvContent);
  } catch (error) {
    next(error);
  }
}
