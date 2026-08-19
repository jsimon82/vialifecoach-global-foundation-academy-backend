import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const testRouter = Router();

// Test endpoint that only requires authentication (no role check)
testRouter.get("/auth-test", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Authentication test successful",
    user: req.user
  });
});

// Test endpoint that requires coordinator role
testRouter.get("/coordinator-test", authenticateToken, (req, res) => {
  if (req.user.role === 'coordinator' || req.user.role === 'admin') {
    res.json({
      success: true,
      message: "Coordinator role test successful",
      user: req.user
    });
  } else {
    res.status(403).json({
      success: false,
      message: "Coordinator role required"
    });
  }
});

export default testRouter;
