import {
  getAdminDashboardStats,
  getAllUsersForAdmin,
  updateUserRole,
} from "../models/User.model.js";

// Database
import { pool } from "../config/postgres.js";

// Course models
import * as CourseModel from "../models/Course.model.js";
import * as ModuleModel from "../models/Module.model.js";
import * as LessonModel from "../models/Lesson.model.js";
import * as LessonContentModel from "../models/LessonContent.model.js";

const ALLOWED_ROLES = new Set(["student", "instructor", "admin", "lecturer"]);

function normalizeRole(role) {
  if (!role) return role;
  if (role === "lecturer") return "instructor";
  return role;
}

function normalizeCourseUpdates(payload) {
  if (!payload || typeof payload !== "object") return payload;
  const updates = { ...payload };

  const mapIfMissing = (fromKey, toKey) => {
    if (updates[toKey] === undefined && updates[fromKey] !== undefined) {
      updates[toKey] = updates[fromKey];
    }
  };

  mapIfMissing("shortDescription", "short_description");
  mapIfMissing("longDescription", "long_description");
  mapIfMissing("thumbnailUrl", "thumbnail_url");
  mapIfMissing("introVideoUrl", "intro_video_url");
  mapIfMissing("deliveryMode", "delivery_mode");
  mapIfMissing("scheduleReleaseDate", "schedule_release_date");
  mapIfMissing("categoryId", "category_id");
  mapIfMissing("instructorId", "instructor_id");
  mapIfMissing("durationWeeks", "duration_weeks");
  mapIfMissing("hasCertificate", "has_certificate");
  mapIfMissing("enableDrip", "enable_drip");
  mapIfMissing("enableDiscussion", "enable_discussion");

  if (updates.status === undefined && typeof updates.published === "boolean") {
    updates.status = updates.published ? "published" : "draft";
  }

  return updates;
}

// ======== ADMIN DASHBOARD ========

export async function getAdminDashboardController(req, res) {
  try {
    const stats = await getAdminDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// ======== USER MANAGEMENT ========

export async function getAdminUsersController(req, res) {
  try {
    const users = await getAllUsersForAdmin();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function updateUserRoleController(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !ALLOWED_ROLES.has(role)) {
      return res.status(400).json({
        message: "Role is required and must be one of: student, lecturer, instructor, admin",
      });
    }

    const updatedUser = await updateUserRole(id, normalizeRole(role));
    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function deleteUserController(req, res) {
  try {
    const { id } = req.params;
    const { deleteUser } = await import("../models/User.model.js");
    const result = await deleteUser(id);
    if (!result) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// ======== COURSE MANAGEMENT ========

// Get all courses (admin view) - WITH MODULES AND LESSONS
export async function getAllCoursesAdminController(req, res) {
  try {
    const { status, level, category_id, instructor_id } = req.query;
    
    // Enhanced query to get courses with modules and lessons
    let query = `
      SELECT 
        c.id, c.title, c.description, c.price, c.thumbnail_url, c.status,
        CASE WHEN c.status = 'published' THEN TRUE ELSE FALSE END AS published,
        COUNT(DISTINCT m.id) as module_count,
        COUNT(DISTINCT l.id) as lesson_count
      FROM courses c
      LEFT JOIN modules m ON c.id = m.course_id
      LEFT JOIN lessons l ON m.id = l.module_id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (status) {
      params.push(status);
      conditions.push(`c.status = $${params.length}`);
    }
    if (category_id) {
      params.push(category_id);
      conditions.push(`c.category_id = $${params.length}`);
    }
    if (level) {
      params.push(level);
      conditions.push(`c.level = $${params.length}`);
    }
    if (instructor_id) {
      params.push(instructor_id);
      conditions.push(`c.instructor_id = $${params.length}`);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    
    query += ` 
      GROUP BY c.id, c.title, c.description, c.price, c.thumbnail_url, c.status, cat.name, u.name
      ORDER BY c.created_at DESC`;
    
    const { rows } = await pool.query(query, params);
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Get single course with modules and lessons
export async function getCourseAdminController(req, res) {
  try {
    const { id } = req.params;
    const courseData = await CourseModel.getCourseWithModules(id);
    if (!courseData) return res.status(404).json({ message: "Course not found" });
    if (courseData.course) {
      courseData.course.published = courseData.course.status === "published";
    }
    res.json({ success: true, data: courseData });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Create new course
export async function createCourseController(req, res) {
  try {
    const courseData = req.body;
    const course = await CourseModel.createCourse(courseData);
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Update course
export async function updateCourseController(req, res) {
  try {
    const { id } = req.params;
    const updates = normalizeCourseUpdates(req.body);
    const course = await CourseModel.updateCourse(id, updates);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ success: true, data: course });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Delete course
export async function deleteCourseController(req, res) {
  try {
    const { id } = req.params;
    const result = await CourseModel.deleteCourse(id);
    if (!result) return res.status(404).json({ message: "Course not found" });
    res.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Publish course
export async function publishCourseController(req, res) {
  try {
    const { id } = req.params;
    const course = await CourseModel.publishCourse(id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ success: true, data: course });
  } catch (error) {
    console.error("Error publishing course:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Unpublish course
export async function unpublishCourseController(req, res) {
  try {
    const { id } = req.params;
    const course = await CourseModel.unpublishCourse(id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ success: true, data: course });
  } catch (error) {
    console.error("Error unpublishing course:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Duplicate course
export async function duplicateCourseController(req, res) {
  try {
    const { id } = req.params;
    const course = await CourseModel.duplicateCourse(id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    console.error("Error duplicating course:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// ======== MODULE MANAGEMENT ========

// Get modules for a course
export async function getModulesController(req, res) {
  try {
    const { courseId } = req.params;
    const modules = await ModuleModel.getModulesByCourseId(courseId);
    res.json({ success: true, data: modules });
  } catch (error) {
    console.error("Error fetching modules:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Create module
export async function createModuleController(req, res) {
  try {
    const { courseId } = req.params;
    const { title, order_index } = req.body;
    const module = await ModuleModel.createModule(courseId, title, order_index);
    res.status(201).json({ success: true, data: module });
  } catch (error) {
    console.error("Error creating module:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Update module
export async function updateModuleController(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const module = await ModuleModel.updateModule(id, updates);
    if (!module) return res.status(404).json({ message: "Module not found" });
    res.json({ success: true, data: module });
  } catch (error) {
    console.error("Error updating module:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Delete module
export async function deleteModuleController(req, res) {
  try {
    const { id } = req.params;
    const result = await ModuleModel.deleteModule(id);
    if (!result) return res.status(404).json({ message: "Module not found" });
    res.json({ success: true, message: "Module deleted successfully" });
  } catch (error) {
    console.error("Error deleting module:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Reorder modules
export async function reorderModulesController(req, res) {
  try {
    const { items } = req.body;
    await ModuleModel.reorderModules(items);
    res.json({ success: true, message: "Modules reordered successfully" });
  } catch (error) {
    console.error("Error reordering modules:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// ======== LESSON MANAGEMENT ========

// Get lessons for a module
export async function getLessonsController(req, res) {
  try {
    const { moduleId } = req.params;
    const lessons = await LessonModel.getLessonsByModuleId(moduleId);
    res.json({ success: true, data: lessons });
  } catch (error) {
    console.error("Error fetching lessons:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Get single lesson with content
export async function getLessonController(req, res) {
  try {
    const { id } = req.params;
    const lesson = await LessonModel.getLessonWithContent(id);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    res.json({ success: true, data: lesson });
  } catch (error) {
    console.error("Error fetching lesson:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Create lesson
export async function createLessonController(req, res) {
  try {
    const { moduleId } = req.params;
    const lessonData = req.body;
    const lesson = await LessonModel.createLesson(moduleId, lessonData);
    res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    console.error("Error creating lesson:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Update lesson
export async function updateLessonController(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const lesson = await LessonModel.updateLesson(id, updates);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    res.json({ success: true, data: lesson });
  } catch (error) {
    console.error("Error updating lesson:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Delete lesson
export async function deleteLessonController(req, res) {
  try {
    const { id } = req.params;
    const result = await LessonModel.deleteLesson(id);
    if (!result) return res.status(404).json({ message: "Lesson not found" });
    res.json({ success: true, message: "Lesson deleted successfully" });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Reorder lessons
export async function reorderLessonsController(req, res) {
  try {
    const { items } = req.body;
    await LessonModel.reorderLessons(items);
    res.json({ success: true, message: "Lessons reordered successfully" });
  } catch (error) {
    console.error("Error reordering lessons:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// ======== LESSON CONTENT MANAGEMENT ========

// Create lesson content
export async function createLessonContentController(req, res) {
  try {
    const { lessonId } = req.params;
    const contentData = req.body;
    const content = await LessonContentModel.addContentBlock(lessonId, contentData);
    res.status(201).json({ success: true, data: content });
  } catch (error) {
    console.error("Error creating lesson content:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Update lesson content
export async function updateLessonContentController(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const content = await LessonContentModel.updateContentBlock(id, updates);
    if (!content) return res.status(404).json({ message: "Content not found" });
    res.json({ success: true, data: content });
  } catch (error) {
    console.error("Error updating lesson content:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Delete lesson content
export async function deleteLessonContentController(req, res) {
  try {
    const { id } = req.params;
    const result = await LessonContentModel.deleteContentBlock(id);
    if (!result) return res.status(404).json({ message: "Content not found" });
    res.json({ success: true, message: "Content deleted successfully" });
  } catch (error) {
    console.error("Error deleting lesson content:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// ======== CATEGORIES MANAGEMENT ========

export async function getCategoriesController(req, res) {
  try {
    const categories = await CourseModel.getAllCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function createCategoryController(req, res) {
  try {
    const { name } = req.body;
    const category = await CourseModel.createCategory(name);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Server error" });
  }
}
