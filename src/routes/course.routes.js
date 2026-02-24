import { Router } from "express";
import { 
    getCourseById,
    getAllCourses,
    createCourseController,
    handleGetCourseOverview
 } from "../controllers/course.controller.js";
import { authenticateToken, requireRoles } from "../middlewares/auth.middleware.js";

const courseRouter = Router();

courseRouter.get('/courses/:id', getCourseById);
courseRouter.get('/courses',getAllCourses)
courseRouter.post('/courses', authenticateToken, requireRoles("instructor", "lecturer", "admin"), createCourseController);
courseRouter.get('/courses/:id/overview',handleGetCourseOverview);

export default courseRouter;
