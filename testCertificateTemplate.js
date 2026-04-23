const fs = require('fs');

// Test certificate template with logo
const certificateTemplate = `<!DOCTYPE html>
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
    <div class="student-name">John Doe</div>
    <div class="presented-text">has successfully completed the certified course</div>
    <div class="course-title">"Life Coaching Fundamentals"</div>
    <div class="course-description">Master the essential skills and techniques needed to become an effective life coach.</div>
    <div class="presented-text" style="margin-top: 25px;">Offered by Vialifecoach Global Foundation</div>
    <div class="logo-container">
      <img src="https://i.postimg.cc/dDPqTDcm/vialife.png" alt="Vialifecoach Logo" crossorigin="anonymous" referrerpolicy="no-referrer">
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
    <div class="certificate-id">Issued on: March 13, 2026 | Certificate ID: VLC-2024-DEMO-001</div>
  </div>
</div>
</body>
</html>`;

// Write the certificate to a file
fs.writeFileSync('test-certificate.html', certificateTemplate);
console.log('✅ Certificate template with logo created: test-certificate.html');
console.log('📄 Open this file in your browser to see the certificate with proper logo display!');
