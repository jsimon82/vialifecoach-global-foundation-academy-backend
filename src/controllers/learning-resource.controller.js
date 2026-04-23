import { pool } from "../config/postgres.js";
import { createLearningResource, getAllLearningResources, getLearningResourceById, updateLearningResource, deleteLearningResource, getLearningResourceCategories } from "../models/LearningResource.model.js";
import { catchAsync } from "../utils/asyncHelpers.js";
import { AppError } from "../utils/AppError.js";
import { uploadImage } from "../config/cloudinary.js";

// Ensure the learning_resources table exists
async function ensureLearningResourcesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS learning_resources (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100) DEFAULT 'general',
      resource_type VARCHAR(50) DEFAULT 'pdf' CHECK (resource_type IN ('pdf', 'workbook', 'template', 'checklist', 'guide', 'worksheet', 'video', 'tutorial', 'webinar')),
      file_url TEXT NOT NULL,
      file_public_id VARCHAR(255),
      file_size INTEGER,
      file_format VARCHAR(20),
      thumbnail_url VARCHAR(500),
      duration INTEGER,
      is_active BOOLEAN DEFAULT true,
      is_premium BOOLEAN DEFAULT false,
      order_index INTEGER DEFAULT 0,
      course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// ========== ADMIN CONTROLLERS ==========

// Create a new learning resource
export const createLearningResourceController = catchAsync(async (req, res) => {
  await ensureLearningResourcesTable();
  
  const { 
    title, description, category, resource_type, 
    file_url, file_public_id, file_size, file_format,
    thumbnail_url, duration, is_active, is_premium, order_index, course_id 
  } = req.body;

  if (!title || !file_url) {
    throw new AppError("Title and file_url are required", 400);
  }

  const resource = await createLearningResource({
    title,
    description,
    category: category || 'general',
    resource_type: resource_type || 'pdf',
    file_url,
    file_public_id,
    file_size,
    file_format,
    thumbnail_url,
    duration,
    is_active: is_active ?? true,
    is_premium: is_premium ?? false,
    order_index: order_index ?? 0,
    course_id,
    created_by: req.user?.id
  });

  res.status(201).json({
    success: true,
    data: resource
  });
});

// Get all learning resources (with optional filters)
export const getAllLearningResourcesController = catchAsync(async (req, res) => {
  await ensureLearningResourcesTable();
  
  const { category, course_id } = req.query;
  
  const resources = await getAllLearningResources({
    category,
    course_id,
    is_active: true
  });

  res.json({
    success: true,
    data: resources,
    count: resources.length
  });
});

// Get single learning resource by ID
export const getLearningResourceByIdController = catchAsync(async (req, res) => {
  await ensureLearningResourcesTable();
  
  const { id } = req.params;
  const resource = await getLearningResourceById(id);

  if (!resource) {
    throw new AppError("Learning resource not found", 404);
  }

  res.json({
    success: true,
    data: resource
  });
});

// Update a learning resource
export const updateLearningResourceController = catchAsync(async (req, res) => {
  await ensureLearningResourcesTable();
  
  const { id } = req.params;
  const updates = req.body;

  // Remove fields that shouldn't be updated directly
  delete updates.id;
  delete updates.created_at;

  const updated = await updateLearningResource(id, updates);

  if (!updated) {
    throw new AppError("Learning resource not found", 404);
  }

  res.json({
    success: true,
    data: updated
  });
});

// Delete a learning resource
export const deleteLearningResourceController = catchAsync(async (req, res) => {
  await ensureLearningResourcesTable();
  
  const { id } = req.params;
  const deleted = await deleteLearningResource(id);

  if (!deleted) {
    throw new AppError("Learning resource not found", 404);
  }

  res.json({
    success: true,
    message: "Learning resource deleted successfully"
  });
});

// Get all categories
export const getLearningResourceCategoriesController = catchAsync(async (req, res) => {
  await ensureLearningResourcesTable();
  
  const categories = await getLearningResourceCategories();

  res.json({
    success: true,
    data: categories
  });
});
