import { pool } from "../config/postgres.js";
import crypto from "crypto";

// ======== ISSUE CERTIFICATE =============
export async function issueCertificate(userId, courseId, certificateUrl = null) {
  const code = crypto.randomBytes(8).toString("hex").toUpperCase();

  const { rows } = await pool.query(
    `INSERT INTO certificates (user_id, course_id, certificate_url, certificate_code)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, course_id) DO UPDATE
       SET certificate_url = EXCLUDED.certificate_url
     RETURNING *`,
    [userId, courseId, certificateUrl, code]
  );
  return rows[0];
}

// ======== GET CERTIFICATE BY USER & COURSE =============
export async function getCertificate(userId, courseId) {
  const { rows } = await pool.query(
    `SELECT cert.*, u.name AS student_name, c.title AS course_title
     FROM certificates cert
     JOIN users u ON cert.user_id = u.id
     JOIN courses c ON cert.course_id = c.id
     WHERE cert.user_id = $1 AND cert.course_id = $2`,
    [userId, courseId]
  );
  return rows[0];
}

// ======== GET ALL CERTIFICATES FOR A COURSE =============
export async function getCertificatesByCourse(courseId) {
  const { rows } = await pool.query(
    `SELECT cert.*, u.name AS student_name, u.email AS student_email
     FROM certificates cert
     JOIN users u ON cert.user_id = u.id
     WHERE cert.course_id = $1
     ORDER BY cert.issued_at DESC`,
    [courseId]
  );
  return rows;
}

// ======== GET ALL CERTIFICATES FOR A USER =============
export async function getCertificatesByUser(userId) {
  const { rows } = await pool.query(
    `SELECT cert.*, c.title AS course_title, c.thumbnail_url
     FROM certificates cert
     JOIN courses c ON cert.course_id = c.id
     WHERE cert.user_id = $1
     ORDER BY cert.issued_at DESC`,
    [userId]
  );
  return rows;
}

// ======== VERIFY CERTIFICATE BY CODE =============
export async function verifyCertificate(code) {
  const { rows } = await pool.query(
    `SELECT cert.*, u.name AS student_name, c.title AS course_title
     FROM certificates cert
     JOIN users u ON cert.user_id = u.id
     JOIN courses c ON cert.course_id = c.id
     WHERE cert.certificate_code = $1`,
    [code]
  );
  return rows[0];
}

// ======== GET ALL CERTIFICATES (ADMIN) =============
export async function getAllCertificates() {
  const { rows } = await pool.query(
    `SELECT cert.*, u.name AS student_name, u.email AS student_email, c.title AS course_title
     FROM certificates cert
     JOIN users u ON cert.user_id = u.id
     JOIN courses c ON cert.course_id = c.id
     ORDER BY cert.issued_at DESC`
  );
  return rows;
}
