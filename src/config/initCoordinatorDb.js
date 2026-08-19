import { pool } from './postgres.js';

function toIsoDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

async function seedCoordinatorEvents() {
  // No seed data - events are created only through coordinator dashboard
  return;
}

async function seedCoordinatorRegistrations() {
  // No seed data - registrations are created through event registration flows
  return;
}

export async function initCoordinatorDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS coordinators (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      department VARCHAR(255),
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`ALTER TABLE coordinators ADD COLUMN IF NOT EXISTS phone VARCHAR(20);`);
  await pool.query(`ALTER TABLE coordinators ADD COLUMN IF NOT EXISTS department VARCHAR(255);`);
  await pool.query(`ALTER TABLE coordinators ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;`);
  await pool.query(`ALTER TABLE coordinators ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;`);
  await pool.query(`ALTER TABLE coordinators ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;`);
  await pool.query(`ALTER TABLE coordinators ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      event_type VARCHAR(50) NOT NULL,
      event_date TIMESTAMPTZ NOT NULL,
      event_duration INTEGER DEFAULT 60,
      max_participants INTEGER,
      current_participants INTEGER DEFAULT 0,
      registration_deadline TIMESTAMPTZ,
      status VARCHAR(20) DEFAULT 'upcoming',
      location TEXT DEFAULT 'Online',
      meeting_url TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS event_duration INTEGER DEFAULT 60;`);
  await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS max_participants INTEGER;`);
  await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS current_participants INTEGER DEFAULT 0;`);
  await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;`);
  await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'upcoming';`);
  await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Online';`);
  await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS meeting_url TEXT;`);
  await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS coordinator_id INTEGER REFERENCES coordinators(id);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_events_coordinator_id ON events(coordinator_id);`);
  await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;`);
  await pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_registrations (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      organization VARCHAR(255),
      job_title VARCHAR(255),
      source TEXT DEFAULT 'coordinator' CHECK (source IN ('coordinator', 'community', 'dual')),
      status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'cancelled', 'attended', 'no_show')),
      notes TEXT,
      reminder_sent BOOLEAN DEFAULT FALSE,
      reminder_count INTEGER DEFAULT 0,
      sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'failed')),
      community_registration_id INTEGER,
      registration_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, email)
    )
  `);

  await pool.query(`ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'coordinator';`);
  await pool.query(`ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'registered';`);
  await pool.query(`ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS notes TEXT;`);
  await pool.query(`ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;`);
  await pool.query(`ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;`);
  await pool.query(`ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced';`);
  await pool.query(`ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS community_registration_id INTEGER;`);
  await pool.query(`ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS registration_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;`);
  await pool.query(`ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;`);
  await pool.query(`ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_sync (
      id SERIAL PRIMARY KEY,
      community_event_id INTEGER UNIQUE NOT NULL,
      coordinator_event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      sync_status TEXT DEFAULT 'synced',
      last_sync_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id SERIAL PRIMARY KEY,
      template_name VARCHAR(100) NOT NULL,
      event_type VARCHAR(50),
      subject VARCHAR(255) NOT NULL,
      html_content TEXT NOT NULL,
      text_content TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_campaigns (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
      campaign_type VARCHAR(50) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      recipient_count INTEGER DEFAULT 0,
      sent_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      sent_at TIMESTAMPTZ,
      status VARCHAR(20) DEFAULT 'draft',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_delivery_logs (
      id SERIAL PRIMARY KEY,
      campaign_id INTEGER REFERENCES email_campaigns(id) ON DELETE CASCADE,
      registration_id INTEGER REFERENCES event_registrations(id) ON DELETE CASCADE,
      recipient_email VARCHAR(255) NOT NULL,
      status VARCHAR(20) NOT NULL,
      error_message TEXT,
      sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      delivered_at TIMESTAMPTZ,
      opened_at TIMESTAMPTZ,
      clicked_at TIMESTAMPTZ
    )
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_coordinators_email ON coordinators(email)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON event_registrations(event_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_registrations_email ON event_registrations(email)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_registrations_status ON event_registrations(status)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_registrations_source ON event_registrations(source)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_campaigns_event_id ON email_campaigns(event_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_delivery_logs_campaign_id ON email_delivery_logs(campaign_id)');

  // No seed data - events and registrations are created through coordinator dashboard and registration flows
}
