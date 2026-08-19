-- Coordinator Database Setup Script
-- Run this script to set up the Coordinator Dashboard database

-- First, run the event registrations schema
\i event-registrations-schema.sql

-- Create sample coordinator user for testing
-- IMPORTANT: Set COORDINATOR_EMAIL and COORDINATOR_PASSWORD in environment variables
-- This script will use environment variables to create the coordinator user
DO $$
DECLARE
    coordinator_email TEXT := COALESCE(
        NULLIF(current_setting('app.coordinator_email', true), ''), 
        'support@vialifecoach.org'
    );
    coordinator_password TEXT := COALESCE(
        NULLIF(current_setting('app.coordinator_password', true), ''), 
        'CHANGE_ME_IN_ENV'
    );
    password_hash TEXT;
BEGIN
    -- Hash the password
    password_hash := crypt(coordinator_password, gen_salt('bf', 12));
    
    -- Insert coordinator user
    INSERT INTO coordinators (
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        department,
        is_active
    ) VALUES (
        coordinator_email,
        password_hash,
        'Event',
        'Coordinator',
        '+1234567890',
        'Events Management',
        true
    ) ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Coordinator user created/updated: %', coordinator_email;
END $$;

-- Create sample events for testing
INSERT INTO events (
    title,
    description,
    event_type,
    event_date,
    event_duration,
    max_participants,
    registration_deadline,
    status
) VALUES 
(
    'Challenge Registration: 30-Day Fitness Challenge',
    'Join our 30-day fitness challenge and transform your health journey. Includes daily workouts, nutrition guidance, and community support.',
    'challenge',
    NOW() + INTERVAL '7 days',
    30,
    100,
    NOW() + INTERVAL '5 days',
    'upcoming'
),
(
    'Live Q&A: Breaking Through Mental Blocks',
    'Interactive session with mental health experts to help you identify and overcome mental barriers holding you back.',
    'live_qa',
    NOW() + INTERVAL '3 days',
    60,
    50,
    NOW() + INTERVAL '2 days',
    'upcoming'
),
(
    'Webinar: Productivity Mastery for Remote Work',
    'Learn proven strategies to maximize productivity while working from home. Time management, focus techniques, and work-life balance.',
    'webinar',
    NOW() + INTERVAL '14 days',
    90,
    200,
    NOW() + INTERVAL '12 days',
    'upcoming'
),
(
    'Workshop: Stress Management Techniques',
    'Practical workshop teaching evidence-based stress management techniques for busy professionals.',
    'other',
    NOW() + INTERVAL '10 days',
    45,
    30,
    NOW() + INTERVAL '8 days',
    'upcoming'
) ON CONFLICT DO NOTHING;

-- Create sample registrations for testing
INSERT INTO event_registrations (
    event_id,
    first_name,
    last_name,
    email,
    phone,
    organization,
    job_title,
    status
) 
SELECT 
    e.id,
    'John',
    'Doe',
    'john.doe@example.com',
    '+1234567890',
    'Tech Corp',
    'Software Engineer',
    'registered'
FROM events e 
WHERE e.title = 'Challenge Registration: 30-Day Fitness Challenge'
LIMIT 1
ON CONFLICT (event_id, email) DO NOTHING;

INSERT INTO event_registrations (
    event_id,
    first_name,
    last_name,
    email,
    phone,
    organization,
    job_title,
    status
) 
SELECT 
    e.id,
    'Jane',
    'Smith',
    'jane.smith@example.com',
    '+0987654321',
    'Health Inc',
    'Marketing Manager',
    'registered'
FROM events e 
WHERE e.title = 'Live Q&A: Breaking Through Mental Blocks'
LIMIT 1
ON CONFLICT (event_id, email) DO NOTHING;

INSERT INTO event_registrations (
    event_id,
    first_name,
    last_name,
    email,
    phone,
    organization,
    job_title,
    status
) 
SELECT 
    e.id,
    'Mike',
    'Johnson',
    'mike.johnson@example.com',
    '+1122334455',
    'StartupXYZ',
    'CEO',
    'confirmed'
FROM events e 
WHERE e.title = 'Webinar: Productivity Mastery for Remote Work'
LIMIT 1
ON CONFLICT (event_id, email) DO NOTHING;

-- Verify setup
SELECT 'Coordinator Setup Complete' as status;
SELECT COUNT(*) as coordinator_count FROM coordinators WHERE email = 'support@vialifecoach.org';
SELECT COUNT(*) as event_count FROM events;
SELECT COUNT(*) as registration_count FROM event_registrations;
