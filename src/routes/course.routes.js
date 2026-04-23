import { Router } from "express";
import { 
    getCourseById,
    getAllCourses,
    createCourseController,
    handleGetCourseOverview,
    getCourseModules
 } from "../controllers/course.controller.js";
import { authenticateToken, requireRoles } from "../middlewares/auth.middleware.js";

const courseRouter = Router();

courseRouter.get('/courses/:id', getCourseById);
courseRouter.get('/courses',getAllCourses)
courseRouter.post('/courses', authenticateToken, requireRoles("instructor", "lecturer", "admin"), createCourseController);
courseRouter.get('/courses/:id/overview',handleGetCourseOverview);
courseRouter.get('/courses/:id/modules', getCourseModules);
courseRouter.get('/courses/:id/modules-with-lessons', getCourseModules);

export default courseRouter;
