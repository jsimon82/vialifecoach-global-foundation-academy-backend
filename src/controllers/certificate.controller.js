import { pool } from "../config/postgres.js";
import { catchAsync } from "../utils/asyncHelpers.js";
import { sanitizeInput } from "../utils/validator.js";
import crypto from "crypto";
import QRCode from "qrcode";

// Official certificate HTML template (DO NOT MODIFY)
const CERTIFICATE_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Certificate of Completion</title>

<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Montserrat:wght@400;500&display=swap" rel="stylesheet">

<style>
body {
    margin: 0;
    padding: 0;
    background: #f4f4f4;
}

.certificate-container {
    width: 1123px;
    height: 794px;
    background: white;
    margin: 30px auto;
    padding: 60px;
    position: relative;
    box-sizing: border-box;
    border: 15px solid #C6A75E;
    overflow: hidden;
}

.inner-border {
    border: 3px solid #C6A75E;
    height: 100%;
    padding: 50px;
    box-sizing: border-box;
    text-align: center;
    position: relative;
}

/* Watermark Logo */
.watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.05;
    width: 420px;
    z-index: 0;
}

.content {
    position: relative;
    z-index: 2;
}

/* Foundation Name */
.foundation-name {
    font-family: 'Playfair Display', serif;
    font-size: 30px;
    letter-spacing: 4px;
    color: #1F2A44;
}

/* Certificate Title smaller with spacing */
.certificate-title {
    font-family: 'Playfair Display', serif;
    font-size: 26px;
    margin: 18px auto 30px auto;
    color: #C6A75E;
    letter-spacing: 6px;
    display: inline-block;
    padding: 0 25px;
}

/* Optional divider line below title */
.divider {
    width: 180px;
    height: 2px;
    background-color: #C6A75E;
    margin: 10px auto 25px auto;
}

.presented-text {
    font-family: 'Montserrat', sans-serif;
    font-size: 18px;
    margin-top: 25px;
}

.student-name {
    font-family: 'Playfair Display', serif;
    font-size: 48px;
    font-weight: 700;
    margin: 25px 0;
    color: #1F2A44;
}

.course-title {
    font-family: 'Playfair Display', serif;
    font-size: 26px;
    font-style: italic;
    margin: 20px 0;
}

.course-description {
    font-family: 'Montserrat', sans-serif;
    font-size: 16px;
    width: 75%;
    margin: 0 auto;
    margin-top: 10px;
    line-height: 1.6;
}

.visible-logo {
    margin-top: 25px;
}

.visible-logo img {
    width: 140px;
}

.footer-section {
    position: absolute;
    bottom: 70px;
    left: 60px;
    right: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.signature img {
    width: 160px;
}

.signature-name {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    margin-top: 5px;
}

.signature-title {
    font-family: 'Montserrat', sans-serif;
    font-size: 14px;
}

.qr img {
    width: 100px;
}

.certificate-id {
    position: absolute;
    bottom: 20px;
    right: 60px;
    font-family: 'Montserrat', sans-serif;
    font-size: 12px;
}
</style>
</head>

<body>

<div class="certificate-container">
<div class="inner-border">

<img src="https://i.postimg.cc/dDPqTDcm/vialife.png" class="watermark" alt="Watermark" crossorigin="anonymous" referrerpolicy="no-referrer">

<div class="content">

<div class="foundation-name">
VIALIFECOACH GLOBAL FOUNDATION
</div>

<div class="certificate-title">
CERTIFICATE OF COMPLETION
</div>
<div class="divider"></div>

<div class="presented-text">
This is to proudly certify that
</div>

<div class="student-name">
{{STUDENT_NAME}}
</div>

<div class="presented-text">
has successfully completed the certified course
</div>

<div class="course-title">
"{{COURSE_TITLE}}"
</div>

<div class="course-description">
{{COURSE_DESCRIPTION}}
</div>

<div class="presented-text" style="margin-top: 25px;">
Offered by Vialifecoach Global Foundation
</div>

<div class="visible-logo">
<img src="https://i.postimg.cc/dDPqTDcm/vialife.png" alt="Official Logo" crossorigin="anonymous" referrerpolicy="no-referrer">
</div>

</div>

<div class="footer-section">

<div class="signature">
<img src="signature.png" alt="Signature">
<div class="signature-name">
Simon Pierre Gahibare
</div>
<div class="signature-title">
Founder & Certified Mental Health Coach
</div>
</div>

<div class="qr">
<img src="{{QR_CODE_URL}}" alt="QR Code">
<div style="font-size:12px;">Scan to Verify</div>
</div>

</div>

<div class="certificate-id">
Issued on: {{ISSUE_DATE}} | Certificate ID: {{CERTIFICATE_CODE}}
</div>

</div>
</div>

</body>
</html>`;

// Generate unique certificate code
function generateCertificateCode() {
  const prefix = "VCF";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

async function generateQrDataUrl(url) {
  try {
    return await QRCode.toDataURL(url, {
      width: 180,
      margin: 1,
      errorCorrectionLevel: "H",
      color: {
        dark: "#1F2A44",
        light: "#FFFFFF"
      }
    });
  } catch (error) {
    console.error("Failed to generate QR code:", error);
    return "";
  }
}

// Replace placeholders in certificate template
function populateCertificateTemplate(template, data) {
  return template
    .replace(/{{STUDENT_NAME}}/g, data.student_name)
    .replace(/{{COURSE_TITLE}}/g, data.course_title)
    .replace(/{{COURSE_DESCRIPTION}}/g, data.course_description)
    .replace(/{{ISSUE_DATE}}/g, data.issue_date)
    .replace(/{{CERTIFICATE_CODE}}/g, data.certificate_code)
    .replace(/{{QR_CODE_URL}}/g, data.qr_code_url)
    .replace(/{{CERTIFICATE_NUMBER}}/g, data.certificate_code || `VCF-${Date.now().toString(36).toUpperCase()}`)
    .replace(/src="signature.png"/g, 'src="" alt="Digital Signature" style="border: 1px solid #ccc; height: 60px;"');
}

// Get certificate preview (public)
export async function getCertificatePreviewController(req, res) {
  try {
    // Return template with sample data for preview
    const sampleData = {
      student_name: "John Doe",
      course_title: "Life Coaching Fundamentals",
      course_description: "Master the essential skills and techniques needed to become an effective life coach.",
      issue_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      certificate_code: "VLC-2024-DEMO-001",
      qr_code_url: ""
    };

    const verifyUrl = `${req.protocol}://${req.get("host")}/verify/${sampleData.certificate_code}`;
    sampleData.qr_code_url = await generateQrDataUrl(verifyUrl);
    
    // Create a simple working template with proper logo
    const workingTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Certificate of Completion</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Montserrat:wght@400;500&display=swap" rel="stylesheet">
<style>
body { margin: 0; padding: 0; background: #f4f4f4; font-family: 'Montserrat', sans-serif; }
.certificate-container { 
  width: 1123px; height: 794px; background: white; margin: 30px auto; padding: 60px; 
  position: relative; box-sizing: border-box; border: 15px solid #C6A75E; overflow: hidden; 
}
.inner-border { border: 3px solid #C6A75E; height: 100%; padding: 50px; box-sizing: border-box; text-align: center; position: relative; }
.foundation-name { font-family: 'Playfair Display', serif; font-size: 30px; letter-spacing: 4px; color: #1F2A44; margin-bottom: 20px; }
.certificate-title { font-family: 'Playfair Display', serif; font-size: 26px; color: #C6A75E; letter-spacing: 6px; margin: 20px 0; }
.divider { width: 180px; height: 2px; background-color: #C6A75E; margin: 20px auto; }
.presented-text { font-size: 18px; margin: 20px 0; }
.student-name { font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 700; margin: 25px 0; color: #1F2A44; }
.course-title { font-family: 'Playfair Display', serif; font-size: 26px; font-style: italic; margin: 20px 0; }
.course-description { font-size: 16px; width: 75%; margin: 0 auto; line-height: 1.6; }
.logo-container { margin: 20px auto; text-align: center; }
.logo-container img { width: 120px; height: auto; }
.footer-section { position: absolute; bottom: 70px; left: 60px; right: 60px; display: flex; justify-content: space-between; align-items: center; }
.signature-name { font-family: 'Playfair Display', serif; font-size: 18px; }
.signature-title { font-size: 14px; }
.certificate-id { position: absolute; bottom: 20px; right: 60px; font-size: 12px; }
</style>
</head>
<body>
<div class="certificate-container">
  <div class="inner-border">
    <div class="logo-container">
      <img src="https://i.postimg.cc/dDPqTDcm/vialife.png" alt="Vialifecoach Logo" crossorigin="anonymous" referrerpolicy="no-referrer">
    </div>
    <div class="foundation-name">VIALIFECOACH GLOBAL FOUNDATION</div>
    <div class="certificate-title">CERTIFICATE OF COMPLETION</div>
    <div class="divider"></div>
    <div class="presented-text">This is to proudly certify that</div>
    <div class="student-name">${sampleData.student_name}</div>
    <div class="presented-text">has successfully completed the certified course</div>
    <div class="course-title">"${sampleData.course_title}"</div>
    <div class="course-description">${sampleData.course_description}</div>
    <div class="presented-text" style="margin-top: 25px;">Offered by Vialifecoach Global Foundation</div>
    <div class="logo-container">
      <img src="https://i.postimg.cc/dDPqTDcm/vialife.png" alt="Vialifecoach Logo" crossorigin="anonymous" referrerpolicy="no-referrer">
    </div>
    <div class="footer-section">
      <div>
        <div class="signature-name">Simon Pierre Gahibare</div>
        <div class="signature-title">Founder & Certified Mental Health Coach</div>
      </div>
      <div class="qr">
        <img src="${sampleData.qr_code_url}" alt="QR Code" style="width:100px;height:100px;">
        <div style="font-size:12px;">Scan to Verify</div>
      </div>
    </div>
    <div class="certificate-id">Issued on: ${sampleData.issue_date} | Certificate ID: ${sampleData.certificate_code}</div>
  </div>
</div>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(workingTemplate);
  } catch (error) {
    console.error("Error getting certificate preview:", error);
    res.status(500).json({ message: "Failed to load certificate preview" });
  }
}

// Get student certificates
export async function getStudentCertificatesController(req, res) {
  try {
    const { studentId } = req.params;
    
    const query = `
      SELECT 
        c.id,
        c.certificate_code,
        c.issue_date,
        c.certificate_html,
        c.certificate_pdf_url,
        c.status,
        u.first_name || ' ' || u.last_name as student_name,
        u.email as student_email,
        course.title as course_title,
        course.description as course_description
      FROM certificates c
      JOIN users u ON c.student_id = u.id
      JOIN courses course ON c.course_id = course.id
      WHERE c.student_id = $1
      ORDER BY c.issue_date DESC
    `;
    
    const { rows } = await pool.query(query, [studentId]);
    
    res.json({ certificates: rows });
  } catch (error) {
    console.error("Error getting student certificates:", error);
    res.status(500).json({ message: "Failed to load student certificates" });
  }
}

// Verify certificate by code
export async function verifyCertificateController(req, res) {
  try {
    const { certificateCode } = req.params;
    
    const query = `
      SELECT 
        c.id,
        c.certificate_code,
        c.issue_date,
        c.status,
        u.first_name || ' ' || u.last_name as student_name,
        u.email as student_email,
        course.title as course_title,
        course.description as course_description
      FROM certificates c
      JOIN users u ON c.student_id = u.id
      JOIN courses course ON c.course_id = course.id
      WHERE c.certificate_code = $1
    `;
    
    const { rows } = await pool.query(query, [certificateCode]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error("Error verifying certificate:", error);
    res.status(500).json({ message: "Failed to verify certificate" });
  }
}

// Generate certificate (admin only)
export async function generateCertificateController(req, res) {
  try {
    const { student_id, course_id } = req.body;
    
    // Check if certificate already exists
    const existingQuery = `
      SELECT id FROM certificates 
      WHERE student_id = $1 AND course_id = $2
    `;
    const existingResult = await pool.query(existingQuery, [student_id, course_id]);
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ message: "Certificate already exists for this student and course" });
    }
    
    // Get student and course information
    const infoQuery = `
      SELECT 
        u.first_name || ' ' || u.last_name as student_name,
        u.email as student_email,
        course.title as course_title,
        course.description as course_description
      FROM users u
      JOIN courses course ON course.id = $2
      WHERE u.id = $1
    `;
    
    const { rows } = await pool.query(infoQuery, [student_id, course_id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Student or course not found" });
    }
    
    const studentInfo = rows[0];
    const certificateCode = generateCertificateCode();
    const issueDate = new Date().toISOString().split('T')[0];
    const verifyUrl = `${req.protocol}://${req.get('host')}/verify/${certificateCode}`;
    const qrCodeUrl = await generateQrDataUrl(verifyUrl);
    
    // Generate certificate HTML
    const certificateData = {
      student_name: studentInfo.student_name,
      course_title: studentInfo.course_title,
      course_description: studentInfo.course_description,
      issue_date: issueDate,
      certificate_code: certificateCode,
      qr_code_url: qrCodeUrl
    };
    
    const certificateHtml = populateCertificateTemplate(CERTIFICATE_TEMPLATE, certificateData);
    
    // Insert certificate into database
    const insertQuery = `
      INSERT INTO certificates (
        student_id, 
        course_id, 
        issue_date, 
        certificate_code, 
        certificate_html, 
        status
      ) VALUES ($1, $2, $3, $4, $5, 'issued')
      RETURNING *
    `;
    
    const { rows: [certificate] } = await pool.query(insertQuery, [
      student_id,
      course_id,
      issueDate,
      certificateCode,
      certificateHtml
    ]);
    
    res.status(201).json({
      ...certificate,
      student_name: studentInfo.student_name,
      course_title: studentInfo.course_title,
      course_description: studentInfo.course_description
    });
  } catch (error) {
    console.error("Error generating certificate:", error);
    res.status(500).json({ message: "Failed to generate certificate" });
  }
}

// Get certificate statistics (admin only)
export async function getCertificateStatsController(req, res) {
  try {
    // Total certificates issued
    const totalQuery = `SELECT COUNT(*) as total FROM certificates`;
    const { rows: [totalResult] } = await pool.query(totalQuery);
    
    // Certificates issued this month
    const monthQuery = `
      SELECT COUNT(*) as this_month 
      FROM certificates 
      WHERE DATE_TRUNC('month', issued_at) = DATE_TRUNC('month', CURRENT_DATE)
    `;
    const { rows: [monthResult] } = await pool.query(monthQuery);
    
    // Popular courses
    const popularQuery = `
      SELECT 
        course.title,
        COUNT(*) as certificates_count
      FROM certificates c
      JOIN courses course ON c.course_id = course.id
      GROUP BY course.title
      ORDER BY certificates_count DESC
      LIMIT 5
    `;
    const { rows: popularRows } = await pool.query(popularQuery);
    
    res.json({
      total_issued: parseInt(totalResult.total),
      issued_this_month: parseInt(monthResult.this_month),
      pending_verification: 0, // Can be implemented later
      popular_courses: popularRows
    });
  } catch (error) {
    console.error("Error getting certificate stats:", error);
    res.status(500).json({ message: "Failed to load certificate statistics" });
  }
}

// Search certificates (admin only)
export async function searchCertificatesController(req, res) {
  try {
    const { query, status, course_id, date_from, date_to, page = 1, limit = 20 } = req.query;
    
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;
    
    if (query) {
      whereConditions.push(`(
        u.name ILIKE $${paramIndex} OR 
        u.email ILIKE $${paramIndex} OR 
        course.title ILIKE $${paramIndex} OR 
        c.certificate_code ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${query}%`);
      paramIndex++;
    }
    
    if (course_id) {
      whereConditions.push(`c.course_id = $${paramIndex}`);
      queryParams.push(course_id);
      paramIndex++;
    }
    
    if (date_from) {
      whereConditions.push(`c.issued_at >= $${paramIndex}`);
      queryParams.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereConditions.push(`c.issued_at <= $${paramIndex}`);
      queryParams.push(date_to);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM certificates c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN courses course ON c.course_id = course.id
      ${whereClause}
    `;
    const { rows: [countResult] } = await pool.query(countQuery, queryParams);
    
    // Get certificates with pagination
    const offset = (page - 1) * limit;
    const searchQuery = `
      SELECT 
        c.id,
        c.certificate_code,
        c.issued_at,
        u.name as student_name,
        u.email as student_email,
        course.title as course_title,
        course.description as course_description
      FROM certificates c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN courses course ON c.course_id = course.id
      ${whereClause}
      ORDER BY c.issued_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    const { rows } = await pool.query(searchQuery, queryParams);
    
    res.json({
      certificates: rows,
      total: parseInt(countResult.total),
      page: parseInt(page),
      total_pages: Math.ceil(countResult.total / limit)
    });
  } catch (error) {
    console.error("Error searching certificates:", error);
    res.status(500).json({ message: "Failed to search certificates" });
  }
}

// Revoke certificate (admin only)
export async function revokeCertificateController(req, res) {
  try {
    const { certificateId } = req.params;
    const { reason } = req.body;
    
    const query = `
      UPDATE certificates 
      SET status = 'revoked', 
          revoked_at = CURRENT_TIMESTAMP,
          revoke_reason = $2
      WHERE id = $1
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [certificateId, reason]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    
    res.json({ message: "Certificate revoked successfully", certificate: rows[0] });
  } catch (error) {
    console.error("Error revoking certificate:", error);
    res.status(500).json({ message: "Failed to revoke certificate" });
  }
}

// Download certificate PDF
export async function downloadCertificatePdfController(req, res) {
  try {
    const { certificateId } = req.params;
    
    const query = `
      SELECT certificate_html, certificate_pdf_url, certificate_code
      FROM certificates 
      WHERE id = $1 AND status = 'issued'
    `;
    
    const { rows } = await pool.query(query, [certificateId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    
    const certificate = rows[0];
    
    if (certificate.certificate_pdf_url) {
      // If PDF already exists, redirect to it
      return res.redirect(certificate.certificate_pdf_url);
    }
    
    // For now, return HTML as PDF (can be enhanced with puppeteer later)
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificate_code}.html"`);
    res.send(certificate.certificate_html);
  } catch (error) {
    console.error("Error downloading certificate PDF:", error);
    res.status(500).json({ message: "Failed to download certificate" });
  }
}

// Wrapped exports for Express
export const getCertificatePreview = catchAsync(getCertificatePreviewController);
export const getStudentCertificates = catchAsync(getStudentCertificatesController);
export const verifyCertificate = catchAsync(verifyCertificateController);
export const generateCertificate = catchAsync(generateCertificateController);
export const getCertificateStats = catchAsync(getCertificateStatsController);
export const searchCertificates = catchAsync(searchCertificatesController);
export const revokeCertificate = catchAsync(revokeCertificateController);
export const downloadCertificatePdf = catchAsync(downloadCertificatePdfController);
