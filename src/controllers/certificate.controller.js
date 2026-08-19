import { pool } from "../config/postgres.js";
import { catchAsync } from "../utils/asyncHelpers.js";
import { sanitizeInput } from "../utils/validator.js";
import crypto from "crypto";
import QRCode from "qrcode";

const ORGANIZATION_NAME = "Vialifecoach Global Foundation";
const ORGANIZATION_LOGO_URL = "https://i.postimg.cc/dDPqTDcm/vialife.png";

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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDisplayDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function generateCertificateIdentifier() {
  return `CERT-${crypto.randomUUID()}`;
}

function getPublicBaseUrl(req) {
  const configuredBaseUrl = (
    process.env.PUBLIC_BASE_URL ||
    process.env.APP_PUBLIC_URL ||
    process.env.SERVER_PUBLIC_URL ||
    process.env.BACKEND_PUBLIC_URL ||
    ""
  ).trim().replace(/\/$/, "");

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (req) {
    const forwardedProto = req.get?.("x-forwarded-proto");
    const forwardedHost = req.get?.("x-forwarded-host");
    const host = forwardedHost || req.get?.("host") || `localhost:${process.env.PORT || 5000}`;
    const protocol = forwardedProto || req.protocol || "http";
    return `${protocol}://${host}`.replace(/\/$/, "");
  }

  return `http://localhost:${process.env.PORT || 5000}`;
}

function buildVerificationUrl(req, certificateId) {
  return `${getPublicBaseUrl(req)}/verify/${encodeURIComponent(certificateId)}`;
}

function buildLinkedInShareUrl(credentialUrl) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(credentialUrl)}`;
}

function normalizeVerificationStatus(record) {
  const rawStatus = String(record?.status || "").toLowerCase();
  const expiryDate = record?.expiry_date ? new Date(record.expiry_date) : null;
  const isExpired = expiryDate && !Number.isNaN(expiryDate.getTime()) && expiryDate.getTime() < Date.now();

  if (rawStatus === "revoked" || record?.revoked_at) {
    return "revoked";
  }

  if (rawStatus === "expired" || isExpired) {
    return "expired";
  }

  return "valid";
}

function humanizeVerificationStatus(status) {
  switch (status) {
    case "valid":
      return "Valid";
    case "expired":
      return "Expired";
    case "revoked":
      return "Revoked";
    default:
      return "Not Found";
  }
}

function resolveCertificateIdentifier(record) {
  return record?.certificate_id || record?.certificate_code || "";
}

async function buildVerificationContext(record, req) {
  if (!record) {
    return null;
  }

  const certificateId = resolveCertificateIdentifier(record);
  const credentialUrl = record.credential_url || record.certificate_url || buildVerificationUrl(req, certificateId);
  const qrCodeUrl = record.qr_code_url || (await generateQrDataUrl(credentialUrl));
  const verificationStatus = normalizeVerificationStatus(record);

  return {
    ...record,
    certificate_id: certificateId,
    credential_url: credentialUrl,
    qr_code_url: qrCodeUrl,
    verification_status: verificationStatus,
    verification_status_label: humanizeVerificationStatus(verificationStatus),
    linkedin_share_url: buildLinkedInShareUrl(credentialUrl),
    issue_date_display: formatDisplayDate(record.issue_date || record.issued_at || record.created_at),
    expiry_date_display: formatDisplayDate(record.expiry_date),
    verification_url: buildVerificationUrl(req, certificateId)
  };
}

function renderVerificationPageHtml(context) {
  const {
    certificate_id = "",
    full_name = "Unknown recipient",
    certificate_title = "Certificate of Completion",
    organization_name = ORGANIZATION_NAME,
    issue_date_display = "N/A",
    expiry_date_display = "N/A",
    verification_status_label = "Not Found",
    credential_url = "",
    qr_code_url = "",
    linkedin_share_url = "",
    course_description = "",
    user_email = "",
    verification_url = ""
  } = context || {};

  const statusClass = String(context?.verification_status || "not_found");
  const isFound = statusClass !== "not_found";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Certificate Verification</title>
  <meta name="description" content="Public certificate verification page" />
  <meta property="og:title" content="Certificate Verification" />
  <meta property="og:url" content="${escapeHtml(verification_url)}" />
  <meta property="og:type" content="website" />
  <style>
    :root {
      color-scheme: light;
      --bg: #f3efe6;
      --card: #ffffff;
      --ink: #14213d;
      --muted: #5b6473;
      --accent: #c6a75e;
      --accent-dark: #9d7d34;
      --success: #0f8a5f;
      --warning: #cc7a00;
      --danger: #b42318;
      --border: rgba(20, 33, 61, 0.12);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      background:
        radial-gradient(circle at top left, rgba(198, 167, 94, 0.16), transparent 24%),
        radial-gradient(circle at top right, rgba(20, 33, 61, 0.08), transparent 18%),
        linear-gradient(180deg, #faf7f0 0%, #f3efe6 45%, #ede7dc 100%);
      color: var(--ink);
      min-height: 100vh;
    }

    .shell {
      max-width: 1100px;
      margin: 0 auto;
      padding: 40px 20px 56px;
    }

    .hero {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 24px;
      align-items: stretch;
    }

    .panel {
      background: rgba(255,255,255,0.82);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border);
      border-radius: 24px;
      box-shadow: 0 18px 50px rgba(20, 33, 61, 0.10);
      overflow: hidden;
    }

    .panel-inner { padding: 28px; }

    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.2em;
      font-size: 12px;
      color: var(--accent-dark);
      font-weight: 700;
      margin-bottom: 12px;
    }

    h1 {
      margin: 0 0 14px;
      font-size: clamp(2rem, 3vw, 3.1rem);
      line-height: 1.05;
    }

    .lede {
      margin: 0;
      color: var(--muted);
      line-height: 1.65;
      font-size: 16px;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 18px;
      padding: 10px 14px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 13px;
      border: 1px solid var(--border);
      background: #fff;
    }

    .status-pill.valid { color: var(--success); }
    .status-pill.expired { color: var(--warning); }
    .status-pill.revoked { color: var(--danger); }
    .status-pill.not_found { color: var(--muted); }

    .details {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      margin-top: 24px;
    }

    .field {
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(251,249,244,0.96));
    }

    .field-label {
      display: block;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--muted);
      margin-bottom: 8px;
      font-weight: 700;
    }

    .field-value {
      font-size: 15px;
      line-height: 1.5;
      word-break: break-word;
    }

    .side {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .logo-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .logo-wrap img {
      width: 68px;
      height: 68px;
      object-fit: contain;
      border-radius: 16px;
      background: white;
      border: 1px solid var(--border);
      padding: 8px;
    }

    .org-name {
      font-weight: 800;
      font-size: 18px;
      margin: 0;
    }

    .org-subtitle {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 14px;
    }

    .qr-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      min-height: 100%;
    }

    .qr-box img {
      width: 180px;
      height: 180px;
      border-radius: 18px;
      background: #fff;
      padding: 10px;
      border: 1px solid var(--border);
      box-shadow: 0 12px 30px rgba(20, 33, 61, 0.08);
    }

    .qr-caption {
      margin-top: 14px;
      font-size: 14px;
      color: var(--muted);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 18px;
    }

    .button, .button-link {
      appearance: none;
      border: none;
      border-radius: 14px;
      padding: 12px 16px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
    }

    .button:hover, .button-link:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 18px rgba(20, 33, 61, 0.12);
    }

    .button.primary, .button-link.primary {
      color: #fff;
      background: linear-gradient(135deg, var(--accent), var(--accent-dark));
    }

    .button.secondary, .button-link.secondary {
      color: var(--ink);
      background: #fff;
      border: 1px solid var(--border);
    }

    .footer-note {
      margin-top: 22px;
      font-size: 13px;
      color: var(--muted);
      line-height: 1.6;
    }

    .empty-state {
      border-left: 4px solid var(--danger);
      padding-left: 14px;
      color: var(--muted);
    }

    @media (max-width: 860px) {
      .hero { grid-template-columns: 1fr; }
      .details { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <article class="panel">
        <div class="panel-inner">
          <div class="eyebrow">Public verification</div>
          <h1>${isFound ? "Certificate Verified" : "Certificate Not Found"}</h1>
          <p class="lede">
            ${isFound
              ? "This page confirms the certificate details below and gives you a public verification link that can be shared on LinkedIn, resumes, and other professional profiles."
              : "We could not find a matching certificate. If you pasted the link manually, please double-check the credential ID."}
          </p>
          <div class="status-pill ${escapeHtml(statusClass)}">${escapeHtml(verification_status_label)}</div>

          <div class="details">
            <div class="field">
              <span class="field-label">Credential ID</span>
              <div class="field-value">${escapeHtml(certificate_id || "N/A")}</div>
            </div>
            <div class="field">
              <span class="field-label">Recipient</span>
              <div class="field-value">${escapeHtml(full_name || "N/A")}</div>
            </div>
            <div class="field">
              <span class="field-label">Certificate Title</span>
              <div class="field-value">${escapeHtml(certificate_title || "N/A")}</div>
            </div>
            <div class="field">
              <span class="field-label">Issuing Organization</span>
              <div class="field-value">${escapeHtml(organization_name || ORGANIZATION_NAME)}</div>
            </div>
            <div class="field">
              <span class="field-label">Issue Date</span>
              <div class="field-value">${escapeHtml(issue_date_display)}</div>
            </div>
            <div class="field">
              <span class="field-label">Expiry Date</span>
              <div class="field-value">${escapeHtml(expiry_date_display)}</div>
            </div>
          </div>

          ${course_description ? `
            <div class="field" style="margin-top: 14px;">
              <span class="field-label">Description</span>
              <div class="field-value">${escapeHtml(course_description)}</div>
            </div>
          ` : ""}

          ${user_email ? `
            <div class="field" style="margin-top: 14px;">
              <span class="field-label">Recipient Email</span>
              <div class="field-value">${escapeHtml(user_email)}</div>
            </div>
          ` : ""}

          <div class="actions">
            <a class="button-link primary" href="${escapeHtml(linkedin_share_url || "#")}" target="_blank" rel="noreferrer">
              Share on LinkedIn
            </a>
            <button class="button secondary" type="button" id="copy-link-btn" data-link="${escapeHtml(credential_url)}">
              Copy Link
            </button>
          </div>

          <div class="footer-note">
            Credential URL: <strong>${escapeHtml(credential_url || verification_url || "N/A")}</strong>
          </div>
        </div>
      </article>

      <aside class="side">
        <section class="panel">
          <div class="panel-inner qr-box">
            <div class="logo-wrap" style="margin-bottom: 14px;">
              <img src="${ORGANIZATION_LOGO_URL}" alt="Organization logo" />
              <div>
                <p class="org-name">${escapeHtml(organization_name || ORGANIZATION_NAME)}</p>
                <p class="org-subtitle">Official certificate verification</p>
              </div>
            </div>
            ${isFound && qr_code_url ? `<img src="${escapeHtml(qr_code_url)}" alt="Certificate QR code" />` : `<div class="empty-state">QR code not available.</div>`}
            <div class="qr-caption">Scan to open the public verification page.</div>
          </div>
        </section>
        <section class="panel">
          <div class="panel-inner">
            <div class="eyebrow">What this means</div>
            <p class="lede" style="margin: 0;">
              ${isFound
                ? "The certificate is publicly verifiable. The verification link and QR code point to the same credential page, making it simple to share on LinkedIn."
                : "If this certificate should exist, confirm that the credential ID is correct or ask the issuing organization to resend the verification link."}
            </p>
          </div>
        </section>
      </aside>
    </section>
  </main>
  <script>
    const copyButton = document.getElementById('copy-link-btn');
    if (copyButton) {
      copyButton.addEventListener('click', async () => {
        const link = copyButton.dataset.link || '';
        try {
          await navigator.clipboard.writeText(link);
          const previous = copyButton.textContent;
          copyButton.textContent = 'Copied';
          setTimeout(() => { copyButton.textContent = previous; }, 1400);
        } catch (error) {
          alert('Copy failed. Please copy the URL manually.');
        }
      });
    }
  </script>
</body>
</html>`;
}

async function fetchCertificateVerificationRecord(identifier) {
  const normalizedIdentifier = String(identifier || "").trim();
  if (!normalizedIdentifier) {
    return null;
  }

  const query = `
    SELECT
      c.id,
      c.user_id,
      c.student_id,
      c.course_id,
      COALESCE(c.certificate_id, c.certificate_code) AS certificate_id,
      COALESCE(c.certificate_code, c.certificate_id) AS certificate_code,
      COALESCE(NULLIF(c.full_name, ''), NULLIF(CONCAT_WS(' ', u.first_name, u.last_name), ''), u.name, 'Unknown Recipient') AS full_name,
      COALESCE(NULLIF(c.certificate_title, ''), course.title, 'Certificate of Completion') AS certificate_title,
      COALESCE(NULLIF(c.organization_name, ''), $2) AS organization_name,
      COALESCE(c.issue_date, c.issued_at, c.created_at, NOW()) AS issue_date,
      c.expiry_date,
      c.status,
      COALESCE(c.credential_url, c.certificate_url) AS credential_url,
      c.certificate_url,
      c.qr_code_url,
      c.revoked_at,
      c.revoke_reason,
      c.certificate_html,
      c.certificate_pdf_url,
      u.email AS user_email,
      course.description AS course_description,
      CASE
        WHEN LOWER(COALESCE(c.status, '')) = 'revoked' OR c.revoked_at IS NOT NULL THEN 'revoked'
        WHEN LOWER(COALESCE(c.status, '')) = 'expired' OR (c.expiry_date IS NOT NULL AND c.expiry_date < NOW()) THEN 'expired'
        ELSE 'valid'
      END AS verification_status
    FROM certificates c
    LEFT JOIN users u ON u.id = COALESCE(c.user_id, c.student_id)
    LEFT JOIN courses course ON course.id = c.course_id
    WHERE LOWER(COALESCE(c.certificate_id, c.certificate_code)) = LOWER($1)
       OR LOWER(COALESCE(c.certificate_code, c.certificate_id)) = LOWER($1)
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [normalizedIdentifier, ORGANIZATION_NAME]);
  return rows[0] || null;
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
    const sampleData = {
      student_name: "John Doe",
      course_title: "Life Coaching Fundamentals",
      course_description: "Master the essential skills and techniques needed to become an effective life coach.",
      issue_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      certificate_code: "VLC-2024-DEMO-001",
      qr_code_url: ""
    };

    const verifyUrl = buildVerificationUrl(req, sampleData.certificate_code);
    sampleData.qr_code_url = await generateQrDataUrl(verifyUrl);
    const certificateHtml = populateCertificateTemplate(CERTIFICATE_TEMPLATE, sampleData);
    res.setHeader('Content-Type', 'text/html');
    res.send(certificateHtml);
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
        COALESCE(c.certificate_id, c.certificate_code) AS certificate_id,
        COALESCE(c.certificate_code, c.certificate_id) AS certificate_code,
        COALESCE(c.issue_date, c.issued_at, c.created_at) AS issue_date,
        c.certificate_html,
        c.certificate_pdf_url,
        c.status,
        COALESCE(NULLIF(CONCAT_WS(' ', u.first_name, u.last_name), ''), u.name) as student_name,
        u.email as student_email,
        course.title as course_title,
        course.description as course_description
      FROM certificates c
      JOIN users u ON u.id = COALESCE(c.student_id, c.user_id)
      JOIN courses course ON c.course_id = course.id
      WHERE COALESCE(c.student_id, c.user_id) = $1
      ORDER BY COALESCE(c.issue_date, c.issued_at, c.created_at) DESC
    `;
    
    const { rows } = await pool.query(query, [studentId]);
    
    res.json({ certificates: rows });
  } catch (error) {
    console.error("Error getting student certificates:", error);
    res.status(500).json({ message: "Failed to load student certificates" });
  }
}

// Verify certificate by public identifier
export async function verifyCertificateController(req, res) {
  try {
    const { certificateCode, certificateId } = req.params;
    const identifier = certificateCode || certificateId;
    const record = await fetchCertificateVerificationRecord(identifier);

    if (!record) {
      return res.status(404).json({
        message: "Certificate not found",
        verification_status: "not_found"
      });
    }

    const context = await buildVerificationContext(record, req);

    res.json({
      id: context.id,
      certificate_id: context.certificate_id,
      certificate_code: context.certificate_code,
      full_name: context.full_name,
      certificate_title: context.certificate_title,
      organization_name: context.organization_name,
      issue_date: context.issue_date,
      issue_date_display: context.issue_date_display,
      expiry_date: context.expiry_date,
      expiry_date_display: context.expiry_date_display,
      status: context.status,
      verification_status: context.verification_status,
      verification_status_label: context.verification_status_label,
      credential_url: context.credential_url,
      qr_code_url: context.qr_code_url,
      linkedin_share_url: context.linkedin_share_url,
      user_email: context.user_email,
      course_description: context.course_description
    });
  } catch (error) {
    console.error("Error verifying certificate:", error);
    res.status(500).json({ message: "Failed to verify certificate" });
  }
}

// Public verification details endpoint
export async function getCertificateByIdController(req, res) {
  try {
    const { certificateId } = req.params;
    const record = await fetchCertificateVerificationRecord(certificateId);

    if (!record) {
      return res.status(404).json({
        message: "Certificate not found",
        verification_status: "not_found"
      });
    }

    const context = await buildVerificationContext(record, req);

    res.json({
      success: true,
      data: context
    });
  } catch (error) {
    console.error("Error getting certificate by id:", error);
    res.status(500).json({ message: "Failed to load certificate" });
  }
}

// Public HTML verification page
export async function renderCertificateVerificationPageController(req, res) {
  try {
    const { certificateId } = req.params;
    const record = await fetchCertificateVerificationRecord(certificateId);

    if (!record) {
      const notFoundContext = {
        certificate_id: certificateId,
        verification_status: "not_found",
        verification_status_label: "Not Found",
        organization_name: ORGANIZATION_NAME,
        verification_url: buildVerificationUrl(req, certificateId),
        linkedin_share_url: buildLinkedInShareUrl(buildVerificationUrl(req, certificateId))
      };

      res.status(404);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      return res.send(renderVerificationPageHtml(notFoundContext));
    }

    const context = await buildVerificationContext(record, req);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.send(renderVerificationPageHtml(context));
  } catch (error) {
    console.error("Error rendering verification page:", error);
    res.status(500).json({ message: "Failed to load verification page" });
  }
}

// Generate LinkedIn share URL for a certificate
export async function shareCertificateOnLinkedInController(req, res) {
  try {
    const { certificateId, certificate_id, credential_url } = req.body || {};
    const identifier = sanitizeInput(certificateId || certificate_id || "").trim();
    const directUrl = sanitizeInput(credential_url || "").trim();

    let shareCredentialUrl = directUrl;
    if (!shareCredentialUrl && identifier) {
      const record = await fetchCertificateVerificationRecord(identifier);
      if (record) {
        const context = await buildVerificationContext(record, req);
        shareCredentialUrl = context.credential_url;
      }
    }

    if (!shareCredentialUrl) {
      return res.status(400).json({
        message: "A certificate ID or credential URL is required"
      });
    }

    res.json({
      success: true,
      credential_url: shareCredentialUrl,
      linkedin_share_url: buildLinkedInShareUrl(shareCredentialUrl)
    });
  } catch (error) {
    console.error("Error building LinkedIn share URL:", error);
    res.status(500).json({ message: "Failed to build LinkedIn share URL" });
  }
}

// Generate certificate (admin only)
export async function generateCertificateController(req, res) {
  try {
    const {
      student_id,
      user_id,
      course_id,
      full_name,
      certificate_title,
      organization_name,
      expiry_date
    } = req.body || {};

    const resolvedUserId = student_id || user_id;
    
    if (!resolvedUserId || !course_id) {
      return res.status(400).json({ message: "student_id/user_id and course_id are required" });
    }

    // Check if certificate already exists
    const existingQuery = `
      SELECT id FROM certificates 
      WHERE COALESCE(student_id, user_id) = $1 AND course_id = $2
    `;
    const existingResult = await pool.query(existingQuery, [resolvedUserId, course_id]);
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ message: "Certificate already exists for this student and course" });
    }
    
    // Get student and course information
    const infoQuery = `
      SELECT 
        COALESCE(NULLIF(CONCAT_WS(' ', u.first_name, u.last_name), ''), u.name) as student_name,
        u.email as student_email,
        course.title as course_title,
        course.description as course_description
      FROM users u
      JOIN courses course ON course.id = $2
      WHERE u.id = $1
    `;
    
    const { rows } = await pool.query(infoQuery, [resolvedUserId, course_id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Student or course not found" });
    }
    
    const studentInfo = rows[0];
    const certificateId = generateCertificateIdentifier();
    const certificateCode = certificateId;
    const issueDate = new Date().toISOString();
    const certificateTitle = sanitizeInput(certificate_title || studentInfo.course_title || "Certificate of Completion");
    const recipientName = sanitizeInput(full_name || studentInfo.student_name || "Unknown Recipient");
    const issuerName = sanitizeInput(organization_name || ORGANIZATION_NAME);
    const verifyUrl = buildVerificationUrl(req, certificateId);
    const qrCodeUrl = await generateQrDataUrl(verifyUrl);
    
    // Generate certificate HTML
    const certificateData = {
      student_name: recipientName,
      course_title: certificateTitle,
      course_description: studentInfo.course_description,
      issue_date: formatDisplayDate(issueDate),
      certificate_code: certificateCode,
      qr_code_url: qrCodeUrl
    };
    
    const certificateHtml = populateCertificateTemplate(CERTIFICATE_TEMPLATE, certificateData);
    const credentialUrl = verifyUrl;
    
    // Insert certificate into database
    const insertQuery = `
      INSERT INTO certificates (
        user_id,
        student_id,
        course_id,
        certificate_id,
        full_name,
        certificate_title,
        organization_name,
        issue_date,
        issued_at,
        expiry_date,
        credential_url,
        certificate_url,
        qr_code_url,
        certificate_code,
        certificate_html,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'issued')
      RETURNING *
    `;
    
    const { rows: [certificate] } = await pool.query(insertQuery, [
      resolvedUserId,
      resolvedUserId,
      course_id,
      certificateId,
      recipientName,
      certificateTitle,
      issuerName,
      issueDate,
      issueDate,
      expiry_date || null,
      credentialUrl,
      credentialUrl,
      qrCodeUrl,
      certificateCode,
      certificateHtml
    ]);
    
    res.status(201).json({
      ...certificate,
      certificate_id: certificateId,
      certificate_code: certificateCode,
      full_name: recipientName,
      certificate_title: certificateTitle,
      organization_name: issuerName,
      credential_url: credentialUrl,
      qr_code_url: qrCodeUrl,
      verification_url: verifyUrl,
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
      WHERE DATE_TRUNC('month', COALESCE(issue_date, issued_at, created_at)) = DATE_TRUNC('month', CURRENT_DATE)
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
        COALESCE(NULLIF(CONCAT_WS(' ', u.first_name, u.last_name), ''), u.name) ILIKE $${paramIndex} OR 
        u.email ILIKE $${paramIndex} OR 
        course.title ILIKE $${paramIndex} OR 
        c.certificate_code ILIKE $${paramIndex} OR
        c.certificate_id ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${query}%`);
      paramIndex++;
    }
    
    if (course_id) {
      whereConditions.push(`c.course_id = $${paramIndex}`);
      queryParams.push(course_id);
      paramIndex++;
    }

    if (status) {
      if (String(status).toLowerCase() === "valid") {
        whereConditions.push(`COALESCE(c.status, 'issued') IN ('issued', 'valid')`);
      } else {
        whereConditions.push(`LOWER(COALESCE(c.status, '')) = LOWER($${paramIndex})`);
        queryParams.push(status);
        paramIndex++;
      }
    }
    
    if (date_from) {
      whereConditions.push(`COALESCE(c.issue_date, c.issued_at, c.created_at) >= $${paramIndex}`);
      queryParams.push(date_from);
      paramIndex++;
    }
    
    if (date_to) {
      whereConditions.push(`COALESCE(c.issue_date, c.issued_at, c.created_at) <= $${paramIndex}`);
      queryParams.push(date_to);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM certificates c
      LEFT JOIN users u ON u.id = COALESCE(c.user_id, c.student_id)
      LEFT JOIN courses course ON c.course_id = course.id
      ${whereClause}
    `;
    const { rows: [countResult] } = await pool.query(countQuery, queryParams);
    
    // Get certificates with pagination
    const offset = (page - 1) * limit;
    const searchQuery = `
      SELECT 
        c.id,
        COALESCE(c.certificate_id, c.certificate_code) AS certificate_id,
        COALESCE(c.certificate_code, c.certificate_id) AS certificate_code,
        COALESCE(c.issue_date, c.issued_at, c.created_at) AS issued_at,
        COALESCE(c.status, 'issued') AS status,
        COALESCE(c.credential_url, c.certificate_url) AS credential_url,
        COALESCE(NULLIF(CONCAT_WS(' ', u.first_name, u.last_name), ''), u.name) as student_name,
        u.email as student_email,
        course.title as course_title,
        course.description as course_description
      FROM certificates c
      LEFT JOIN users u ON u.id = COALESCE(c.user_id, c.student_id)
      LEFT JOIN courses course ON c.course_id = course.id
      ${whereClause}
      ORDER BY COALESCE(c.issue_date, c.issued_at, c.created_at) DESC
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
    const isNumericId = /^\d+$/.test(String(certificateId));
    
    const query = `
      UPDATE certificates 
      SET status = 'revoked', 
          revoked_at = CURRENT_TIMESTAMP,
          revoke_reason = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE ${isNumericId ? "id = $1" : "COALESCE(certificate_id, certificate_code) = $1"}
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
    const isNumericId = /^\d+$/.test(String(certificateId));
    
    const query = `
      SELECT certificate_html, certificate_pdf_url, certificate_code
      FROM certificates 
      WHERE ${isNumericId ? "id = $1" : "COALESCE(certificate_id, certificate_code) = $1"}
        AND status IN ('issued', 'valid')
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
export const getCertificateById = catchAsync(getCertificateByIdController);
export const renderCertificateVerificationPage = catchAsync(renderCertificateVerificationPageController);
export const shareCertificateOnLinkedIn = catchAsync(shareCertificateOnLinkedInController);
export const generateCertificate = catchAsync(generateCertificateController);
export const getCertificateStats = catchAsync(getCertificateStatsController);
export const searchCertificates = catchAsync(searchCertificatesController);
export const revokeCertificate = catchAsync(revokeCertificateController);
export const downloadCertificatePdf = catchAsync(downloadCertificatePdfController);
