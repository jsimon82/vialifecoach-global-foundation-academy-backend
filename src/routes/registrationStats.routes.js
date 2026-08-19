import { Router } from "express";
import {
  getRegistrationStats,
  getRegistrationList,
  exportRegistrations
} from "../controllers/registrationStats.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const registrationStatsRouter = Router();

// Protected routes (require authentication)
registrationStatsRouter.get("/", authenticateToken, getRegistrationStats);
registrationStatsRouter.get("/stats", authenticateToken, getRegistrationStats);
registrationStatsRouter.get("/registrations", authenticateToken, getRegistrationList);
registrationStatsRouter.get("/registrations/export", authenticateToken, exportRegistrations);

export default registrationStatsRouter;
