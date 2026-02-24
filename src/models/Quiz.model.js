import { pool } from "../config/postgres.js";

// ======== GET QUIZ BY LESSON ID =============
export async function getQuizByLessonId(lessonId) {
  const { rows } = await pool.query(
    "SELECT * FROM quizzes WHERE lesson_id = $1",
    [lessonId]
  );
  return rows[0];
}

// ======== GET QUIZ BY ID (with questions & answers) ============
export async function getQuizWithQuestions(quizId) {
  const { rows: quizRows } = await pool.query(
    "SELECT * FROM quizzes WHERE id = $1",
    [quizId]
  );
  if (!quizRows[0]) return null;

  const { rows: questions } = await pool.query(
    "SELECT * FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_index",
    [quizId]
  );

  for (const q of questions) {
    const { rows: answers } = await pool.query(
      "SELECT * FROM quiz_answers WHERE question_id = $1 ORDER BY order_index",
      [q.id]
    );
    q.answers = answers;
  }

  return { ...quizRows[0], questions };
}

// ======== GET ALL QUIZZES FOR A COURSE ============
export async function getQuizzesByCourseId(courseId) {
  const { rows } = await pool.query(
    "SELECT * FROM quizzes WHERE course_id = $1 ORDER BY created_at",
    [courseId]
  );
  return rows;
}

// ======== CREATE QUIZ ============
export async function createQuiz(quizData) {
  const { lesson_id, course_id, title, description, passing_score, time_limit_minutes, auto_grade } = quizData;
  const { rows } = await pool.query(
    `INSERT INTO quizzes (lesson_id, course_id, title, description, passing_score, time_limit_minutes, auto_grade)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [lesson_id || null, course_id || null, title, description || null, passing_score || 70, time_limit_minutes || null, auto_grade !== false]
  );
  return rows[0];
}

// ======== UPDATE QUIZ ============
export async function updateQuiz(id, updates) {
  const allowed = ['title', 'description', 'passing_score', 'time_limit_minutes', 'auto_grade'];
  const keys = Object.keys(updates).filter(k => allowed.includes(k));
  if (!keys.length) return null;

  const fields = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = keys.map(k => updates[k]);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE quizzes SET ${fields} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0];
}

// ======== DELETE QUIZ ============
export async function deleteQuiz(id) {
  const { rowCount } = await pool.query("DELETE FROM quizzes WHERE id = $1", [id]);
  return rowCount;
}

// ======== ADD QUESTION ============
export async function addQuestion(quizId, questionData) {
  const { question_text, question_type, marks, order_index, correct_answer } = questionData;

  let idx = order_index;
  if (idx === undefined || idx === null) {
    const { rows: countRows } = await pool.query(
      "SELECT COALESCE(MAX(order_index), -1) + 1 AS next_index FROM quiz_questions WHERE quiz_id = $1",
      [quizId]
    );
    idx = countRows[0].next_index;
  }

  const { rows } = await pool.query(
    `INSERT INTO quiz_questions (quiz_id, question_text, question_type, marks, order_index, correct_answer)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [quizId, question_text, question_type || 'multiple_choice', marks || 1, idx, correct_answer || null]
  );
  return rows[0];
}

// ======== UPDATE QUESTION ============
export async function updateQuestion(id, updates) {
  const allowed = ['question_text', 'question_type', 'marks', 'order_index', 'correct_answer'];
  const keys = Object.keys(updates).filter(k => allowed.includes(k));
  if (!keys.length) return null;

  const fields = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = keys.map(k => updates[k]);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE quiz_questions SET ${fields} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0];
}

// ======== DELETE QUESTION ============
export async function deleteQuestion(id) {
  const { rowCount } = await pool.query("DELETE FROM quiz_questions WHERE id = $1", [id]);
  return rowCount;
}

// ======== ADD ANSWER OPTION ============
export async function addAnswerOption(questionId, answerData) {
  const { answer_text, is_correct, order_index } = answerData;

  let idx = order_index;
  if (idx === undefined || idx === null) {
    const { rows: countRows } = await pool.query(
      "SELECT COALESCE(MAX(order_index), -1) + 1 AS next_index FROM quiz_answers WHERE question_id = $1",
      [questionId]
    );
    idx = countRows[0].next_index;
  }

  const { rows } = await pool.query(
    `INSERT INTO quiz_answers (question_id, answer_text, is_correct, order_index)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [questionId, answer_text, is_correct || false, idx]
  );
  return rows[0];
}

// ======== UPDATE ANSWER OPTION ============
export async function updateAnswerOption(id, updates) {
  const allowed = ['answer_text', 'is_correct', 'order_index'];
  const keys = Object.keys(updates).filter(k => allowed.includes(k));
  if (!keys.length) return null;

  const fields = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = keys.map(k => updates[k]);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE quiz_answers SET ${fields} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0];
}

// ======== DELETE ANSWER OPTION ============
export async function deleteAnswerOption(id) {
  const { rowCount } = await pool.query("DELETE FROM quiz_answers WHERE id = $1", [id]);
  return rowCount;
}

// ======== SUBMIT QUIZ ============
export async function submitQuiz(quizId, userId, answers) {
  const quiz = await getQuizWithQuestions(quizId);
  if (!quiz) throw new Error("Quiz not found");

  let score = 0;
  let totalMarks = 0;

  const gradedAnswers = answers.map(ans => {
    const question = quiz.questions.find(q => q.id === ans.question_id);
    if (!question) return { ...ans, correct: false };

    totalMarks += question.marks;

    let isCorrect = false;
    if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
      const correctAnswer = question.answers.find(a => a.is_correct);
      isCorrect = correctAnswer && correctAnswer.id === ans.selected_answer_id;
    } else if (question.question_type === 'short_answer') {
      isCorrect = question.correct_answer &&
        question.correct_answer.toLowerCase().trim() === (ans.text_answer || '').toLowerCase().trim();
    }

    if (isCorrect) score += question.marks;
    return { ...ans, correct: isCorrect };
  });

  const passed = totalMarks > 0 ? (score / totalMarks) * 100 >= quiz.passing_score : false;

  const { rows } = await pool.query(
    `INSERT INTO quiz_results (quiz_id, user_id, score, total_marks, passed, answers)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [quizId, userId, score, totalMarks, passed, JSON.stringify(gradedAnswers)]
  );

  return { result: rows[0], score, totalMarks, passed, gradedAnswers };
}

// ======== GET QUIZ RESULTS ============
export async function getQuizResults(quizId) {
  const { rows } = await pool.query(
    `SELECT qr.*, u.name AS student_name, u.email AS student_email
     FROM quiz_results qr
     JOIN users u ON qr.user_id = u.id
     WHERE qr.quiz_id = $1
     ORDER BY qr.submitted_at DESC`,
    [quizId]
  );
  return rows;
}

// ======== GET USER QUIZ RESULT ============
export async function getUserQuizResult(quizId, userId) {
  const { rows } = await pool.query(
    "SELECT * FROM quiz_results WHERE quiz_id = $1 AND user_id = $2 ORDER BY submitted_at DESC LIMIT 1",
    [quizId, userId]
  );
  return rows[0];
}

// ======== QUIZ RULE ACCEPTANCE FUNCTIONS ============
export async function acknowledgeQuizRules(userId, quizId) {
  const { rows } = await pool.query(
    `INSERT INTO quiz_rule_acceptance (user_id, quiz_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, quiz_id) DO NOTHING
     RETURNING *`,
    [userId, quizId]
  );
  return rows[0] || null;
}

export async function hasAcceptedQuizRules(userId, quizId) {
  const { rows } = await pool.query(
    `SELECT * FROM quiz_rule_acceptance
     WHERE user_id = $1 AND quiz_id = $2`,
    [userId, quizId]
  );
  return rows.length > 0;
}