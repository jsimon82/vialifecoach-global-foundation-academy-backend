-- Event Registration Management Schema
-- For Coordinator Dashboard

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL, -- 'challenge', 'live_qa', 'webinar', 'other'
    event_date TIMESTAMP NOT NULL,
    event_duration INTEGER DEFAULT 60, -- in minutes
    max_participants INTEGER,
    registration_deadline TIMESTAMP,
    status VARCHAR(20) DEFAULT 'upcoming', -- 'upcoming', 'live', 'completed', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    organization VARCHAR(255),
    job_title VARCHAR(255),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'registered', -- 'registered', 'confirmed', 'cancelled', 'attended', 'no_show'
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, email) -- Prevent duplicate registrations for same event
);

-- Email templates for event communications
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    event_type VARCHAR(50),
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email campaign logs
CREATE TABLE IF NOT EXISTS email_campaigns (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    campaign_type VARCHAR(50) NOT NULL, -- 'reminder', 'confirmation', 'follow_up', 'cancellation'
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    recipient_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email delivery logs
CREATE TABLE IF NOT EXISTS email_delivery_logs (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES email_campaigns(id) ON DELETE CASCADE,
    registration_id INTEGER REFERENCES event_registrations(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP
);

-- Coordinators table (separate from admin users)
CREATE TABLE IF NOT EXISTS coordinators (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample email templates
INSERT INTO email_templates (template_name, event_type, subject, html_content, text_content) VALUES
(
    'Event Registration Confirmation',
    'all',
    'Registration Confirmed: {{event_title}}',
    '<h2>Registration Confirmed!</h2>
     <p>Dear {{first_name}} {{last_name}},</p>
     <p>Thank you for registering for <strong>{{event_title}}</strong>.</p>
     <p><strong>Event Details:</strong></p>
     <ul>
         <li>Date: {{event_date}}</li>
         <li>Duration: {{event_duration}} minutes</li>
         <li>Type: {{event_type}}</li>
     </ul>
     <p>We look forward to seeing you there!</p>
     <p>Best regards,<br>ViaLife Coach Team</p>',
    'Registration Confirmed!

Dear {{first_name}} {{last_name}},

Thank you for registering for {{event_title}}.

Event Details:
Date: {{event_date}}
Duration: {{event_duration}} minutes
Type: {{event_type}}

We look forward to seeing you there!

Best regards,
ViaLife Coach Team'
),
(
    'Event Reminder',
    'all',
    'Reminder: {{event_title}} starts soon!',
    '<h2>Event Reminder</h2>
     <p>Dear {{first_name}} {{last_name}},</p>
     <p>This is a friendly reminder that <strong>{{event_title}}</strong> is starting soon.</p>
     <p><strong>Event Details:</strong></p>
     <ul>
         <li>Date: {{event_date}}</li>
         <li>Duration: {{event_duration}} minutes</li>
         <li>Type: {{event_type}}</li>
     </ul>
     <p>Don''t miss out!</p>
     <p>Best regards,<br>ViaLife Coach Team</p>',
    'Event Reminder

Dear {{first_name}} {{last_name}},

This is a friendly reminder that {{event_title}} is starting soon.

Event Details:
Date: {{event_date}}
Duration: {{event_duration}} minutes
Type: {{event_type}}

Don''t miss out!

Best regards,
ViaLife Coach Team'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON event_registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON event_registrations(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_event_id ON email_campaigns(event_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_campaign_id ON email_delivery_logs(campaign_id);
