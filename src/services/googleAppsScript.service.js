import { GOOGLE_APPS_SCRIPT_URL, GOOGLE_APPS_SCRIPT_ADMIN_KEY } from '../config/env.js';

const DEFAULT_GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbypK_ZW6EzevNoLoeaJRDx4KmS1-29ynV0aIkp_B42G2Tf-nYKiCyufyIWsbV8AmVI_/exec';
const APPS_SCRIPT_URL = GOOGLE_APPS_SCRIPT_URL || DEFAULT_GOOGLE_APPS_SCRIPT_URL;
const ADMIN_KEY = GOOGLE_APPS_SCRIPT_ADMIN_KEY || 'GFA2026SECRET';

function parseAppsScriptResponse(response, bodyText) {
  if (!response.ok) {
    const message = bodyText || response.statusText || 'Unknown error';
    throw new Error(`Google Apps Script API request failed: ${response.status} ${response.statusText} - ${message}`);
  }

  if (bodyText === '') {
    return {};
  }

  let json;
  try {
    json = JSON.parse(bodyText);
  } catch (error) {
    throw new Error(`Invalid JSON from Google Apps Script API: ${error.message}`);
  }

  if (json.success === false || json.error) {
    const message = json.message || json.error || JSON.stringify(json);
    throw new Error(`Google Apps Script API error: ${message}`);
  }

  return json;
}

async function requestAppsScript({ method = 'GET', payload, params }) {
  const url = new URL(APPS_SCRIPT_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const options = {
    method,
    headers: {},
  };

  if (payload) {
    options.method = 'POST';
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(payload);
  }

  const response = await fetch(url.toString(), options);
  const bodyText = await response.text();
  return parseAppsScriptResponse(response, bodyText);
}

function formatDateTime(dateValue) {
  if (!dateValue) {
    return { date: '', time: '' };
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.valueOf())) {
    const [datePart, timePart] = String(dateValue).split('T');
    return {
      date: datePart || String(dateValue),
      time: timePart ? timePart.slice(0, 5) : '',
    };
  }

  const date = parsed.toISOString().slice(0, 10);
  const time = parsed.toISOString().slice(11, 16);
  return { date, time };
}

export async function fetchGoogleSheetEvents() {
  return requestAppsScript({
    method: 'GET',
    params: { action: 'getEvents' }
  });
}

export async function createGoogleSheetEvent({ title, description, type, date, time, location, maxParticipants }) {
  const payload = {
    action: 'createEvent',
    adminKey: ADMIN_KEY,
    title: title || '',
    description: description || '',
    type: type || '',
    date: date || '',
    time: time || '',
    location: location || '',
    maxParticipants: maxParticipants !== undefined && maxParticipants !== null ? String(maxParticipants) : ''
  };

  return requestAppsScript({
    payload
  });
}

export async function registerGoogleSheetEvent({ eventId, fullName, email, phone, organization }) {
  const payload = {
    action: 'register',
    eventId: eventId ?? '',
    fullName: fullName || '',
    email: email || '',
    phone: phone || '',
    organization: organization || ''
  };

  return requestAppsScript({
    payload
  });
}
