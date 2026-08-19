import { Router } from "express";
import {
  getCoordinatorProfile,
  changeCoordinatorPassword,
  createCoordinatorEvent,
  getCoordinatorEvents,
  getCoordinatorEventById,
  updateCoordinatorEvent,
  deleteCoordinatorEvent,
  getCoordinatorEventRegistrations,
  syncCoordinatorEvent,
} from "../controllers/coordinator.controller.js";
import { login } from "../controllers/auth.controller.js";
import { authenticateToken, requireRoles } from "../middlewares/auth.middleware.js";

const coordinatorRouter = Router();

// Public routes - NO authentication required for login
coordinatorRouter.post("/login", (req, res, next) => {
  req.body = {
    ...(req.body || {}),
    scope: "coordinator",
  };
  return login(req, res, next);
});

// Protected routes (require authentication)
coordinatorRouter.get("/profile", authenticateToken, getCoordinatorProfile);
coordinatorRouter.put("/change-password", authenticateToken, changeCoordinatorPassword);

// Coordinator event management
coordinatorRouter.post(
  "/events",
  authenticateToken,
  requireRoles("coordinator"),
  createCoordinatorEvent
);
coordinatorRouter.get(
  "/events",
  authenticateToken,
  requireRoles("coordinator"),
  getCoordinatorEvents
);
coordinatorRouter.get(
  "/events/:id",
  authenticateToken,
  requireRoles("coordinator"),
  getCoordinatorEventById
);
coordinatorRouter.post(
  "/events/:id/sync",
  authenticateToken,
  requireRoles("coordinator"),
  syncCoordinatorEvent
);
coordinatorRouter.put(
  "/events/:id",
  authenticateToken,
  requireRoles("coordinator"),
  updateCoordinatorEvent
);
coordinatorRouter.delete(
  "/events/:id",
  authenticateToken,
  requireRoles("coordinator"),
  deleteCoordinatorEvent
);
coordinatorRouter.get(
  "/events/:id/registrations",
  authenticateToken,
  requireRoles("coordinator"),
  getCoordinatorEventRegistrations
);

export default coordinatorRouter;
