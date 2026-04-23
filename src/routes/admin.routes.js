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
import {
  getAIApplicationsController,
  reviewSingleApplicationController,
  reviewAllApplicationsController,
  getProgramKeywordsController,
  upsertProgramKeywordsController,
  deleteProgramKeywordsController,
  getProgramsForKeywordsController,
} from "../controllers/aiApplicationReview.controller.js";
import {
  listSupportTicketsAdminController,
  updateSupportTicketAdminController,
  deleteSupportTicketAdminController,
  replyToSupportTicketAdminController,
  uploadFileController,
  getKpisController,
  getTrafficAnalyticsController,
  getShareAnalyticsController,
  createShareLinkAdminController,
  listIncidentsController,
  getAuditLogsController,
  deleteAuditLogAdminController,
  createUploadIntentController,
  registerMediaAssetController,
  listMediaAssetsController,
  createScriptToPptVideoController,
  listGenerationJobsController,
  retryGenerationJobController,
  getRbacRolesController,
  getSystemSettingController,
  upsertSystemSettingController,
  getFeatureFlagController,
  upsertFeatureFlagController,
  listSuccessStoriesAdminController,
  createSuccessStoryAdminController,
  updateSuccessStoryAdminController,
  deleteSuccessStoryAdminController,
  getQuizPolicyAdminController,
  upsertQuizPolicyAdminController,
  getQuizPolicyComplianceAdminController,
  getTodayExperienceControlsController,
  upsertTodayExperienceControlsController,
  listCommunityMessagesAdminController,
  moderateCommunityMessageAdminController,
  getCoursePublishChecklistController,
  createCourseVersionSnapshotController,
  listCourseVersionsController,
  rollbackCourseVersionController,
  bulkCourseActionController,
  getContentQualityController,
  getRevenueReportController,
  getCouponPerformanceController,
  getRefundReportController,
  exportReportController,
  generateAdmissionPdfController,
} from "../controllers/admin.pro.controller.js";
import { authenticateToken, requireRoles } from "../middlewares/auth.middleware.js";
import multer from "multer";

const adminRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

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
adminRouter.put("/admin/courses/:id", updateCourseController);
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

// ======== SUPPORT TICKETS ========
adminRouter.get("/admin/support/tickets", listSupportTicketsAdminController);
adminRouter.patch("/admin/support/tickets/:id", updateSupportTicketAdminController);
adminRouter.delete("/admin/support/tickets/:id", deleteSupportTicketAdminController);
adminRouter.post("/admin/support/tickets/:id/reply", replyToSupportTicketAdminController);

// ======== AI REVIEW (APPLICATIONS + KEYWORDS) ========
adminRouter.get("/admin/ai/applications", getAIApplicationsController);
adminRouter.post("/admin/applications/:id/review", reviewSingleApplicationController);
adminRouter.post("/admin/applications/review-all", reviewAllApplicationsController);
adminRouter.get("/admin/program-keywords", getProgramKeywordsController);
adminRouter.post("/admin/program-keywords", upsertProgramKeywordsController);
adminRouter.delete("/admin/program-keywords/:id", deleteProgramKeywordsController);
adminRouter.get("/admin/programs-for-keywords", getProgramsForKeywordsController);

// ======== OPERATIONS / ANALYTICS ========
adminRouter.get("/admin/analytics/kpis", getKpisController);
adminRouter.get("/admin/analytics/traffic", getTrafficAnalyticsController);
adminRouter.get("/admin/analytics/shares", getShareAnalyticsController);
adminRouter.post("/admin/analytics/share-links", createShareLinkAdminController);
adminRouter.get("/admin/incidents/latest", listIncidentsController);

// ======== AUDIT LOGS ========
adminRouter.get("/admin/audit-logs", getAuditLogsController);
adminRouter.delete("/admin/audit-logs/:id", deleteAuditLogAdminController);

// ======== MEDIA ========
adminRouter.post("/admin/upload", upload.single("file"), uploadFileController);
adminRouter.post("/admin/media/upload-intent", createUploadIntentController);
adminRouter.post("/admin/media/assets", registerMediaAssetController);
adminRouter.get("/admin/media/assets", listMediaAssetsController);

// ======== GENERATION ========
adminRouter.post("/admin/generation/script-to-ppt-video", createScriptToPptVideoController);
adminRouter.get("/admin/generation/jobs", listGenerationJobsController);
adminRouter.post("/admin/generation/jobs/:id/retry", retryGenerationJobController);

// ======== RBAC / SETTINGS / FLAGS ========
adminRouter.get("/admin/rbac/roles", getRbacRolesController);
adminRouter.get("/admin/settings/:key", getSystemSettingController);
adminRouter.put("/admin/settings/:key", upsertSystemSettingController);
adminRouter.get("/admin/feature-flags/:key", getFeatureFlagController);
adminRouter.put("/admin/feature-flags/:key", upsertFeatureFlagController);

// ======== SUCCESS STORIES ========
adminRouter.get("/admin/success-stories", listSuccessStoriesAdminController);
adminRouter.post("/admin/success-stories", createSuccessStoryAdminController);
adminRouter.patch("/admin/success-stories/:id", updateSuccessStoryAdminController);
adminRouter.delete("/admin/success-stories/:id", deleteSuccessStoryAdminController);

// ======== QUIZ POLICY ========
adminRouter.get("/admin/quiz-policy", getQuizPolicyAdminController);
adminRouter.put("/admin/quiz-policy", upsertQuizPolicyAdminController);
adminRouter.get("/admin/quiz-policy/compliance", getQuizPolicyComplianceAdminController);

// ======== TODAY CONTROLS ========
adminRouter.get("/admin/control-center/today", getTodayExperienceControlsController);
adminRouter.put("/admin/control-center/today", upsertTodayExperienceControlsController);

// ======== COMMUNITY MESSAGES ========
adminRouter.get("/admin/community/messages", listCommunityMessagesAdminController);
adminRouter.patch("/admin/community/messages/:id/moderate", moderateCommunityMessageAdminController);

// ======== COURSE OPS ========
adminRouter.get("/admin/courses/:courseId/checklist", getCoursePublishChecklistController);
adminRouter.post("/admin/courses/:courseId/version-snapshot", createCourseVersionSnapshotController);
adminRouter.get("/admin/courses/:courseId/versions", listCourseVersionsController);
adminRouter.post("/admin/courses/:courseId/versions/:versionId/rollback", rollbackCourseVersionController);
adminRouter.post("/admin/courses/bulk-action", bulkCourseActionController);
adminRouter.get("/admin/courses/:courseId/content-quality", getContentQualityController);

// ======== REPORTS ========
adminRouter.get("/admin/reports/revenue", getRevenueReportController);
adminRouter.get("/admin/reports/coupons", getCouponPerformanceController);
adminRouter.get("/admin/reports/refunds", getRefundReportController);
adminRouter.get("/admin/reports/export", exportReportController);
adminRouter.post("/admin/generate-admission-pdf", generateAdmissionPdfController);

export default adminRouter;
