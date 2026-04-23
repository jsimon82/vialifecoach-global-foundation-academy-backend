import { pool } from "../config/postgres.js";

// ====== CREATE COURSE DISCUSSION ========
export const createCourseDiscussion = async (courseId, instructorId, title, content, type = 'general') => {
  const result = await pool.query(
    `INSERT INTO course_discussions (course_id, instructor_id, title, content, type, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
     RETURNING *`,
    [courseId, instructorId, title, content, type]
  );
  return result.rows[0];
};

// ====== GET DISCUSSIONS BY COURSE ========
export const getCourseDiscussions = async (courseId) => {
  const result = await pool.query(
    `SELECT cd.*, u.name as instructor_name, u.email as instructor_email 
     FROM course_discussions cd 
     JOIN users u ON cd.instructor_id = u.id 
     WHERE cd.course_id = $1 
     ORDER BY cd.created_at DESC`,
    [courseId]
  );
  return result.rows;
};

// ====== GET DISCUSSION BY ID ========
export const getDiscussionById = async (discussionId) => {
  const result = await pool.query(
    `SELECT cd.*, u.name as instructor_name, u.email as instructor_email 
     FROM course_discussions cd 
     JOIN users u ON cd.instructor_id = u.id 
     WHERE cd.id = $1`,
    [discussionId]
  );
  return result.rows[0];
};

// ====== ADD COMMENT TO DISCUSSION ========
export const addDiscussionComment = async (discussionId, userId, content) => {
  const result = await pool.query(
    `INSERT INTO discussion_comments (discussion_id, user_id, content, created_at) 
     VALUES ($1, $2, $3, NOW()) 
     RETURNING *`,
    [discussionId, userId, content]
  );
  return result.rows[0];
};

// ====== GET COMMENTS BY DISCUSSION ========
export const getDiscussionComments = async (discussionId) => {
  const result = await pool.query(
    `SELECT dc.*, u.name as user_name, u.email as user_email, u.role 
     FROM discussion_comments dc 
     JOIN users u ON dc.user_id = u.id 
     WHERE dc.discussion_id = $1 
     ORDER BY dc.created_at ASC`,
    [discussionId]
  );
  return result.rows;
};

// ====== GRADE STUDENT PARTICIPATION ========
export const gradeStudentParticipation = async (discussionId, studentId, grade, feedback) => {
  const result = await pool.query(
    `INSERT INTO discussion_grades (discussion_id, student_id, grade, feedback, graded_at) 
     VALUES ($1, $2, $3, $4, NOW()) 
     ON CONFLICT (discussion_id, student_id) 
     DO UPDATE SET grade = $3, feedback = $4, graded_at = NOW() 
     RETURNING *`,
    [discussionId, studentId, grade, feedback]
  );
  return result.rows[0];
};

// ====== GET STUDENT GRADE FOR DISCUSSION ========
export const getStudentDiscussionGrade = async (discussionId, studentId) => {
  const result = await pool.query(
    `SELECT * FROM discussion_grades 
     WHERE discussion_id = $1 AND student_id = $2`,
    [discussionId, studentId]
  );
  return result.rows[0];
};

// ====== GET ALL GRADES FOR DISCUSSION ========
export const getDiscussionGrades = async (discussionId) => {
  const result = await pool.query(
    `SELECT dg.*, u.name as student_name, u.email as student_email 
     FROM discussion_grades dg 
     JOIN users u ON dg.student_id = u.id 
     WHERE dg.discussion_id = $1 
     ORDER BY dg.graded_at DESC`,
    [discussionId]
  );
  return result.rows;
};

// ====== GET STUDENT PARTICIPATION STATUS ========
export const getStudentParticipationStatus = async (courseId, studentId) => {
  const result = await pool.query(
    `SELECT cd.id, cd.title, cd.type, 
            CASE WHEN dc.user_id IS NOT NULL THEN true ELSE false END as participated,
            dg.grade, dg.feedback, dg.graded_at
     FROM course_discussions cd
     LEFT JOIN discussion_comments dc ON cd.id = dc.discussion_id AND dc.user_id = $2
     LEFT JOIN discussion_grades dg ON cd.id = dg.discussion_id AND dg.student_id = $2
     WHERE cd.course_id = $1
     ORDER BY cd.created_at DESC`,
    [courseId, studentId]
  );
  return result.rows;
};

// ====== CREATE DISCUSSION TABLES (if they don't exist) ========
export const createDiscussionTables = async () => {
  // Course discussions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS course_discussions (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'general',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Discussion comments table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS discussion_comments (
      id SERIAL PRIMARY KEY,
      discussion_id INTEGER NOT NULL REFERENCES course_discussions(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Discussion grades table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS discussion_grades (
      id SERIAL PRIMARY KEY,
      discussion_id INTEGER NOT NULL REFERENCES course_discussions(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      grade DECIMAL(5,2) CHECK (grade >= 0 AND grade <= 100),
      feedback TEXT,
      graded_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(discussion_id, student_id)
    )
  `);

  console.log('Discussion tables created successfully');
};
