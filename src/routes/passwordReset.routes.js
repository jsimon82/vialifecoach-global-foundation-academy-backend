import { Router } from "express";
import { forgotPassword } from "../controllers/auth.controller.js";

const passwordResetRouter = Router();

// Password reset route - no authentication required
passwordResetRouter.post("/forgot-password", forgotPassword);

export default passwordResetRouter;
