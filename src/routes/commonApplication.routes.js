import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { authenticateToken, requireRoles } from "../middlewares/auth.middleware.js";
import { 
  saveCommonApplication, 
  getCommonApplication,
  createCommonApplicationsTable,
  ensureRecommendationRequestsTable
} from "../controllers/commonApplication.controller.js";
import { hasDatabaseConfig, pool } from "../config/postgres.js";
import { sendEmail } from "../services/email.service.js";
import { generateAdmissionPdfBuffer } from "../services/pdf.service.js";
import { generateAdmissionDocxBuffer } from "../services/docx.service.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const PROGRAM_STATUS = {
  OPEN: "open",
  CLOSED: "closed",
  COMING_SOON: "coming_soon",
};

function normalizeProgramStatus(input) {
  if (input === undefined || input === null) return null;
  const raw = String(input).trim().toLowerCase();
  if (!raw) return null;
  if (["open", "opened", "start", "started", "start_program", "start-program", "active"].includes(raw)) {
    return PROGRAM_STATUS.OPEN;
  }
  if (["closed", "close", "inactive", "ended", "end"].includes(raw)) {
    return PROGRAM_STATUS.CLOSED;
  }
  if (["coming_soon", "coming-soon", "soon"].includes(raw)) {
    return PROGRAM_STATUS.COMING_SOON;
  }
  return raw;
}

function parseDateStart(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T00:00:00`);
  }
  return new Date(raw);
}

function parseDateEnd(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T23:59:59.999`);
  }
  return new Date(raw);
}

function deriveApplicationStatus(row, now = new Date()) {
  const normalized = normalizeProgramStatus(row?.status);
  if (normalized === PROGRAM_STATUS.OPEN || normalized === PROGRAM_STATUS.CLOSED || normalized === PROGRAM_STATUS.COMING_SOON) {
    return normalized;
  }

  if (row?.open_date) {
    const openAt = parseDateStart(row.open_date);
    if (now < openAt) return PROGRAM_STATUS.COMING_SOON;
  }

  if (row?.deadline) {
    const deadlineAt = parseDateEnd(row.deadline);
    if (now > deadlineAt) return PROGRAM_STATUS.CLOSED;
  }

  return PROGRAM_STATUS.OPEN;
}

// ======== PROGRAMS (GF) ========
const DEFAULT_PROGRAMS = [
  {
    code: "wrrp",
    name: "Women Refugee Rise Program",
    description: "Empowering women refugees through education and mentorship",
    type: "scholarship",
    location: "Remote",
    status: "active"
  },
  {
    code: "gbv",
    name: "GVB Healing Program",
    description: "Technology-based healing and support for GBV survivors",
    type: "therapeutic",
    location: "Remote",
    status: "active"
  },
  {
    code: "ilp",
    name: "Inner Leadership Program",
    description: "Developing inner leadership skills for personal growth",
    type: "leadership",
    location: "Remote",
    status: "active"
  },
  {
    code: "bmp",
    name: "Business Mentorship Program",
    description: "Business skills and mentorship for entrepreneurs",
    type: "business",
    location: "Remote",
    status: "active"
  }
];

async function ensureProgramsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS programs (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      type TEXT,
      location TEXT,
      open_date DATE,
      deadline DATE,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Add missing columns if table existed earlier
  await pool.query(`ALTER TABLE programs ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;`);
  await pool.query(`ALTER TABLE programs ADD COLUMN IF NOT EXISTS description TEXT;`);
  await pool.query(`ALTER TABLE programs ADD COLUMN IF NOT EXISTS type TEXT;`);
  await pool.query(`ALTER TABLE programs ADD COLUMN IF NOT EXISTS location TEXT;`);
  await pool.query(`ALTER TABLE programs ADD COLUMN IF NOT EXISTS open_date DATE;`);
  await pool.query(`ALTER TABLE programs ADD COLUMN IF NOT EXISTS deadline DATE;`);

  const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM programs`);
  if ((rows[0]?.total || 0) === 0) {
    for (const program of DEFAULT_PROGRAMS) {
      await pool.query(
        `INSERT INTO programs (code, name, description, type, location, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (name) DO NOTHING`,
        [program.code, program.name, program.description, program.type, program.location, program.status]
      );
    }
  }
}

async function bootstrapCommonApplicationTables() {
  if (!hasDatabaseConfig) {
    console.warn('Skipping common application table bootstrap because database config is missing.');
    return;
  }

  try {
    await createCommonApplicationsTable();
    await ensureRecommendationRequestsTable();
    await ensureProgramsTable();
  } catch (error) {
    console.error('Error initializing common application tables:', error);
  }
}

// Initialize tables on startup without letting connection failures crash the app.
void bootstrapCommonApplicationTables();

// Get available programs (public endpoint)
router.get("/programs", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT code, name, description, type, location, open_date, deadline, status
      FROM programs
      ORDER BY name
    `);
    const programs = rows.map(row => ({
      applicationStatus: deriveApplicationStatus(row),
      isOpen: deriveApplicationStatus(row) === PROGRAM_STATUS.OPEN,
      id: row.code,
      code: row.code,
      name: row.name,
      description: row.description,
      type: row.type,
      location: row.location,
      openDate: row.open_date,
      deadline: row.deadline,
      status: row.status
    }));
    res.set("Cache-Control", "no-store");
    res.json({ success: true, data: programs });
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(200).json({ success: true, data: [] });
  }
});

// Admin: list programs (include inactive)
router.get("/admin/programs", authenticateToken, requireRoles("admin"), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, code, name, description, type, location, open_date, deadline, status
      FROM programs
      ORDER BY name
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching admin programs:", error);
    res.status(500).json({ success: false, error: "Failed to fetch programs" });
  }
});

async function handleUpdateProgram(req, res) {
  try {
    const { code } = req.params;
    const {
      name,
      description,
      type,
      location,
      openDate,
      open_date,
      deadline,
      status,
      applicationStatus,
      action,
      isOpen,
      startProgram,
      closeProgram
    } = req.body || {};
    const normalizedOpenDate = openDate || open_date || null;
    const programKey = String(code || "").trim();
    const normalizedStatus =
      startProgram === true
        ? PROGRAM_STATUS.OPEN
        : closeProgram === true
        ? PROGRAM_STATUS.CLOSED
        : isOpen === true
        ? PROGRAM_STATUS.OPEN
        : isOpen === false
        ? PROGRAM_STATUS.CLOSED
        : normalizeProgramStatus(status ?? applicationStatus ?? action);

    const { rows } = await pool.query(
      `UPDATE programs
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           type = COALESCE($3, type),
           location = COALESCE($4, location),
           open_date = COALESCE($5, open_date),
           deadline = COALESCE($6, deadline),
           status = COALESCE($7, status),
           updated_at = NOW()
       WHERE code = $8 OR name = $8 OR id::text = $8
       RETURNING id, code, name, description, type, location, open_date, deadline, status`,
      [name || null, description || null, type || null, location || null, normalizedOpenDate, deadline || null, normalizedStatus || null, programKey]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Program not found" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).json({ success: false, error: "Failed to update program" });
  }
}

// Admin: update program (deadline, description, etc)
router.put("/admin/programs/:code", authenticateToken, requireRoles("admin"), handleUpdateProgram);
router.patch("/admin/programs/:code", authenticateToken, requireRoles("admin"), handleUpdateProgram);

// Debug endpoint (no auth required for testing)
router.get("/debug", (req, res) => {
  console.log('🔍 Debug endpoint hit - Headers:', req.headers);
  console.log('🔍 Debug endpoint hit - Method:', req.method);
  console.log('🔍 Debug endpoint hit - URL:', req.originalUrl);
  res.json({ 
    message: "Debug endpoint working!", 
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

// Debug POST endpoint (no auth required for testing)
router.post("/debug-post", (req, res) => {
  console.log('🔍 Debug POST endpoint hit - Body:', req.body);
  console.log('🔍 Debug POST endpoint hit - Headers:', req.headers);
  res.json({ 
    message: "Debug POST endpoint working!", 
    received: req.body,
    timestamp: new Date().toISOString()
  });
});

const PROGRAMS_BY_ID = {
  wrrp: "Women Refugee Rise Program",
  gbv: "GVB Healing Program",
  ilp: "Inner Leadership Program",
  bmp: "Business Mentorship Program"
};

// Support legacy/numeric IDs coming from the frontend mock list
const PROGRAM_ID_ALIASES = {
  "1": "wrrp",
  "2": "gbv",
  "3": "bmp"
};

// Apply to a program
router.post("/applications/apply", authenticateToken, async (req, res) => {
  try {
    const { programId } = req.body;
    const userId = req.user.id;

    if (!programId) {
      return res.status(400).json({ success: false, error: "Program ID is required" });
    }

    const normalizedProgramId = PROGRAM_ID_ALIASES[programId] || programId;

    // Enforce open date + deadline before submission
    const { rows: deadlineRows } = await pool.query(
      `SELECT open_date, deadline, status FROM programs WHERE code = $1 OR name = $2 LIMIT 1`,
      [normalizedProgramId, PROGRAMS_BY_ID[normalizedProgramId] || normalizedProgramId]
    );
    const programRow = deadlineRows[0] || null;
    const openDate = programRow?.open_date;
    const deadline = programRow?.deadline;
    const programStatus = programRow?.status;
    const now = new Date();
    const derivedStatus = deriveApplicationStatus({ open_date: openDate, deadline, status: programStatus }, now);
    if (derivedStatus === PROGRAM_STATUS.CLOSED) {
      return res.status(403).json({ success: false, error: "Applications are closed." });
    }
    if (derivedStatus === PROGRAM_STATUS.COMING_SOON) {
      return res.status(403).json({ success: false, error: "Applications are not open yet." });
    }
    if (openDate) {
      const openAt = parseDateStart(openDate);
      if (now < openAt) {
        return res.status(403).json({ success: false, error: "Applications are not open yet." });
      }
    }
    if (deadline) {
      const deadlineDate = parseDateEnd(deadline);
      if (now > deadlineDate) {
        return res.status(403).json({ success: false, error: "Application deadline has passed." });
      }
    }

    // In a real application, you would:
    // 1. Check if user has already applied to this program
    // 2. Get the user's complete application data
    // 3. Create an application record
    // 4. Send confirmation emails
    // 5. Update program statistics

    const submittedAt = new Date().toISOString();
    const incomingData = req.body.applicationData || {};

    // Load existing common application (if any)
    const existing = await pool.query(
      "SELECT id, application_data FROM common_applications WHERE user_id = $1",
      [userId]
    );

    const existingData = existing.rows[0]?.application_data || {};
    const mergedData = {
      ...existingData,
      ...incomingData,
      status: "submitted",
      programId: incomingData.programId || existingData.programId || normalizedProgramId,
      programSelection: incomingData.programSelection || existingData.programSelection || {
        firstChoice: PROGRAMS_BY_ID[normalizedProgramId] || normalizedProgramId,
        programId: normalizedProgramId
      },
      submission: {
        ...(existingData.submission || {}),
        ...(incomingData.submission || {}),
        status: "submitted",
        programId: normalizedProgramId,
        submittedAt: submittedAt
      }
    };

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE common_applications 
         SET application_data = $1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2`,
        [JSON.stringify(mergedData), userId]
      );
    } else {
      await pool.query(
        `INSERT INTO common_applications (user_id, application_data, created_at, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [userId, JSON.stringify(mergedData)]
      );
    }

    res.json({
      success: true,
      message: "Application submitted successfully!",
      data: {
        id: existing.rows[0]?.id ? `APP${existing.rows[0].id}` : `APP${Date.now()}`,
        userId,
        programId: normalizedProgramId,
        status: "submitted",
        submittedAt: submittedAt
      }
    });
  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to submit application" 
    });
  }
});

// Save common application data
router.post("/common/save", authenticateToken, saveCommonApplication);

// Get user's common application
router.get("/common/me", authenticateToken, getCommonApplication);

// Get user's submitted applications (used by Application Dashboard)
router.get("/applications/my", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT id, application_data, created_at, updated_at
       FROM common_applications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const applications = result.rows.map(row => {
      const data = row.application_data || {};
      const submission = data.submission || {};
      const programId =
        submission.programId ||
        data.programSelection?.programId ||
        data.programSelection?.firstChoiceId ||
        data.programId ||
        "";
      const title =
        data.programSelection?.firstChoice ||
        data.programName ||
        PROGRAMS_BY_ID[programId] ||
        "Program Application";
      const status = data.status || submission.status || "unsubmitted";
      const submittedDate = submission.submittedAt || data.submittedAt || row.created_at;
      const lastUpdated = row.updated_at || submittedDate;

      return {
        id: `APP${row.id}`,
        title,
        status,
        submittedDate,
        lastUpdated,
        programId,
        applicationData: data
      };
    });

    // Frontend expects a raw array
    res.json(applications);
  } catch (error) {
    console.error("Error fetching user applications:", error);
    // Fail soft to avoid crashing the dashboard UI
    res.status(200).json([]);
  }
});

// Public search for applicants by email or reference number
router.get("/applications/search", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim();
    const reference = String(req.query.reference || "").trim();

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    const referenceMatch = reference.match(/\d+/g);
    const referenceId = referenceMatch ? referenceMatch[referenceMatch.length - 1] : null;
    if (referenceId) {
      conditions.push(`a.id = $${paramIndex++}`);
      params.push(Number(referenceId));
    }

    if (email) {
      conditions.push(`
        LOWER(COALESCE(
          a.application_data->'accountCreation'->>'email',
          a.application_data->'personalInfo'->>'email',
          u.email,
          ''
        )) LIKE $${paramIndex++}
      `);
      params.push(`%${email.toLowerCase()}%`);
    }

    if (conditions.length === 0) {
      return res.json([]);
    }

    const query = `
      SELECT 
        a.id, a.application_data, a.created_at, a.updated_at,
        u.name, u.email
      FROM common_applications a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE ${conditions.join(" OR ")}
      ORDER BY a.created_at DESC
      LIMIT 20
    `;

    const { rows } = await pool.query(query, params);

    const results = rows.map(row => {
      const data = row.application_data || {};
      const submission = data.submission || {};
      const programId =
        submission.programId ||
        data.programSelection?.programId ||
        data.programSelection?.firstChoiceId ||
        data.programId ||
        "";
      const programName =
        data.programSelection?.firstChoice ||
        data.programName ||
        PROGRAMS_BY_ID[programId] ||
        "Program";
      const status = data.status || submission.status || "submitted";
      const submittedDate = submission.submittedAt || data.submittedAt || row.created_at;

      const fullName =
        data.personalInfo?.name ||
        (data.personalInfo?.firstName && data.personalInfo?.lastName
          ? `${data.personalInfo.firstName} ${data.personalInfo.lastName}`
          : null) ||
        data.accountCreation?.name ||
        row.name ||
        "Unknown";

      const applicantEmail =
        data.accountCreation?.email ||
        data.personalInfo?.email ||
        row.email ||
        "";

      return {
        id: `APP${row.id}`,
        submittedDate,
        lastUpdated: row.updated_at || submittedDate,
        status,
        fullName,
        email: applicantEmail,
        referenceNumber: `APP${row.id}`,
        programName,
        applicationData: data
      };
    });

    res.json(results);
  } catch (error) {
    console.error("Error searching applications:", error);
    res.status(200).json([]);
  }
});

// Get recommendation request by token (public)
router.get("/recommendations/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { rows } = await pool.query(
      `SELECT r.*, a.application_data
       FROM recommendation_requests r
       LEFT JOIN common_applications a ON r.application_id = a.id
       WHERE r.token = $1`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Recommendation request not found" });
    }

    const row = rows[0];
    const data = row.application_data || {};
    const applicantName =
      data.personalInfo?.name ||
      (data.personalInfo?.firstName && data.personalInfo?.lastName
        ? `${data.personalInfo.firstName} ${data.personalInfo.lastName}`
        : null) ||
      data.accountCreation?.name ||
      "Applicant";
    const programName =
      data.programSelection?.firstChoice ||
      data.programName ||
      "Program";

    res.json({
      success: true,
      data: {
        id: row.id,
        token: row.token,
        status: row.status,
        recommenderName: row.recommender_name,
        recommenderEmail: row.recommender_email,
        applicantName,
        programName,
        submittedAt: row.submitted_at,
        responseText: row.response_text,
        responseFileUrl: row.response_file_url
      }
    });
  } catch (error) {
    console.error("Error fetching recommendation request:", error);
    res.status(500).json({ success: false, error: "Failed to fetch recommendation request" });
  }
});

// Upload recommendation file (public)
router.post("/recommendations/:token/upload", upload.single("file"), async (req, res) => {
  try {
    const { token } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const { rows } = await pool.query(
      `SELECT id FROM recommendation_requests WHERE token = $1`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Recommendation request not found" });
    }

    const uploadsDir = path.join(process.cwd(), "uploads", "recommendations");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(req.file.originalname || "");
    const filename = `rec-${token}-${Date.now()}${ext || ""}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);

    const fileUrl = `/uploads/recommendations/${filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error("Error uploading recommendation file:", error);
    res.status(500).json({ success: false, error: "Failed to upload file" });
  }
});

// Submit recommendation (public)
router.post("/recommendations/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { message, fileUrl } = req.body || {};

    const { rows } = await pool.query(
      `UPDATE recommendation_requests
       SET response_text = $1,
           response_file_url = $2,
           status = 'submitted',
           submitted_at = NOW()
       WHERE token = $3
       RETURNING *`,
      [message || null, fileUrl || null, token]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Recommendation request not found" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error submitting recommendation:", error);
    res.status(500).json({ success: false, error: "Failed to submit recommendation" });
  }
});

// Admin endpoints
router.get("/admin/applications", authenticateToken, requireRoles("admin"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, application_data, created_at, updated_at
      FROM common_applications
      WHERE COALESCE(application_data->>'status', '') <> 'deleted'
      ORDER BY created_at DESC
    `);
    
    const applications = result.rows.map(row => ({
      id: `APP${row.id}`,
      submittedAt: row.created_at,
      applicant: {
        name: row.application_data?.personalInfo?.name || 'Unknown',
        email: row.application_data?.accountCreation?.email || 'unknown@example.com',
        phone: row.application_data?.personalInfo?.phone || '',
        age: parseInt(row.application_data?.personalInfo?.age) || 0,
        nationality: row.application_data?.personalInfo?.nationality || '',
        refugeeStatus: row.application_data?.personalInfo?.refugeeStatus || '',
        essays: {
          personalStatement: row.application_data?.personalStatement?.motivation || '',
          motivationEssay: row.application_data?.personalStatement?.goals || '',
          futureGoalsEssay: row.application_data?.personalStatement?.programFit || ''
        }
      },
      program: {
        name: row.application_data?.programSelection?.firstChoice || 'Unknown Program',
        type: 'scholarship'
      },
      status: row.application_data?.status || 'unsubmitted',
      priority: 'medium',
      documents: {
        offerLetter: '',
        idDocument: row.application_data?.supportingDocuments?.idDocument || '',
        cvResume: row.application_data?.supportingDocuments?.resume || '',
        recommendationLetters: [],
        certificates: [],
        essays: []
      },
      reviewNotes: '',
      reviewedBy: '',
      reviewedAt: '',
      admissionNumber: '',
      orderNumber: '',
      admissionDate: '',
      finalDecision: '',
      decisionDate: ''
    }));
    
    res.json({ success: true, data: applications });
  } catch (error) {
    console.error("Error fetching applications:", error);
    // Fail soft to avoid breaking admin UI if DB is unavailable.
    res.status(200).json({ 
      success: true, 
      data: [], 
      warning: "Applications unavailable (database error). Check backend logs."
    });
  }
});

router.get("/admin/applications/stats", authenticateToken, requireRoles("admin"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT application_data FROM common_applications
      WHERE COALESCE(application_data->>'status', '') <> 'deleted'
    `);
    const rows = result.rows || [];
    const total = rows.length;
    const countByStatus = rows.reduce((acc, row) => {
      const status = row.application_data?.status || 'unsubmitted';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    const stats = {
      total,
      pending: countByStatus.pending || 0,
      underReview: countByStatus.under_review || 0,
      approved: countByStatus.approved || 0,
      rejected: countByStatus.rejected || 0,
      waitlisted: countByStatus.waitlisted || 0,
      shortlisted: countByStatus.shortlisted || 0,
      admitted: countByStatus.admitted || 0,
      unsubmitted: countByStatus.unsubmitted || 0,
      thisWeek: total
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

// Test endpoint to verify admin routes are working
router.get("/admin/test", authenticateToken, requireRoles("admin"), (req, res) => {
  console.log('🔍 Admin test route hit - User:', req.user);
  res.json({ 
    message: "Admin application routes are working!", 
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Test email endpoint (no auth required for debugging - REMOVE THIS IN PRODUCTION)
router.post("/admin/test-email", (req, res) => {
  console.log('🔍 Test email endpoint hit:', req.body);
  res.json({ 
    message: "Test email endpoint working!", 
    received: req.body,
    timestamp: new Date().toISOString()
  });
});

// Update application status
router.patch("/admin/applications/:id/status", authenticateToken, requireRoles("admin"), async (req, res) => {
  try {
    console.log('🔍 Status update request received:', {
      params: req.params,
      body: req.body,
      user: req.user
    });
    
    const { id } = req.params;
    const { status, reviewedAt, reviewedBy } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'under_review', 'shortlisted', 'waitlisted', 'approved', 'admitted', 'rejected', 'deleted'];
    if (!validStatuses.includes(status)) {
      console.log('❌ Invalid status:', status);
      return res.status(400).json({ success: false, error: "Invalid status" });
    }
    
    // Extract numeric ID from application ID (e.g., APP123 -> 123)
    const numericId = String(id || '').replace('APP', '');
    console.log('🔍 Extracted numeric ID:', numericId);
    
    // Check if application exists first
    const checkQuery = 'SELECT id, application_data FROM common_applications WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [numericId]);
    console.log('🔍 Application exists:', checkResult.rows.length > 0);
    
    if (checkResult.rows.length === 0) {
      console.log('❌ Application not found with ID:', numericId);
      return res.status(404).json({ success: false, error: "Application not found" });
    }
    
    if (status === 'deleted') {
      const deleteResult = await pool.query(
        `DELETE FROM common_applications
         WHERE id = $1
         RETURNING id, application_data, created_at, updated_at`,
        [numericId]
      );

      if (deleteResult.rows.length === 0) {
        console.log('❌ Delete failed - no rows returned');
        return res.status(404).json({ success: false, error: "Application not found" });
      }

      const deletedRow = deleteResult.rows[0];
      const deletedApplication = {
        id: `APP${deletedRow.id}`,
        submittedAt: deletedRow.created_at,
        applicant: {
          name: deletedRow.application_data?.personalInfo?.name || 'Unknown',
          email: deletedRow.application_data?.accountCreation?.email || 'unknown@example.com',
          phone: deletedRow.application_data?.personalInfo?.phone || '',
          age: parseInt(deletedRow.application_data?.personalInfo?.age) || 0,
          nationality: deletedRow.application_data?.personalInfo?.nationality || '',
          refugeeStatus: deletedRow.application_data?.personalInfo?.refugeeStatus || '',
          essays: {
            personalStatement: deletedRow.application_data?.personalStatement?.motivation || '',
            motivationEssay: deletedRow.application_data?.personalStatement?.goals || '',
            futureGoalsEssay: deletedRow.application_data?.personalStatement?.programFit || ''
          }
        },
        program: {
          name: deletedRow.application_data?.programSelection?.firstChoice || 'Unknown Program',
          type: 'scholarship'
        },
        status: 'deleted',
        priority: 'medium',
        documents: {
          offerLetter: '',
          idDocument: deletedRow.application_data?.supportingDocuments?.idDocument || '',
          cvResume: deletedRow.application_data?.supportingDocuments?.resume || '',
          recommendationLetters: [],
          certificates: [],
          essays: []
        },
        reviewNotes: '',
        reviewedBy: reviewedBy || 'Admin User',
        reviewedAt: reviewedAt || new Date().toISOString(),
        admissionNumber: '',
        orderNumber: '',
        admissionDate: '',
        finalDecision: '',
        decisionDate: ''
      };

      console.log('✅ Application deleted:', deletedApplication.id);
      return res.json({ success: true, data: deletedApplication, deleted: true });
    }

    // Update application status in database
    const updateQuery = `
      UPDATE common_applications 
      SET application_data = application_data || $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, application_data, created_at, updated_at
    `;
    
    const updateData = {
      status: status,
      reviewedAt: reviewedAt || new Date().toISOString(),
      reviewedBy: reviewedBy || 'Admin User'
    };
    
    console.log('🔍 Updating with data:', updateData);
    
    const result = await pool.query(updateQuery, [JSON.stringify(updateData), numericId]);
    
    if (result.rows.length === 0) {
      console.log('❌ Update failed - no rows returned');
      return res.status(404).json({ success: false, error: "Application not found" });
    }
    
    console.log('✅ Update successful, rows affected:', result.rows.length);
    
    const updatedRow = result.rows[0];
    
    // Format the response to match the expected structure
    const updatedApplication = {
      id: `APP${updatedRow.id}`,
      submittedAt: updatedRow.created_at,
      applicant: {
        name: updatedRow.application_data?.personalInfo?.name || 'Unknown',
        email: updatedRow.application_data?.accountCreation?.email || 'unknown@example.com',
        phone: updatedRow.application_data?.personalInfo?.phone || '',
        age: parseInt(updatedRow.application_data?.personalInfo?.age) || 0,
        nationality: updatedRow.application_data?.personalInfo?.nationality || '',
        refugeeStatus: updatedRow.application_data?.personalInfo?.refugeeStatus || '',
        essays: {
          personalStatement: updatedRow.application_data?.personalStatement?.motivation || '',
          motivationEssay: updatedRow.application_data?.personalStatement?.goals || '',
          futureGoalsEssay: updatedRow.application_data?.personalStatement?.programFit || ''
        }
      },
      program: {
        name: updatedRow.application_data?.programSelection?.firstChoice || 'Unknown Program',
        type: 'scholarship'
      },
      status: status,
      priority: 'medium',
      documents: {
        offerLetter: '',
        idDocument: updatedRow.application_data?.supportingDocuments?.idDocument || '',
        cvResume: updatedRow.application_data?.supportingDocuments?.resume || '',
        recommendationLetters: [],
        certificates: [],
        essays: []
      },
      reviewNotes: '',
      reviewedBy: reviewedBy || 'Admin User',
      reviewedAt: reviewedAt || new Date().toISOString(),
      admissionNumber: '',
      orderNumber: '',
      admissionDate: '',
      finalDecision: '',
      decisionDate: ''
    };
    
    console.log('✅ Sending response:', updatedApplication);
    res.json({ success: true, data: updatedApplication });
  } catch (error) {
    console.error("❌ Error updating application status:", error);
    res.status(500).json({ success: false, error: "Failed to update application status" });
  }
});

// Send email endpoint (TEMPORARILY REMOVED AUTH FOR DEBUGGING - ADD BACK IN PRODUCTION)
router.post("/admin/applications/send-email", async (req, res) => {
  try {
    console.log('🔍 Email send request received:', {
      body: req.body,
      headers: req.headers
    });
    
    const { applicationId, to, subject, content, templateName, sentBy, status, admissionMeta, pdfHtml } = req.body;
    
    // Validate required fields
    if (!to || !subject || !content) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields: to, subject, content" 
      });
    }
    
    // Send the email using configured provider (Zoho/Gmail)
    let emailText = String(content || "");
    let htmlContent = String(content || "").replace(/\n/g, "<br/>");

    if (templateName === "Admission Letter") {
      emailText = `Dear Applicant,

Congratulations! 🎉 We are pleased to inform you that your application has been successful, and you have been accepted into the program.

Please find your Letter of Admission attached to this email. You will need to download the document and upload it to your program login portal for verification as part of the next step in the process. 

Kindly ensure you complete this requirement as soon as possible to avoid any delays in your enrollment. 

If you encounter any challenges or require further clarification, feel free to reach out. We are happy to assist you.

Once again, congratulations on your achievement, and we look forward to your participation.  

Best regards,
Program Director  
Vialfecoach Global Foundation`;
      htmlContent = emailText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>");
    }

    let attachments = undefined;
    if (templateName === "Admission Letter") {
      const programName = admissionMeta?.programName || "the program";
      emailText = emailText.replace(
        "accepted into the program.",
        `accepted into the ${programName} program.`
      );
      htmlContent = emailText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>");

      const htmlAttachment = pdfHtml || content || "";
      const safeName = (admissionMeta?.applicantName || "Applicant").replace(/[^a-z0-9]+/gi, "_");
      const filename = `Vialifecoach_Admission_${safeName}_${Date.now()}.html`;
      const docxFilename = `Vialifecoach_Admission_${safeName}_${Date.now()}.docx`;

      const uploadsDir = path.join(process.cwd(), "uploads", "admissions");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, htmlAttachment, "utf-8");

      const docxBuffer = await generateAdmissionDocxBuffer(htmlAttachment);
      const docxPath = path.join(uploadsDir, docxFilename);
      fs.writeFileSync(docxPath, docxBuffer);

      attachments = [
        {
          filename: docxFilename,
          path: docxPath,
          contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          contentDisposition: "attachment"
        },
        {
          filename,
          path: filePath,
          contentType: "text/html; charset=utf-8",
          contentDisposition: "attachment"
        }
      ];
    }

    const emailInfo = await sendEmail({
      to,
      subject,
      text: emailText,
      html: htmlContent,
      from: "support",
      replyTo: "academy@vialifecoach.org",
      attachments
    });

    // Optionally update application status when status is provided
    if (applicationId && status) {
      const numericId = String(applicationId).replace("APP", "");
      const updateData = {
        status: status,
        reviewedAt: new Date().toISOString(),
        reviewedBy: sentBy || 'Admin User'
      };

      await pool.query(
        `UPDATE common_applications 
         SET application_data = application_data || $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [JSON.stringify(updateData), numericId]
      );
    }

    const emailLog = {
      id: `EMAIL${Date.now()}`,
      applicationId: applicationId || 'N/A',
      to,
      subject,
      templateName: templateName || 'Custom',
      sentBy: sentBy || 'Admin User',
      sentAt: new Date().toISOString(),
      provider: "smtp",
      messageId: emailInfo?.messageId || null
    };
    
    console.log('✅ Email sent:', emailLog);
    
    res.json({ 
      success: true, 
      message: "Email sent successfully",
      data: emailLog
    });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to send email",
      details: error?.message || String(error)
    });
  }
});

export default router;

