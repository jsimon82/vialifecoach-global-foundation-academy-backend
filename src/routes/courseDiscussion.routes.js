import { Router } from "express";
import { authenticateToken, requireRoles } from "../middlewares/auth.middleware.js";
import {
  createCourseDiscussionController,
  getCourseDiscussionsController,
  getDiscussionByIdController,
  addCommentController,
  gradeStudentController,
  getStudentParticipationController,
  getDiscussionGradesController
} from "../controllers/courseDiscussion.controller.js";

const router = Router();

// Course discussion routes
router.post("/courses/:courseId/discussions", authenticateToken, requireRoles(["instructor", "admin"]), createCourseDiscussionController);
router.get("/courses/:courseId/discussions", getCourseDiscussionsController);
router.get("/discussions/:discussionId", getDiscussionByIdController);
router.post("/discussions/:discussionId/comments", authenticateToken, addCommentController);

// Grading routes (instructors only)
router.post("/discussions/:discussionId/grade", authenticateToken, requireRoles(["instructor", "admin"]), gradeStudentController);
router.get("/discussions/:discussionId/grades", authenticateToken, requireRoles(["instructor", "admin"]), getDiscussionGradesController);

// Student participation routes
router.get("/courses/:courseId/discussions/my-participation", authenticateToken, getStudentParticipationController);

export default router;
