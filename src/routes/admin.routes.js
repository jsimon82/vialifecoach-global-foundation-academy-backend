import { Router } from "express";
import {
  // Dashboard & Users
  getAdminDashboardController,
  getAdminUsersController,
  updateUserRoleController,
  deleteUserController,
  
  // Courses
  getAllCoursesAdminController,
  getCourseAdminController,
  createCourseController,
  updateCourseController,
  deleteCourseController,
  publishCourseController,
  unpublishCourseController,
  duplicateCourseController,
  
  // Modules
  getModulesController,
  createModuleController,
  updateModuleController,
  deleteModuleController,
  reorderModulesController,
  
  // Lessons
  getLessonsController,
  getLessonController,
  createLessonController,
  updateLessonController,
  deleteLessonController,
  reorderLessonsController,
  
  // Lesson Content
  createLessonContentController,
  updateLessonContentController,
  deleteLessonContentController,
  
  // Categories
  getCategoriesController,
  createCategoryController,
} from "../controllers/admin.controller.js";
import { authenticateToken, requireRoles } from "../middlewares/auth.middleware.js";

const adminRouter = Router();

// All admin routes require authentication and admin role
adminRouter.use(authenticateToken);
adminRouter.use(requireRoles("admin"));

// ======== DASHBOARD ========
adminRouter.get("/admin/dashboard", getAdminDashboardController);

// ======== USER MANAGEMENT ========
adminRouter.get("/admin/users", getAdminUsersController);
adminRouter.patch("/admin/users/:id/role", updateUserRoleController);
adminRouter.delete("/admin/users/:id", deleteUserController);

// ======== COURSE MANAGEMENT ========
// Get all courses (with optional filters)
adminRouter.get("/admin/courses", getAllCoursesAdminController);
// Get single course with modules/lessons
adminRouter.get("/admin/courses/:id", getCourseAdminController);
// Create new course
adminRouter.post("/admin/courses", createCourseController);
// Update course
adminRouter.patch("/admin/courses/:id", updateCourseController);
// Delete course
adminRouter.delete("/admin/courses/:id", deleteCourseController);
// Publish course
adminRouter.post("/admin/courses/:id/publish", publishCourseController);
// Unpublish course
adminRouter.post("/admin/courses/:id/unpublish", unpublishCourseController);
// Duplicate course
adminRouter.post("/admin/courses/:id/duplicate", duplicateCourseController);

// ======== MODULE MANAGEMENT ========
// Get modules for a course
adminRouter.get("/admin/courses/:courseId/modules", getModulesController);
// Create module
adminRouter.post("/admin/courses/:courseId/modules", createModuleController);
// Update module
adminRouter.patch("/admin/modules/:id", updateModuleController);
// Delete module
adminRouter.delete("/admin/modules/:id", deleteModuleController);
// Reorder modules
adminRouter.post("/admin/modules/reorder", reorderModulesController);

// ======== LESSON MANAGEMENT ========
// Get lessons for a module
adminRouter.get("/admin/modules/:moduleId/lessons", getLessonsController);
// Get single lesson with content
adminRouter.get("/admin/lessons/:id", getLessonController);
// Create lesson
adminRouter.post("/admin/modules/:moduleId/lessons", createLessonController);
// Update lesson
adminRouter.patch("/admin/lessons/:id", updateLessonController);
// Delete lesson
adminRouter.delete("/admin/lessons/:id", deleteLessonController);
// Reorder lessons
adminRouter.post("/admin/lessons/reorder", reorderLessonsController);

// ======== LESSON CONTENT MANAGEMENT ========
// Create lesson content
adminRouter.post("/admin/lessons/:lessonId/content", createLessonContentController);
// Update lesson content
adminRouter.patch("/admin/content/:id", updateLessonContentController);
// Delete lesson content
adminRouter.delete("/admin/content/:id", deleteLessonContentController);

// ======== CATEGORIES MANAGEMENT ========
adminRouter.get("/admin/categories", getCategoriesController);
adminRouter.post("/admin/categories", createCategoryController);

export default adminRouter;
