-- Community Events Tables
-- Create these tables to fix the 500 error on /api/v1/community/events

-- Community Events table
CREATE TABLE IF NOT EXISTS community_events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT DEFAULT 'community',
    start_at TIMESTAMP NOT NULL,
    host_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    max_spots INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Community Event Registrations table
CREATE TABLE IF NOT EXISTS community_event_registrations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES community_events(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_events_active ON community_events(is_active);
CREATE INDEX IF NOT EXISTS idx_community_events_start_at ON community_events(start_at);
CREATE INDEX IF NOT EXISTS idx_community_event_registrations_event ON community_event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_community_event_registrations_user ON community_event_registrations(user_id);

-- Event sync table for coordinator events integration
CREATE TABLE IF NOT EXISTS event_sync (
    id SERIAL PRIMARY KEY,
    coordinator_event_id INTEGER NOT NULL,
    community_event_id INTEGER REFERENCES community_events(id) ON DELETE SET NULL,
    sync_status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'failed'
    sync_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(coordinator_event_id)
);

-- Create indexes for event_sync
CREATE INDEX IF NOT EXISTS idx_event_sync_coordinator_id ON event_sync(coordinator_event_id);
CREATE INDEX IF NOT EXISTS idx_event_sync_status ON event_sync(sync_status);

-- Sample data can be added later after ensuring users exist
-- INSERT INTO community_events (title, description, event_type, start_at, host_user_id, max_spots, is_active) VALUES
-- ('Community Welcome Session', 'Join us for a welcome session to meet other community members', 'community', NOW() + INTERVAL '1 day', 1, 50, TRUE),
-- ('Study Group Meetup', 'Weekly study group for course participants', 'study_group', NOW() + INTERVAL '3 days', 1, 25, TRUE),
-- ('Career Workshop', 'Professional development workshop on resume building', 'workshop', NOW() + INTERVAL '1 week', 1, 30, TRUE)
-- ON CONFLICT DO NOTHING;
