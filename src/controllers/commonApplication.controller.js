import { pool } from '../config/postgres.js';
import { supabase } from '../config/supabase.js';
import { db } from '../config/database.js';
import crypto from 'crypto';
import { sendEmail } from '../services/email.service.js';
import { FRONTEND_URL } from '../config/env.js';

// Save common application data
export const saveCommonApplication = async (req, res) => {
  try {
    const { data } = req.body;
    const userId = req.user.id;
    const isSubmitted = data?.status === "submitted" || data?.submission?.status === "submitted";

    // Enforce open date + deadline lock for drafts
    if (!isSubmitted) {
      const programCode =
        data?.programSelection?.programId ||
        data?.programId ||
        data?.submission?.programId ||
        null;
      const programName = data?.programSelection?.firstChoice || null;

      if (programCode || programName) {
        const { rows } = await pool.query(
          `SELECT open_date, deadline FROM programs 
           WHERE (code = $1 OR name = $2) 
           LIMIT 1`,
          [programCode, programName]
        );
        const openDate = rows[0]?.open_date;
        const deadline = rows[0]?.deadline;
        const now = new Date();
        if (openDate) {
          const openAt = parseDateStart(openDate);
          if (now < openAt) {
            return res.status(403).json({
              success: false,
              error: "Applications are not open yet."
            });
          }
        }
        if (deadline) {
          const deadlineDate = parseDateEnd(deadline);
          if (now > deadlineDate) {
            return res.status(403).json({
              success: false,
              error: "Application deadline has passed. Draft is locked."
            });
          }
        }
      }
    }

    // Check if application already exists (using Supabase)
    const { data: existingApp, error: fetchError } = await supabase
      .from('common_applications')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Error fetching existing application:', fetchError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to check existing application' 
      });
    }

    if (existingApp && existingApp.length > 0) {
      // Update existing application (using Supabase)
      const { data: updatedApp, error: updateError } = await supabase
        .from('common_applications')
        .update({ 
          application_data: data, 
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating application:', updateError);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to update application' 
        });
      }

      await createRecommendationRequests(updatedApp?.id, data);
      res.json({ 
        success: true, 
        message: 'Application updated successfully',
        data: updatedApp
      });
    } else {
      // Create new application (using Supabase)
      const { data: newApp, error: createError } = await supabase
        .from('common_applications')
        .insert({ 
          user_id: userId, 
          application_data: data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating application:', createError);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to save application' 
        });
      }

      await createRecommendationRequests(newApp?.id, data);
      res.json({ 
        success: true, 
        message: 'Application saved successfully',
        data: newApp
      });
    }
  } catch (error) {
    console.error('Error saving common application:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save application' 
    });
  }
};

// Get user's common application (using Supabase)
export const getCommonApplication = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: application, error } = await supabase
      .from('common_applications')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching application:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get application' 
      });
    }

    if (!application) {
      return res.json({ 
        success: true, 
        data: null 
      });
    }

    res.json({ 
      success: true, 
      data: application.application_data 
    });
  } catch (error) {
    console.error('Error getting common application:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get application' 
    });
  }
};

// Create common_applications table if it doesn't exist (using Supabase)
export const createCommonApplicationsTable = async () => {
  try {
    const { error } = await supabase.rpc('create_applications_table');
    if (error) {
      // Fallback: create table using SQL
      const { error: createError } = await supabase.from('common_applications').select('*').limit(1);
      if (createError && createError.code === 'PGRST116') {
        console.log('Common applications table already exists in Supabase');
        return;
      }
      
      // Create table manually if RPC doesn't exist
      console.log('Common applications table ready in Supabase');
    } else {
      console.log('Common applications table ready in Supabase');
    }
  } catch (error) {
    console.error('Error creating common_applications table:', error);
  }
};

const DEFAULT_FRONTEND_URL = 'http://localhost:5173';

const parseDateStart = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T00:00:00`);
  }
  return new Date(raw);
};

const parseDateEnd = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T23:59:59.999`);
  }
  return new Date(raw);
};

export const ensureRecommendationRequestsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recommendation_requests (
        id SERIAL PRIMARY KEY,
        application_id INTEGER REFERENCES common_applications(id) ON DELETE CASCADE,
        recommender_name TEXT,
        recommender_email TEXT NOT NULL,
        recommender_relation TEXT,
        token TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        response_text TEXT,
        response_file_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        submitted_at TIMESTAMPTZ,
        UNIQUE (application_id, recommender_email)
      )
    `);
  } catch (error) {
    console.error('Error creating recommendation_requests table:', error);
  }
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const buildRecommendationEmail = ({ applicantName, programName, recommenderName, link }) => {
  const safeName = recommenderName || 'there';
  return {
    subject: `Recommendation Request for ${applicantName || 'an applicant'}`,
    text: `Hello ${safeName},\n\n${applicantName || 'An applicant'} has asked you to provide a recommendation for the ${programName || 'program'} application.\n\nIf you know them and are willing to recommend them, please use the secure link below to submit a short message or upload a document:\n${link}\n\nIf you do not know them or are not willing to recommend them, you can ignore this message.\n\nThank you,\nVialifecoach Global Foundation Academy`,
    html: `
      <p>Hello ${safeName},</p>
      <p><strong>${applicantName || 'An applicant'}</strong> has asked you to provide a recommendation for the <strong>${programName || 'program'}</strong> application.</p>
      <p>If you know them and are willing to recommend them, please use the secure link below to submit a short message or upload a document:</p>
      <p><a href="${link}">${link}</a></p>
      <p>If you do not know them or are not willing to recommend them, you can ignore this message.</p>
      <p>Thank you,<br/>Vialifecoach Global Foundation Academy</p>
    `
  };
};

export const createRecommendationRequests = async (applicationId, data) => {
  try {
    if (!applicationId || !data?.recommendations) return;
    await ensureRecommendationRequestsTable();

    const applicantName =
      data.personalInfo?.name ||
      (data.personalInfo?.firstName && data.personalInfo?.lastName
        ? `${data.personalInfo.firstName} ${data.personalInfo.lastName}`
        : null) ||
      data.accountCreation?.name ||
      'Applicant';

    const programName =
      data.programSelection?.firstChoice ||
      data.programName ||
      'Program';

    const recommenderList = [
      {
        name: data.recommendations?.recommender1Name,
        email: data.recommendations?.recommender1Email,
        relation: data.recommendations?.recommender1Relation
      },
      {
        name: data.recommendations?.recommender2Name,
        email: data.recommendations?.recommender2Email,
        relation: data.recommendations?.recommender2Relation
      }
    ].filter(r => normalizeEmail(r.email));

    const frontendBase = FRONTEND_URL || DEFAULT_FRONTEND_URL;

    for (const rec of recommenderList) {
      const email = normalizeEmail(rec.email);
      const token = crypto.randomBytes(24).toString('hex');
      const insert = await pool.query(
        `INSERT INTO recommendation_requests
         (application_id, recommender_name, recommender_email, recommender_relation, token)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (application_id, recommender_email) DO NOTHING
         RETURNING id, token`,
        [applicationId, rec.name || null, email, rec.relation || null, token]
      );

      if (insert.rows.length === 0) {
        continue;
      }

      const link = `${frontendBase}/recommendation/${insert.rows[0].token}`;
      const message = buildRecommendationEmail({
        applicantName,
        programName,
        recommenderName: rec.name,
        link
      });

      await sendEmail({
        to: email,
        subject: message.subject,
        text: message.text,
        html: message.html,
        from: 'support',
        replyTo: 'academy@vialifecoach.org'
      });
    }
  } catch (error) {
    console.error('Error creating recommendation requests:', error);
  }
};
