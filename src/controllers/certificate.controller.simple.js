// Simple certificate controller for CommonJS compatibility
const crypto = require("crypto");

// Simple certificate template with logo
const CERTIFICATE_TEMPLATE = `<!DOCTYPE html>
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
        .logo-container img { 
            width: 140px; 
            height: auto; 
            border: 3px solid #FFD700;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            background: white;
            padding: 8px;
        }
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
      <div style="background: linear-gradient(135deg, #1F2A44, #2C3E50); color: white; padding: 20px 30px; font-weight: bold; font-size: 18px; border-radius: 12px; border: 3px solid #FFD700; box-shadow: 0 6px 12px rgba(0,0,0,0.3); display: inline-block; font-family: 'Playfair Display', serif; letter-spacing: 2px;">
        VIALIFECOACH
      </div>
    </div>
    <div class="foundation-name">VIALIFECOACH GLOBAL FOUNDATION</div>
    <div class="certificate-title">CERTIFICATE OF COMPLETION</div>
    <div class="divider"></div>
    <div class="presented-text">This is to proudly certify that</div>
    <div class="student-name">{{STUDENT_NAME}}</div>
    <div class="presented-text">has successfully completed the certified course</div>
    <div class="course-title">{{COURSE_TITLE}}</div>
    <div class="course-description">{{COURSE_DESCRIPTION}}</div>
    <div class="presented-text" style="margin-top: 25px;">Offered by Vialifecoach Global Foundation</div>
    <div class="logo-container">
      <div style="background: linear-gradient(135deg, #1F2A44, #2C3E50); color: white; padding: 20px 30px; font-weight: bold; font-size: 18px; border-radius: 12px; border: 3px solid #FFD700; box-shadow: 0 6px 12px rgba(0,0,0,0.3); display: inline-block; font-family: 'Playfair Display', serif; letter-spacing: 2px;">
        VIALIFECOACH
      </div>
    </div>
    <div class="footer-section">
      <div>
        <div class="signature-name">Simon Pierre Gahibare</div>
        <div class="signature-title">Founder & Certified Mental Health Coach</div>
      </div>
      <div>
        <div style="font-size:12px;">Scan to Verify</div>
      </div>
    </div>
    <div class="certificate-id">Issued on: {{ISSUE_DATE}} | Certificate ID: {{CERTIFICATE_CODE}}</div>
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

// Replace placeholders in certificate template
function populateCertificateTemplate(template, data) {
  return template
    .replace(/{{STUDENT_NAME}}/g, data.student_name)
    .replace(/{{COURSE_TITLE}}/g, data.course_title)
    .replace(/{{COURSE_DESCRIPTION}}/g, data.course_description)
    .replace(/{{ISSUE_DATE}}/g, data.issue_date)
    .replace(/{{CERTIFICATE_CODE}}/g, data.certificate_code)
    .replace(/{{QR_CODE_URL}}/g, data.qr_code_url);
}

// Get certificate preview (public)
async function getCertificatePreviewController(req, res) {
  try {
    // Return template with sample data for preview
    const sampleData = {
      student_name: "John Doe",
      course_title: "Life Coaching Fundamentals",
      course_description: "Master the essential skills and techniques needed to become an effective life coach.",
      issue_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      certificate_code: "VLC-2024-DEMO-001",
      qr_code_url: "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://vialifecoach.com/verify/VLC-2024-DEMO-001"
    };
    
    const certificateHtml = populateCertificateTemplate(CERTIFICATE_TEMPLATE, sampleData);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(certificateHtml);
  } catch (error) {
    console.error("Error getting certificate preview:", error);
    res.status(500).json({ message: "Failed to load certificate preview" });
  }
}

// Simple wrapper for async functions
function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Wrapped exports for Express
const getCertificatePreview = catchAsync(getCertificatePreviewController);

module.exports = {
  getCertificatePreview
};
