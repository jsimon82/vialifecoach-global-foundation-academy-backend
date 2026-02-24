import { Router } from "express";
import {
  acknowledgeQuizRulesController,
  getQuizRulesAcceptanceStatusController,
  getQuizRulesController,
} from "../controllers/quiz.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const quizRouter = Router();

quizRouter.get("/quiz/rules", getQuizRulesController);
quizRouter.get("/quiz/rules/status/:courseId", authenticateToken, getQuizRulesAcceptanceStatusController);
quizRouter.post("/quiz/rules/acknowledge", authenticateToken, acknowledgeQuizRulesController);

export default quizRouter;
