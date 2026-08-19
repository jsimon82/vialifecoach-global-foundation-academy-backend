import { pool } from "../config/postgres.js";
import crypto from "crypto";

// ======== ISSUE CERTIFICATE =============
export async function issueCertificate(userId, courseId, certificateUrl = null, options = {}) {
  const certificateId = options.certificateId || `CERT-${crypto.randomUUID()}`;
  const code = options.certificateCode || certificateId;
  const credentialUrl = certificateUrl || options.credentialUrl || null;
  const fullName = options.fullName || null;
  const certificateTitle = options.certificateTitle || null;
  const organizationName = options.organizationName || "Vialifecoach Global Foundation";
  const issueDate = options.issueDate || new Date().toISOString();
  const expiryDate = options.expiryDate || null;
  const qrCodeUrl = options.qrCodeUrl || null;

  const { rows } = await pool.query(
    `INSERT INTO certificates (
       user_id,
       student_id,
       course_id,
       certificate_id,
       certificate_code,
       full_name,
       certificate_title,
       organization_name,
       issue_date,
       issued_at,
       expiry_date,
       status,
       credential_url,
       certificate_url,
       qr_code_url
     )
     VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $8, $9, 'issued', $10, $10, $11)
     ON CONFLICT (user_id, course_id) DO UPDATE
       SET student_id = EXCLUDED.student_id,
           certificate_id = EXCLUDED.certificate_id,
           certificate_code = EXCLUDED.certificate_code,
           full_name = COALESCE(EXCLUDED.full_name, certificates.full_name),
           certificate_title = COALESCE(EXCLUDED.certificate_title, certificates.certificate_title),
           organization_name = COALESCE(EXCLUDED.organization_name, certificates.organization_name),
           issue_date = COALESCE(EXCLUDED.issue_date, certificates.issue_date),
           issued_at = COALESCE(EXCLUDED.issued_at, certificates.issued_at),
           expiry_date = COALESCE(EXCLUDED.expiry_date, certificates.expiry_date),
           status = EXCLUDED.status,
           credential_url = COALESCE(EXCLUDED.credential_url, certificates.credential_url),
           certificate_url = COALESCE(EXCLUDED.certificate_url, certificates.certificate_url),
           qr_code_url = COALESCE(EXCLUDED.qr_code_url, certificates.qr_code_url)
     RETURNING *`,
    [userId, courseId, certificateId, code, fullName, certificateTitle, organizationName, issueDate, expiryDate, credentialUrl, qrCodeUrl]
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
      WHERE COALESCE(cert.user_id, cert.student_id) = $1 AND cert.course_id = $2`,
    [userId, courseId]
  );
  return rows[0];
}

// ======== GET ALL CERTIFICATES FOR A COURSE =============
export async function getCertificatesByCourse(courseId) {
  const { rows } = await pool.query(
     `SELECT cert.*, u.name AS student_name, u.email AS student_email
      FROM certificates cert
     JOIN users u ON u.id = COALESCE(cert.user_id, cert.student_id)
     WHERE cert.course_id = $1
     ORDER BY COALESCE(cert.issue_date, cert.issued_at, cert.created_at) DESC`,
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
     WHERE COALESCE(cert.user_id, cert.student_id) = $1
     ORDER BY COALESCE(cert.issue_date, cert.issued_at, cert.created_at) DESC`,
    [userId]
  );
  return rows;
}

// ======== VERIFY CERTIFICATE BY CODE =============
export async function verifyCertificate(code) {
  const { rows } = await pool.query(
     `SELECT cert.*, u.name AS student_name, c.title AS course_title
      FROM certificates cert
     JOIN users u ON u.id = COALESCE(cert.user_id, cert.student_id)
     JOIN courses c ON cert.course_id = c.id
     WHERE COALESCE(cert.certificate_id, cert.certificate_code) = $1
        OR COALESCE(cert.certificate_code, cert.certificate_id) = $1`,
    [code]
  );
  return rows[0];
}

// ======== GET ALL CERTIFICATES (ADMIN) =============
export async function getAllCertificates() {
  const { rows } = await pool.query(
     `SELECT cert.*, u.name AS student_name, u.email AS student_email, c.title AS course_title
      FROM certificates cert
     JOIN users u ON u.id = COALESCE(cert.user_id, cert.student_id)
     JOIN courses c ON cert.course_id = c.id
     ORDER BY COALESCE(cert.issue_date, cert.issued_at, cert.created_at) DESC`
  );
  return rows;
}
