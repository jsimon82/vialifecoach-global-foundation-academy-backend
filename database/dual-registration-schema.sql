-- Dual Registration System Schema Updates
-- This script adds support for tracking registration sources and syncing events

-- 1. Add registration source tracking to event_registrations table
ALTER TABLE event_registrations 
ADD COLUMN source VARCHAR(20) DEFAULT 'coordinator' CHECK (source IN ('coordinator', 'community', 'dual')),
ADD COLUMN community_registration_id INTEGER NULL,
ADD COLUMN sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed'));

-- 2. Create event sync tracking table
CREATE TABLE IF NOT EXISTS event_sync (
  id SERIAL PRIMARY KEY,
  community_event_id INTEGER NOT NULL,
  coordinator_event_id INTEGER NOT NULL,
  sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed')),
  last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(community_event_id),
  UNIQUE(coordinator_event_id)
);

-- 3. Add current_participants to events table for tracking
ALTER TABLE events 
ADD COLUMN current_participants INTEGER DEFAULT 0;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_registrations_source ON event_registrations(source);
CREATE INDEX IF NOT EXISTS idx_registrations_sync_status ON event_registrations(sync_status);
CREATE INDEX IF NOT EXISTS idx_event_sync_status ON event_sync(sync_status);
CREATE INDEX IF NOT EXISTS idx_events_current_participants ON events(current_participants);

-- 5. Create function to update participant count
CREATE OR REPLACE FUNCTION update_event_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE events 
        SET current_participants = current_participants + 1 
        WHERE id = NEW.event_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE events 
        SET current_participants = current_participants - 1 
        WHERE id = OLD.event_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle status changes
        IF OLD.status != NEW.status THEN
            IF NEW.status = 'registered' AND OLD.status != 'registered' THEN
                UPDATE events 
                SET current_participants = current_participants + 1 
                WHERE id = NEW.event_id;
            ELSIF NEW.status != 'registered' AND OLD.status = 'registered' THEN
                UPDATE events 
                SET current_participants = current_participants - 1 
                WHERE id = NEW.event_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to automatically update participant count
DROP TRIGGER IF EXISTS trigger_update_participant_count ON event_registrations;
CREATE TRIGGER trigger_update_participant_count
    AFTER INSERT OR DELETE OR UPDATE ON event_registrations
    FOR EACH ROW EXECUTE FUNCTION update_event_participant_count();

-- 7. Create view for registration analytics
CREATE OR REPLACE VIEW registration_analytics AS
SELECT 
    e.id as event_id,
    e.title as event_title,
    e.event_type,
    e.event_date,
    e.max_participants,
    e.current_participants,
    COUNT(CASE WHEN r.source = 'coordinator' THEN 1 END) as coordinator_registrations,
    COUNT(CASE WHEN r.source = 'community' THEN 1 END) as community_registrations,
    COUNT(CASE WHEN r.source = 'dual' THEN 1 END) as dual_registrations,
    COUNT(*) as total_registrations,
    ROUND((COUNT(*) * 100.0 / NULLIF(e.max_participants, 0)), 2) as fill_percentage
FROM events e
LEFT JOIN event_registrations r ON e.id = r.event_id
WHERE r.status = 'registered'
GROUP BY e.id, e.title, e.event_type, e.event_date, e.max_participants, e.current_participants
ORDER BY e.event_date DESC;
