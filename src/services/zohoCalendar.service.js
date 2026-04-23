import '../config/env.js';

function requireZohoEnv() {
  const {
    ZOHO_CLIENT_ID,
    ZOHO_CLIENT_SECRET,
    ZOHO_REFRESH_TOKEN,
    ZOHO_REDIRECT_URI,
  } = process.env;

  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN || !ZOHO_REDIRECT_URI) {
    throw new Error("Zoho OAuth is not configured. Missing required env vars.");
  }
}

function toZohoDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date/time value.");
  }
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  const MM = pad(date.getUTCMonth() + 1);
  const dd = pad(date.getUTCDate());
  const HH = pad(date.getUTCHours());
  const mm = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return `${yyyy}${MM}${dd}T${HH}${mm}${ss}Z`;
}

export async function getZohoAccessToken() {
  requireZohoEnv();
  const accountsUrl = process.env.ZOHO_ACCOUNTS_URL || "https://accounts.zoho.com";

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
  });

  const response = await fetch(`${accountsUrl}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(data.error || "Failed to refresh Zoho access token.");
  }

  return data.access_token;
}

export async function getDefaultCalendarUid(accessToken) {
  const url = "https://calendar.zoho.com/api/v1/calendars?category=own&showhiddencal=true";
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch Zoho calendars.");
  }

  const calendars = Array.isArray(data?.calendars) ? data.calendars : [];
  const preferred = calendars.find((c) => c.isdefault) || calendars[0];
  if (!preferred?.uid) {
    throw new Error("No Zoho calendar UID found.");
  }
  return preferred.uid;
}

export async function createZohoEvent({
  title,
  description,
  startDateTime,
  durationMinutes = 60,
  timezone,
  location,
  meetingUrl,
  attendees,
}) {
  const accessToken = await getZohoAccessToken();
  const calendarUid = process.env.ZOHO_CALENDAR_UID || (await getDefaultCalendarUid(accessToken));

  const start = new Date(startDateTime);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const eventData = {
    title,
    description,
    location,
    url: meetingUrl,
    dateandtime: {
      start: toZohoDateTime(start),
      end: toZohoDateTime(end),
      timezone: timezone || "UTC",
    },
    attendees,
    notify_attendee: 1,
  };

  const params = new URLSearchParams({
    eventdata: JSON.stringify(eventData),
  });

  const response = await fetch(
    `https://calendar.zoho.com/api/v1/calendars/${encodeURIComponent(calendarUid)}/events?${params.toString()}`,
    {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to create Zoho event.");
  }

  const event = Array.isArray(data?.events) ? data.events[0] : null;
  return {
    event_uid: event?.uid,
    view_url: event?.viewEventURL,
    meeting_link: event?.conference_data?.meetingdata?.meeting_link,
  };
}
