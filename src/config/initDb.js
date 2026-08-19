import { pool } from "./postgres.js";
import { initCoordinatorDatabase } from "./initCoordinatorDb.js";

export async function initDatabaseSchema() {
  // ======= CORE TABLES =======

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      verified BOOLEAN NOT NULL DEFAULT FALSE,
      verification_token TEXT,
      verification_expires TIMESTAMPTZ,
      photo_url TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      last_active_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Add missing columns to users if they don't exist (safe migration)
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT,
      description TEXT NOT NULL,
      slug TEXT,
      short_description TEXT,
      long_description TEXT,
      thumbnail_url TEXT,
      intro_video_url TEXT,
      delivery_mode TEXT,
      level TEXT NOT NULL DEFAULT 'beginner',
      price NUMERIC(10,2) DEFAULT 0,
      discount NUMERIC(5,2) DEFAULT 0,
      has_certificate BOOLEAN DEFAULT FALSE,
      duration_weeks INTEGER DEFAULT 0,
      rating NUMERIC(3,2) DEFAULT 0,
      enrollment_count INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      passing_grade INTEGER DEFAULT 70,
      enrollment_limit INTEGER DEFAULT NULL,
      enable_drip BOOLEAN DEFAULT FALSE,
      enable_discussion BOOLEAN DEFAULT FALSE,
      schedule_release_date TIMESTAMPTZ DEFAULT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      instructor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Safe migrations for existing courses table
  await pool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS subtitle TEXT;`);
  await pool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS intro_video_url TEXT;`);
  await pool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT 'beginner';`);
  await pool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS discount NUMERIC(5,2) DEFAULT 0;`);
  await pool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';`);
  await pool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS passing_grade INTEGER DEFAULT 70;`);
  await pool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS enrollment_limit INTEGER DEFAULT NULL;`);
  await pool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS enable_drip BOOLEAN DEFAULT FALSE;`);
  await pool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS enable_discussion BOOLEAN DEFAULT FALSE;`);
  await pool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS schedule_release_date TIMESTAMPTZ DEFAULT NULL;`);
  await pool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await pool.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS modules (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lessons (
      id SERIAL PRIMARY KEY,
      module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content_type TEXT NOT NULL DEFAULT 'video',
      order_index INTEGER NOT NULL DEFAULT 0,
      duration_minutes INTEGER DEFAULT 0,
      is_free_preview BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Safe migrations for lessons
  await pool.query(`ALTER TABLE lessons ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0;`);
  await pool.query(`ALTER TABLE lessons ADD COLUMN IF NOT EXISTS is_free_preview BOOLEAN DEFAULT FALSE;`);
  await pool.query(`ALTER TABLE lessons ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS enrollment (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ DEFAULT NULL,
      UNIQUE (user_id, course_id)
    );
  `);

  await pool.query(`ALTER TABLE enrollment ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quiz_rule_acceptance (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, course_id)
    );
  `);

  // ======= NEW LMS TABLES =======

  // Lesson content blocks (video, pdf, text, quiz, assignment, link, etc.)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lesson_content (
      id SERIAL PRIMARY KEY,
      lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      content_type TEXT NOT NULL DEFAULT 'text',
      title TEXT,
      body TEXT,
      file_url TEXT,
      external_url TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Quizzes (linked to a lesson)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id SERIAL PRIMARY KEY,
      lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      passing_score INTEGER DEFAULT 70,
      time_limit_minutes INTEGER DEFAULT NULL,
      auto_grade BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Quiz questions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL DEFAULT 'multiple_choice',
      marks INTEGER NOT NULL DEFAULT 1,
      order_index INTEGER NOT NULL DEFAULT 0,
      correct_answer TEXT
    );
  `);

  // Quiz answer options (for multiple choice / true-false)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quiz_answers (
      id SERIAL PRIMARY KEY,
      question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
      answer_text TEXT NOT NULL,
      is_correct BOOLEAN NOT NULL DEFAULT FALSE,
      order_index INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Quiz results (student submissions)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quiz_results (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      score INTEGER NOT NULL DEFAULT 0,
      total_marks INTEGER NOT NULL DEFAULT 0,
      passed BOOLEAN NOT NULL DEFAULT FALSE,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      answers JSONB DEFAULT '[]'
    );
  `);

  // Student lesson progress
  await pool.query(`
    CREATE TABLE IF NOT EXISTS progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      completed_at TIMESTAMPTZ DEFAULT NULL,
      UNIQUE (user_id, lesson_id)
    );
  `);

  // Certificates
  await pool.query(`
    CREATE TABLE IF NOT EXISTS certificates (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      certificate_id TEXT UNIQUE,
      certificate_code TEXT UNIQUE,
      full_name TEXT,
      certificate_title TEXT,
      organization_name TEXT,
      issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expiry_date TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'issued',
      credential_url TEXT,
      certificate_url TEXT,
      qr_code_url TEXT,
      certificate_html TEXT,
      certificate_pdf_url TEXT,
      revoked_at TIMESTAMPTZ,
      revoke_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, course_id)
    );
  `);

  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS student_id INTEGER REFERENCES users(id) ON DELETE CASCADE;`);
  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_id TEXT;`);
  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_code TEXT;`);
  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS full_name TEXT;`);
  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_title TEXT;`);
  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS organization_name TEXT;`);
  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;`);
  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'issued';`);
  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS credential_url TEXT;`);
  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_url TEXT;`);
  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS qr_code_url TEXT;`);
  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_html TEXT;`);
  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_pdf_url TEXT;`);
  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;`);
  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS revoke_reason TEXT;`);
  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await pool.query(`ALTER TABLE certificates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);

  await pool.query(`
    UPDATE certificates
    SET certificate_id = COALESCE(certificate_id, certificate_code)
    WHERE certificate_id IS NULL AND certificate_code IS NOT NULL
  `);
  await pool.query(`
    UPDATE certificates
    SET certificate_code = COALESCE(certificate_code, certificate_id)
    WHERE certificate_code IS NULL AND certificate_id IS NOT NULL
  `);
  await pool.query(`
    UPDATE certificates
    SET user_id = COALESCE(user_id, student_id),
        student_id = COALESCE(student_id, user_id)
    WHERE user_id IS NULL OR student_id IS NULL
  `);
  await pool.query(`
    UPDATE certificates
    SET issue_date = COALESCE(issue_date, issued_at, created_at),
        issued_at = COALESCE(issued_at, issue_date, created_at)
    WHERE issue_date IS NULL OR issued_at IS NULL
  `);
  await pool.query(`
    UPDATE certificates c
    SET full_name = COALESCE(c.full_name, u.name),
        credential_url = COALESCE(c.credential_url, c.certificate_url),
        certificate_url = COALESCE(c.certificate_url, c.credential_url),
        organization_name = COALESCE(c.organization_name, 'Vialifecoach Global Foundation')
    FROM users u
    WHERE u.id = COALESCE(c.user_id, c.student_id)
      AND (c.full_name IS NULL OR c.credential_url IS NULL OR c.certificate_url IS NULL OR c.organization_name IS NULL)
  `);
  await pool.query(`
    UPDATE certificates c
    SET certificate_title = COALESCE(c.certificate_title, course.title)
    FROM courses course
    WHERE course.id = c.course_id
      AND c.certificate_title IS NULL
  `);

  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_certificate_id ON certificates(certificate_id);`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_certificate_code ON certificates(certificate_code);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_certificates_issue_date ON certificates(issue_date);`);

  // Support tickets
  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'normal',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Support ticket replies
  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_ticket_replies (
      id SERIAL PRIMARY KEY,
      ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Announcements
  await pool.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      target_role TEXT DEFAULT 'all',
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Password reset tokens
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await initCoordinatorDatabase();
}
