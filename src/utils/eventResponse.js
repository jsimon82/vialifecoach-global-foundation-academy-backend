const FRONTEND_EVENT_TYPE_TO_DB = {
  challenge: 'challenge',
  live_qa: 'live_qa',
  webinar: 'webinar',
  custom: 'other',
  other: 'other',
};

const DB_EVENT_TYPE_TO_FRONTEND = {
  challenge: 'challenge',
  live_qa: 'live_qa',
  webinar: 'webinar',
  other: 'custom',
  custom: 'custom',
};

const FRONTEND_STATUS_TO_DB = {
  upcoming: 'upcoming',
  ongoing: 'live',
  live: 'live',
  completed: 'completed',
  cancelled: 'cancelled',
};

const DB_STATUS_TO_FRONTEND = {
  upcoming: 'upcoming',
  live: 'ongoing',
  completed: 'completed',
  cancelled: 'cancelled',
};

function toNullableString(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function toIsoString(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function toNumber(value, fallback = null) {
  if (value == null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function mapEventTypeToDb(value) {
  const key = toNullableString(value)?.toLowerCase();
  if (!key) return 'other';
  return FRONTEND_EVENT_TYPE_TO_DB[key] || key;
}

export function mapEventTypeToFrontend(value) {
  const key = toNullableString(value)?.toLowerCase();
  if (!key) return 'custom';
  return DB_EVENT_TYPE_TO_FRONTEND[key] || key;
}

export function mapEventStatusToDb(value) {
  const key = toNullableString(value)?.toLowerCase();
  if (!key) return 'upcoming';
  return FRONTEND_STATUS_TO_DB[key] || key;
}

export function mapEventStatusToFrontend(value) {
  const key = toNullableString(value)?.toLowerCase();
  if (!key) return 'upcoming';
  return DB_STATUS_TO_FRONTEND[key] || key;
}

export function parseEventDurationMinutes(value) {
  if (value == null || value === '') return null;

  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }

  const text = String(value).trim();
  if (!text) return null;

  const numeric = Number(text);
  if (Number.isFinite(numeric)) {
    return Math.round(numeric);
  }

  const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\b/i);
  if (hoursMatch) {
    return Math.round(Number(hoursMatch[1]) * 60);
  }

  const minutesMatch = text.match(/(\d+(?:\.\d+)?)\s*(minutes?|mins?|m)\b/i);
  if (minutesMatch) {
    return Math.round(Number(minutesMatch[1]));
  }

  return null;
}

export function formatEventDuration(value) {
  const minutes = parseEventDurationMinutes(value);

  if (minutes == null) {
    return value == null ? '' : String(value);
  }

  if (minutes % 60 === 0 && minutes !== 0) {
    const hours = minutes / 60;
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }

  return `${minutes} minutes`;
}

export function buildEventDate(dateValue, timeValue) {
  const dateText = toNullableString(dateValue);
  if (!dateText) return null;

  const timeText = toNullableString(timeValue);
  if (timeText && !dateText.includes('T')) {
    const combined = /am|pm/i.test(timeText) ? `${dateText} ${timeText}` : `${dateText}T${timeText}`;
    const combinedDate = new Date(combined);
    if (!Number.isNaN(combinedDate.getTime())) {
      return combinedDate;
    }
  }

  const parsed = new Date(dateText);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeEventRecord(event) {
  if (!event) return event;

  const eventDate = event.event_date ?? event.date ?? event.start_at ?? null;
  const parsedDate = eventDate ? new Date(eventDate) : null;
  const isoDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : toIsoString(eventDate);
  const frontendType = mapEventTypeToFrontend(event.type ?? event.event_type);
  const dbType = mapEventTypeToDb(event.type ?? event.event_type);
  const normalizedDurationMinutes =
    parseEventDurationMinutes(event.event_duration ?? event.duration ?? event.event_duration_minutes);
  const normalizedDuration =
    event.duration != null ? String(event.duration) : formatEventDuration(event.event_duration ?? normalizedDurationMinutes);

  return {
    ...event,
    type: frontendType,
    event_type: event.event_type ?? dbType,
    date: isoDate ?? eventDate ?? null,
    event_date: isoDate ?? eventDate ?? null,
    time:
      event.time != null
        ? String(event.time)
        : parsedDate && !Number.isNaN(parsedDate.getTime())
          ? parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '',
    duration: normalizedDuration,
    event_duration: toNumber(event.event_duration ?? normalizedDurationMinutes, 0),
    max_participants: toNumber(event.max_participants ?? event.max_spots, 0),
    current_participants: toNumber(event.current_participants ?? event.registered_count, 0),
    registration_deadline: toIsoString(event.registration_deadline),
    status: mapEventStatusToFrontend(event.status),
    created_at: toIsoString(event.created_at) ?? isoDate ?? null,
    updated_at: toIsoString(event.updated_at) ?? toIsoString(event.created_at) ?? isoDate ?? null,
    location: event.location ?? 'Online',
  };
}

export function normalizeRegistrationRecord(registration) {
  if (!registration) return registration;

  const relatedEvent = registration.event || registration.events || null;
  const normalizedEvent = relatedEvent ? normalizeEventRecord(relatedEvent) : null;

  return {
    ...registration,
    event: normalizedEvent,
    events: normalizedEvent ?? registration.events ?? null,
    registration_date:
      toIsoString(registration.registration_date) ??
      toIsoString(registration.created_at) ??
      registration.registration_date ??
      null,
    created_at: toIsoString(registration.created_at) ?? registration.created_at ?? null,
    updated_at: toIsoString(registration.updated_at) ?? registration.updated_at ?? null,
    status: registration.status ?? 'registered',
  };
}

export function normalizeEmailCampaignRecord(campaign) {
  if (!campaign) return campaign;

  return {
    ...campaign,
    type: campaign.type ?? campaign.campaign_type ?? 'custom',
    message: campaign.message ?? campaign.content ?? '',
    sent_count: toNumber(campaign.sent_count, 0),
    delivery_count: toNumber(
      campaign.delivery_count ?? campaign.recipient_count ?? campaign.sent_count,
      0
    ),
    sent_at: toIsoString(campaign.sent_at),
    created_at: toIsoString(campaign.created_at) ?? campaign.created_at ?? null,
    updated_at: toIsoString(campaign.updated_at) ?? campaign.updated_at ?? null,
  };
}

export function buildEventMutationPayload(input = {}, { isCreate = false } = {}) {
  const payload = {};

  if (input.title !== undefined) {
    payload.title = input.title;
  }

  if (input.description !== undefined) {
    payload.description = input.description || null;
  }

  const eventTypeInput = input.type ?? input.event_type;
  if (eventTypeInput !== undefined || isCreate) {
    payload.event_type = mapEventTypeToDb(eventTypeInput ?? 'custom');
  }

  const eventDate = buildEventDate(input.date ?? input.event_date ?? input.start_at, input.time ?? input.start_time);
  if (eventDate) {
    payload.event_date = eventDate.toISOString();
  } else if (input.event_date !== undefined) {
    const fallbackDate = toIsoString(input.event_date);
    if (fallbackDate) {
      payload.event_date = fallbackDate;
    }
  } else if (input.date !== undefined && isCreate) {
    const fallbackDate = toIsoString(input.date);
    if (fallbackDate) {
      payload.event_date = fallbackDate;
    }
  }

  const durationInput = input.duration ?? input.event_duration;
  const durationMinutes = parseEventDurationMinutes(durationInput);
  if (durationMinutes != null) {
    payload.event_duration = durationMinutes;
  } else if (input.event_duration !== undefined) {
    payload.event_duration = toNumber(input.event_duration, 60);
  } else if (isCreate) {
    payload.event_duration = 60;
  }

  const maxParticipantsInput = input.max_participants ?? input.max_spots;
  if (maxParticipantsInput !== undefined || isCreate) {
    const maxParticipants = toNumber(maxParticipantsInput, null);
    payload.max_participants = maxParticipants;
  }

  if (input.registration_deadline !== undefined || isCreate) {
    const registrationDeadline = toIsoString(input.registration_deadline);
    payload.registration_deadline = registrationDeadline;
  }

  const statusInput = input.status;
  if (statusInput !== undefined || isCreate) {
    payload.status = mapEventStatusToDb(statusInput ?? 'upcoming');
  }

  if (input.location !== undefined) {
    payload.location = input.location || null;
  }

  const currentParticipantsInput = input.current_participants ?? input.registered_count;
  if (currentParticipantsInput !== undefined || isCreate) {
    payload.current_participants = toNumber(currentParticipantsInput, 0);
  }

  return payload;
}
