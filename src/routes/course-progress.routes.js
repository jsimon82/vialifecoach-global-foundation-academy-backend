// Course Progress Routes
import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { 
  getCourseProgress, 
  markLessonComplete, 
  getModuleAccess 
} from "../controllers/course-progress.controller.js";

const courseProgressRouter = Router();

// All routes require authentication
courseProgressRouter.use(authenticateToken);

// Get course progress and module unlocking status
courseProgressRouter.get("/courses/:courseId/progress", getCourseProgress);

// Mark a lesson as complete
courseProgressRouter.post("/courses/:courseId/modules/:moduleId/lessons/:lessonId/complete", markLessonComplete);

// Check if user can access a specific module
courseProgressRouter.get("/courses/:courseId/modules/:moduleId/access", getModuleAccess);

export default courseProgressRouter;
