import { Router } from "express";
import { authenticateToken, requireRoles } from "../middlewares/auth.middleware.js";
import {
  getStudentCourseGradesDetailController,
  getStudentGradesController,
  getStudentGradesDetailController
} from "../controllers/student.controller.js";

const studentRouter = Router();

studentRouter.use(authenticateToken);
studentRouter.use(requireRoles("student", "admin"));

studentRouter.get("/student/grades", getStudentGradesController);
studentRouter.get("/student/grades/details", getStudentGradesDetailController);
studentRouter.get("/student/grades/courses/:courseId", getStudentCourseGradesDetailController);

export default studentRouter;
