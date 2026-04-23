import { pool } from "../config/postgres.js";
import { catchAsync } from "../utils/asyncHelpers.js";

// VIALIFECOACH GLOBAL FOUNDATION REVIEW
// Program-specific AI Review System with custom keywords

const DEFAULT_PROGRAMS = [
  "Women Refugee Rise Program",
  "GVB Healing Program",
  "Inner Leadership Program",
  "Business Mentorship Program",
];

async function ensureProgramKeywordsSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS programs (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS program_ai_keywords (
      id SERIAL PRIMARY KEY,
      program_name TEXT NOT NULL,
      keywords TEXT NOT NULL,
      weight NUMERIC DEFAULT 1.0,
      category TEXT DEFAULT 'general',
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (program_name, keywords)
    );
  `);

  const existing = await pool.query(`SELECT COUNT(*)::int AS total FROM programs`);
  if (existing.rows[0]?.total === 0) {
    for (const name of DEFAULT_PROGRAMS) {
      await pool.query(
        `INSERT INTO programs (name, status) VALUES ($1, 'active') ON CONFLICT (name) DO NOTHING`,
        [name]
      );
    }
  }
}

// Get program-specific keywords from database
async function getProgramKeywords(programName) {
  try {
    await ensureProgramKeywordsSchema();
    const { rows } = await pool.query(`
      SELECT keywords, weight 
      FROM program_ai_keywords 
      WHERE program_name = $1 AND active = true
      ORDER BY weight DESC
    `, [programName]);
    
    return rows;
  } catch (error) {
    console.error('Error fetching program keywords:', error);
    return [];
  }
}

// Custom keyword-based scoring
function calculateKeywordScore(text, keywords, maxPoints) {
  if (!text || !keywords.length) return { points: 0, matched: [] };
  
  const textLower = text.toLowerCase();
  let totalScore = 0;
  const matchedKeywords = [];
  
  for (const keywordData of keywords) {
    const keywords = keywordData.keywords.toLowerCase().split(',').map(k => k.trim());
    const weight = keywordData.weight || 1;
    
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        totalScore += weight;
        matchedKeywords.push(keyword);
      }
    }
  }
  
  // Cap at maxPoints
  const points = Math.min(totalScore, maxPoints);
  return { points, matched: matchedKeywords };
}

const QUALIFICATION_CRITERIA = {
  // Education criteria (max 30 points)
  education: {
    high_school: 10,
    bachelor_degree: 20,
    master_degree: 25,
    phd: 30
  },
  
  // Experience criteria (max 25 points)
  experience: {
    less_than_1_year: 5,
    '1_3_years': 10,
    '3_5_years': 15,
    '5_10_years': 20,
    over_10_years: 25
  },
  
  // Skills criteria (max 20 points)
  skills: {
    basic: 5,
    intermediate: 10,
    advanced: 15,
    expert: 20
  },
  
  // Motivation criteria (max 15 points)
  motivation: {
    poor: 3,
    basic: 7,
    good: 11,
    excellent: 15
  },
  
  // Availability criteria (max 10 points)
  availability: {
    limited: 3,
    part_time: 6,
    full_time: 10
  }
};

// Get all applications for AI review
export async function getAIApplicationsController(req, res) {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT 
        a.id, a.user_id, a.application_data, a.created_at, a.updated_at,
        u.name, u.email, u.role
      FROM common_applications a
      LEFT JOIN users u ON a.user_id = u.id
    `;
    
    const params = [];
    if (status) {
      query += ` WHERE a.application_data->>'status' = $1`;
      params.push(status);
    }
    
    query += ` ORDER BY a.created_at DESC`;
    
    const { rows } = await pool.query(query, params);
    
    // Extract relevant data from JSONB
    const applications = rows.map(row => {
      const data = row.application_data || {};
      return {
        id: row.id,
        user_id: row.user_id,
        name: data.personalInfo?.name || row.name,
        email: data.personalInfo?.email || row.email,
        phone: data.personalInfo?.phone || '',
        created_at: row.created_at,
        status: data.status || 'pending',
        education_level: data.educationHistory?.highestEducation || '',
        work_experience: extractExperience(data),
        skills: extractSkills(data),
        motivation: data.personalStatement?.motivation || '',
        availability: extractAvailability(data),
        education_details: data.educationHistory,
        experience_details: data.personalStatement,
        additional_info: data,
        ai_review_score: data.ai_review_score,
        ai_review_notes: data.ai_review_notes,
        ai_reviewed_at: data.ai_reviewed_at
      };
    });
    
    res.json({ 
      success: true, 
      data: applications,
      total_applications: applications.length
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// AI Review single application
export async function reviewSingleApplicationController(req, res) {
  try {
    const { id } = req.params;
    
    // Get application details
    const { rows } = await pool.query(`
      SELECT * FROM common_applications WHERE id = $1
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }
    
    const application = rows[0];
    const data = application.application_data || {};
    
    // Extract data for AI review
    const reviewData = {
      id: application.id,
      full_name: data.personalInfo?.name || '',
      email: data.personalInfo?.email || '',
      phone: data.personalInfo?.phone || '',
      education_level: data.educationHistory?.highestEducation || '',
      work_experience: extractExperience(data),
      skills: extractSkills(data),
      motivation: data.personalStatement?.motivation || '',
      availability: extractAvailability(data),
      education_details: data.educationHistory,
      experience_details: data.personalStatement,
      additional_info: data
    };
    
    // Perform AI review
    const review = await performAIReview(reviewData);
    
    // Update application with AI review
    const updatedData = {
      ...data,
      ai_review_score: review.score,
      ai_review_notes: review.notes,
      ai_reviewed_at: new Date().toISOString()
    };
    
    await pool.query(`
      UPDATE common_applications 
      SET application_data = $1, updated_at = NOW()
      WHERE id = $2
    `, [JSON.stringify(updatedData), id]);
    
    res.json({ 
      success: true, 
      data: {
        application: { ...reviewData, ...review },
        recommendation: getRecommendation(review.score)
      }
    });
  } catch (error) {
    console.error("Error reviewing application:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// AI Review all pending applications
export async function reviewAllApplicationsController(req, res) {
  try {
    // Get all unreviewed applications
    const { rows } = await pool.query(`
      SELECT * FROM common_applications 
      WHERE application_data->>'ai_reviewed_at' IS NULL 
      ORDER BY created_at ASC
    `);
    
    const reviews = [];
    
    for (const application of rows) {
      const data = application.application_data || {};
      
      // Extract data for AI review
      const reviewData = {
        id: application.id,
        full_name: data.personalInfo?.name || '',
        email: data.personalInfo?.email || '',
        phone: data.personalInfo?.phone || '',
        education_level: data.educationHistory?.highestEducation || '',
        work_experience: extractExperience(data),
        skills: extractSkills(data),
        motivation: data.personalStatement?.motivation || '',
        availability: extractAvailability(data),
        education_details: data.educationHistory,
        experience_details: data.personalStatement,
        additional_info: data
      };
      
      const review = await performAIReview(reviewData);
      
      // Update database
      const updatedData = {
        ...data,
        ai_review_score: review.score,
        ai_review_notes: review.notes,
        ai_reviewed_at: new Date().toISOString()
      };
      
      await pool.query(`
        UPDATE common_applications 
        SET application_data = $1, updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(updatedData), application.id]);
      
      reviews.push({
        id: application.id,
        name: data.personalInfo?.name || 'Unknown',
        score: review.score,
        recommendation: getRecommendation(review.score),
        key_factors: review.key_factors
      });
    }
    
    res.json({ 
      success: true, 
      message: `AI review completed for ${reviews.length} applications`,
      data: reviews
    });
  } catch (error) {
    console.error("Error reviewing applications:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// AI Review Algorithm - VIALIFECOACH GLOBAL FOUNDATION REVIEW
async function performAIReview(application) {
  let score = 0;
  const key_factors = [];
  const programName = application.additional_info?.programName || 'General';
  
  // Get program-specific keywords
  const programKeywords = await getProgramKeywords(programName);
  
  // Combine all text for keyword analysis
  const fullText = `
    ${application.full_name} 
    ${application.motivation} 
    ${application.skills} 
    ${application.education_details?.fieldOfStudy || ''} 
    ${application.experience_details?.goals || ''}
  `.toLowerCase();
  
  // Program-specific keyword scoring (40 points)
  const keywordScore = calculateKeywordScore(fullText, programKeywords, 40);
  score += keywordScore.points;
  key_factors.push(`Program Match: Found ${keywordScore.matched.length} keywords (${keywordScore.points}/40 points)`);
  
  // Education scoring (25 points) - reduced weight
  const educationScore = calculateEducationScore(application.education_level, application.education_details);
  score += Math.min(educationScore.points, 25);
  key_factors.push(`Education: ${educationScore.description} (${Math.min(educationScore.points, 25)} points)`);
  
  // Experience scoring (20 points) - reduced weight
  const experienceScore = calculateExperienceScore(application.work_experience, application.experience_details);
  score += Math.min(experienceScore.points, 20);
  key_factors.push(`Experience: ${experienceScore.description} (${Math.min(experienceScore.points, 20)} points)`);
  
  // Skills scoring (10 points) - reduced weight
  const skillsScore = calculateSkillsScore(application.skills);
  score += Math.min(skillsScore.points, 10);
  key_factors.push(`Skills: ${skillsScore.description} (${Math.min(skillsScore.points, 10)} points)`);
  
  // Motivation scoring (5 points) - reduced weight
  const motivationScore = calculateMotivationScore(application.motivation);
  score += Math.min(motivationScore.points, 5);
  key_factors.push(`Motivation: ${motivationScore.description} (${Math.min(motivationScore.points, 5)} points)`);
  
  // Generate AI notes with keyword highlights
  const notes = generateVialifeCoachNotes(application, key_factors, score, keywordScore.matched, programName);
  
  return {
    score,
    max_score: 100,
    percentage: Math.round((score / 100) * 100),
    key_factors,
    notes,
    reviewed_at: new Date(),
    program_name: programName,
    matched_keywords: keywordScore.matched
  };
}

// Education scoring function
function calculateEducationScore(level, details) {
  const scores = {
    'high_school': QUALIFICATION_CRITERIA.education.high_school,
    'bachelor': QUALIFICATION_CRITERIA.education.bachelor_degree,
    'master': QUALIFICATION_CRITERIA.education.master_degree,
    'phd': QUALIFICATION_CRITERIA.education.phd
  };
  
  const points = scores[level] || QUALIFICATION_CRITERIA.education.high_school;
  const descriptions = {
    'high_school': 'High School Diploma',
    'bachelor': 'Bachelor\'s Degree',
    'master': 'Master\'s Degree',
    'phd': 'PhD or Doctorate'
  };
  
  return {
    points,
    description: descriptions[level] || 'High School Diploma'
  };
}

// Experience scoring function
function calculateExperienceScore(experience, details) {
  const years = parseInt(experience) || 0;
  
  if (years < 1) return { points: QUALIFICATION_CRITERIA.experience.less_than_1_year, description: 'Less than 1 year' };
  if (years >= 1 && years < 3) return { points: QUALIFICATION_CRITERIA.experience['1_3_years'], description: '1-3 years' };
  if (years >= 3 && years < 5) return { points: QUALIFICATION_CRITERIA.experience['3_5_years'], description: '3-5 years' };
  if (years >= 5 && years < 10) return { points: QUALIFICATION_CRITERIA.experience['5_10_years'], description: '5-10 years' };
  if (years >= 10) return { points: QUALIFICATION_CRITERIA.experience.over_10_years, description: '10+ years' };
  
  return { points: QUALIFICATION_CRITERIA.experience.less_than_1_year, description: 'Less than 1 year' };
}

// Skills scoring function
function calculateSkillsScore(skills) {
  if (!skills) return { points: QUALIFICATION_CRITERIA.skills.basic, description: 'Basic skills mentioned' };
  
  const skillKeywords = {
    basic: ['basic', 'beginner', 'learning', 'entry'],
    intermediate: ['intermediate', 'moderate', 'some experience'],
    advanced: ['advanced', 'expert', 'professional', 'experienced', 'skilled']
  };
  
  const skillsLower = skills.toLowerCase();
  
  if (skillKeywords.advanced.some(keyword => skillsLower.includes(keyword))) {
    return { points: QUALIFICATION_CRITERIA.skills.expert, description: 'Expert/Advanced skills' };
  }
  if (skillKeywords.intermediate.some(keyword => skillsLower.includes(keyword))) {
    return { points: QUALIFICATION_CRITERIA.skills.intermediate, description: 'Intermediate skills' };
  }
  
  return { points: QUALIFICATION_CRITERIA.skills.basic, description: 'Basic skills' };
}

// Motivation scoring function
function calculateMotivationScore(motivation) {
  if (!motivation) return { points: QUALIFICATION_CRITERIA.motivation.poor, description: 'Poor motivation statement' };
  
  const motivationLower = motivation.toLowerCase();
  const length = motivation.length;
  
  // High motivation indicators
  const highIndicators = ['passion', 'dedicated', 'committed', 'excellent', 'strong', 'eager', 'motivated'];
  const goodIndicators = ['interested', 'learn', 'grow', 'develop'];
  
  const hasHighIndicators = highIndicators.some(indicator => motivationLower.includes(indicator));
  const hasGoodIndicators = goodIndicators.some(indicator => motivationLower.includes(indicator));
  
  if (hasHighIndicators && length > 100) {
    return { points: QUALIFICATION_CRITERIA.motivation.excellent, description: 'Excellent motivation statement' };
  }
  if (hasGoodIndicators || length > 50) {
    return { points: QUALIFICATION_CRITERIA.motivation.good, description: 'Good motivation statement' };
  }
  if (length > 20) {
    return { points: QUALIFICATION_CRITERIA.motivation.basic, description: 'Basic motivation statement' };
  }
  
  return { points: QUALIFICATION_CRITERIA.motivation.poor, description: 'Poor motivation statement' };
}

// Availability scoring function
function calculateAvailabilityScore(availability) {
  if (!availability) return { points: QUALIFICATION_CRITERIA.availability.limited, description: 'Limited availability' };
  
  const availabilityLower = availability.toLowerCase();
  
  if (availabilityLower.includes('full') || availabilityLower.includes('40')) {
    return { points: QUALIFICATION_CRITERIA.availability.full_time, description: 'Full-time availability' };
  }
  if (availabilityLower.includes('part') || availabilityLower.includes('20')) {
    return { points: QUALIFICATION_CRITERIA.availability.part_time, description: 'Part-time availability' };
  }
  
  return { points: QUALIFICATION_CRITERIA.availability.limited, description: 'Limited availability' };
}

// Generate VIALIFECOACH GLOBAL FOUNDATION REVIEW notes
function generateVialifeCoachNotes(application, factors, score, matchedKeywords, programName) {
  const strengths = [];
  const improvements = [];
  
  // Analyze strengths based on keywords
  if (matchedKeywords.length > 0) {
    strengths.push(`Strong program alignment: ${matchedKeywords.join(', ')}`);
  }
  if (score >= 70) strengths.push('Excellent overall profile');
  if (score >= 50) strengths.push('Meets qualification standards');
  
  // Analyze improvements
  if (score < 50) improvements.push('Consider gaining more relevant experience');
  if (matchedKeywords.length < 3) improvements.push('Strengthen alignment with program requirements');
  if (score < 30) improvements.push('Enhance motivation and skills statement');
  
  return `
    ════════════════════════════════════════════════════════════════
    VIALIFECOACH GLOBAL FOUNDATION REVIEW
    ════════════════════════════════════════════════════════════════
    
    Program: ${programName}
    Candidate: ${application.full_name}
    Review Date: ${new Date().toLocaleDateString()}
    
    OVERALL ASSESSMENT: ${score}/100 (${Math.round((score / 100) * 100)}%)
    
    ${strengths.length > 0 ? '✅ STRENGTHS:\n' + strengths.map(s => `   • ${s}`).join('\n') : ''}
    ${improvements.length > 0 ? '⚠️ RECOMMENDATIONS:\n' + improvements.map(i => `   • ${i}`).join('\n') : ''}
    
    DETAILED EVALUATION:
    ${factors.map(f => `   ${f}`).join('\n')}
    
    KEYWORD MATCHES: ${matchedKeywords.length > 0 ? matchedKeywords.join(', ') : 'No specific keywords matched'}
    
    FINAL RECOMMENDATION: ${getRecommendation(score)}
    
    ════════════════════════════════════════════════════════════════
    This review was conducted by VIALIFECOACH GLOBAL FOUNDATION REVIEW
    using program-specific evaluation criteria.
    ════════════════════════════════════════════════════════════════
  `;
}

// Helper functions for extracting data from JSONB
function extractExperience(data) {
  // Try to extract experience from various fields
  const experience = data.personalStatement?.goals || '';
  const years = experience.match(/\d+ years?/);
  return years ? parseInt(years[0]) : 0;
}

function extractSkills(data) {
  // Try to extract skills from personal statement or education
  const statement = data.personalStatement?.motivation || '';
  const education = data.educationHistory?.fieldOfStudy || '';
  
  if (education.toLowerCase().includes('computer') || education.toLowerCase().includes('software')) {
    return 'advanced';
  }
  if (statement.toLowerCase().includes('passionate') || statement.toLowerCase().includes('dedicated')) {
    return 'intermediate';
  }
  return 'basic';
}

function extractAvailability(data) {
  // Try to extract availability from personal statement
  const statement = data.personalStatement?.motivation || '';
  if (statement.toLowerCase().includes('full')) return 'full-time';
  if (statement.toLowerCase().includes('part')) return 'part-time';
  return 'limited';
}

// Get recommendation based on score
function getRecommendation(score) {
  if (score >= 80) return 'HIGHLY RECOMMENDED - Excellent candidate';
  if (score >= 70) return 'RECOMMENDED - Strong candidate';
  if (score >= 60) return 'CONSIDER - Meets requirements';
  if (score >= 50) return 'MARGINAL - Borderline candidate';
  return 'NOT RECOMMENDED - Below minimum requirements';
}

// ════════════════════════════════════════════════════════════════
// ADMIN FUNCTIONS FOR PROGRAM KEYWORDS MANAGEMENT
// ════════════════════════════════════════════════════════════════

// Get all program keywords
export async function getProgramKeywordsController(req, res) {
  try {
    await ensureProgramKeywordsSchema();
    const { program_name } = req.query;
    
    let query = `
      SELECT pk.*, p.name as program_display_name
      FROM program_ai_keywords pk
      LEFT JOIN programs p ON pk.program_name = p.name
      WHERE 1=1
    `;
    const params = [];
    
    if (program_name) {
      query += ` AND pk.program_name = $1`;
      params.push(program_name);
    }
    
    query += ` ORDER BY pk.program_name, pk.weight DESC`;
    
    const { rows } = await pool.query(query, params);
    
    res.json({ 
      success: true, 
      data: rows
    });
  } catch (error) {
    console.error("Error fetching program keywords:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Add or update program keywords
export async function upsertProgramKeywordsController(req, res) {
  try {
    await ensureProgramKeywordsSchema();
    const { program_name, keywords, weight, category, active = true } = req.body;
    
    if (!program_name || !keywords) {
      return res.status(400).json({ message: "Program name and keywords are required" });
    }
    
    const { rows } = await pool.query(`
      INSERT INTO program_ai_keywords (program_name, keywords, weight, category, active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (program_name, keywords) 
      DO UPDATE SET 
        weight = $3,
        category = $4,
        active = $5,
        updated_at = NOW()
      RETURNING *
    `, [program_name, keywords, weight || 1, category || 'general', active]);
    
    res.json({ 
      success: true, 
      data: rows[0],
      message: "Program keywords updated successfully"
    });
  } catch (error) {
    console.error("Error updating program keywords:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Delete program keywords
export async function deleteProgramKeywordsController(req, res) {
  try {
    await ensureProgramKeywordsSchema();
    const { id } = req.params;
    
    const { rows } = await pool.query(`
      DELETE FROM program_ai_keywords 
      WHERE id = $1 
      RETURNING *
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Keywords not found" });
    }
    
    res.json({ 
      success: true, 
      data: rows[0],
      message: "Program keywords deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting program keywords:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Get available programs for keyword management
export async function getProgramsForKeywordsController(req, res) {
  try {
    await ensureProgramKeywordsSchema();
    const { rows } = await pool.query(`
      SELECT DISTINCT 
        name,
        CASE 
          WHEN EXISTS(SELECT 1 FROM program_ai_keywords WHERE program_name = name) 
          THEN true 
          ELSE false 
        END as has_keywords
      FROM programs
      WHERE status = 'active'
      ORDER BY name
    `);
    
    res.json({ 
      success: true, 
      data: rows
    });
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ message: "Server error" });
  }
}

