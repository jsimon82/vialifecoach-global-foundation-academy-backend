-- Certification System Database Migration
-- Run this script to create the certification tables

-- Courses Table (if not exists)
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructor_id INTEGER REFERENCES users(id),
  is_certifiable BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Course Completions Table
CREATE TABLE IF NOT EXISTS course_completions (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMP DEFAULT NOW(),
  completion_percentage INTEGER DEFAULT 100 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  UNIQUE(student_id, course_id)
);

-- Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  issue_date TIMESTAMP DEFAULT NOW(),
  certificate_code VARCHAR(50) UNIQUE NOT NULL,
  certificate_html TEXT NOT NULL,
  certificate_pdf_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'issued' CHECK (status IN ('issued', 'revoked', 'expired')),
  revoked_at TIMESTAMP,
  revoke_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(certificate_code);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_issue_date ON certificates(issue_date);

CREATE INDEX IF NOT EXISTS idx_course_completions_student_id ON course_completions(student_id);
CREATE INDEX IF NOT EXISTS idx_course_completions_course_id ON course_completions(course_id);

-- Insert sample courses for testing
INSERT INTO courses (title, description, is_certifiable) VALUES 
('Life Coaching Fundamentals', 'Learn the fundamental principles and techniques of life coaching, including active listening, powerful questioning, and goal setting strategies.', true),
('Advanced Coaching Techniques', 'Master advanced coaching methodologies including NLP, cognitive behavioral coaching, and transformational coaching approaches.', true),
('Mental Health Coaching', 'Specialized training in mental health coaching, understanding psychological foundations, and ethical practices in mental health support.', true),
('Business Coaching', 'Develop skills to coach entrepreneurs and business leaders, focusing on performance, leadership, and organizational development.', true),
('Relationship Coaching', 'Learn to help individuals and couples improve their relationships through effective communication and conflict resolution techniques.', true)
ON CONFLICT DO NOTHING;

-- Function to automatically generate certificate on course completion
CREATE OR REPLACE FUNCTION generate_certificate_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate certificate if course is certifiable and certificate doesn't exist
  IF EXISTS (
    SELECT 1 FROM courses WHERE id = NEW.course_id AND is_certifiable = true
  ) AND NOT EXISTS (
    SELECT 1 FROM certificates 
    WHERE student_id = NEW.student_id AND course_id = NEW.course_id
  ) THEN
    -- This would be called by the application logic
    -- The actual certificate generation happens via the API
    INSERT INTO certificates (student_id, course_id, certificate_code, certificate_html)
    VALUES (
      NEW.student_id,
      NEW.course_id,
      'VCF-' || EXTRACT(EPOCH FROM NOW())::text || '-' || substr(md5(random()::text), 1, 6),
      '<html><body><h1>Certificate Generated</h1><p>Use the API to generate the full certificate</p></body></html>'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate certificate on course completion
DROP TRIGGER IF EXISTS tr_generate_certificate ON course_completions;
CREATE TRIGGER tr_generate_certificate
  AFTER INSERT ON course_completions
  FOR EACH ROW
  EXECUTE FUNCTION generate_certificate_on_completion();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS tr_courses_updated_at ON courses;
CREATE TRIGGER tr_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_certificates_updated_at ON certificates;
CREATE TRIGGER tr_certificates_updated_at
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON courses, course_completions, certificates TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE courses_id_seq, course_completions_id_seq, certificates_id_seq TO your_app_user;
