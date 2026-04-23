// Learning Resources Model - PostgreSQL Version
// For storing downloadable PDF learning materials and videos

export const createLearningResourcesTable = `
CREATE TABLE IF NOT EXISTS learning_resources (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'general',
  resource_type VARCHAR(50) DEFAULT 'pdf' CHECK (resource_type IN ('pdf', 'workbook', 'template', 'checklist', 'guide', 'worksheet', 'video', 'tutorial', 'webinar')),
  
  -- File information
  file_url TEXT NOT NULL,
  file_public_id VARCHAR(255),
  file_size INTEGER,
  file_format VARCHAR(20),
  thumbnail_url VARCHAR(500),
  duration INTEGER, -- in seconds for videos
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  
  -- Course association (optional)
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_learning_resources_category ON learning_resources(category);
CREATE INDEX IF NOT EXISTS idx_learning_resources_course_id ON learning_resources(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_resources_is_active ON learning_resources(is_active);
CREATE INDEX IF NOT EXISTS idx_learning_resources_order ON learning_resources(order_index);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_learning_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_learning_resources_updated_at ON learning_resources;
CREATE TRIGGER update_learning_resources_updated_at
  BEFORE UPDATE ON learning_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_resources_updated_at();
`;

// Database operations
import { pool } from "../config/postgres.js";

export async function createLearningResource(data) {
  const { 
    title, description, category, resource_type, file_url, file_public_id, 
    file_size, file_format, thumbnail_url, duration, is_active, is_premium, 
    order_index, course_id, created_by 
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO learning_resources 
     (title, description, category, resource_type, file_url, file_public_id, 
      file_size, file_format, thumbnail_url, duration, is_active, is_premium, 
      order_index, course_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING *`,
    [title, description, category, resource_type, file_url, file_public_id,
     file_size, file_format, thumbnail_url, duration, is_active ?? true, 
     is_premium ?? false, order_index ?? 0, course_id, created_by]
  );
  return rows[0];
}

export async function getAllLearningResources(filters = {}) {
  const { category, course_id, is_active = true } = filters;
  
  let query = 'SELECT * FROM learning_resources WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (category) {
    query += ` AND category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  if (course_id) {
    query += ` AND (course_id = $${paramIndex} OR course_id IS NULL)`;
    params.push(course_id);
    paramIndex++;
  }

  if (is_active !== undefined) {
    query += ` AND is_active = $${paramIndex}`;
    params.push(is_active);
    paramIndex++;
  }

  query += ' ORDER BY order_index ASC, created_at DESC';

  const { rows } = await pool.query(query, params);
  return rows;
}

export async function getLearningResourceById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM learning_resources WHERE id = $1',
    [id]
  );
  return rows[0];
}

export async function updateLearningResource(id, updates) {
  const keys = Object.keys(updates);
  if (!keys.length) return null;

  const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const values = [...Object.values(updates), id];

  const { rows } = await pool.query(
    `UPDATE learning_resources SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0];
}

export async function deleteLearningResource(id) {
  const { rows } = await pool.query(
    'DELETE FROM learning_resources WHERE id = $1 RETURNING *',
    [id]
  );
  return rows[0];
}

export async function getLearningResourcesByCategory(category) {
  const { rows } = await pool.query(
    `SELECT * FROM learning_resources 
     WHERE category = $1 AND is_active = true 
     ORDER BY order_index ASC, created_at DESC`,
    [category]
  );
  return rows;
}

export async function getLearningResourceCategories() {
  const { rows } = await pool.query(
    `SELECT DISTINCT category FROM learning_resources WHERE is_active = true ORDER BY category`
  );
  return rows.map(r => r.category);
}
