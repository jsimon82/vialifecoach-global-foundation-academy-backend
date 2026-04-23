import { Router } from "express";
import { 
  createLearningResourceController, 
  getAllLearningResourcesController, 
  getLearningResourceByIdController,
  updateLearningResourceController,
  deleteLearningResourceController,
  getLearningResourceCategoriesController
} from "../controllers/learning-resource.controller.js";
import { authenticateToken, optionalAuthenticateToken } from "../middlewares/auth.middleware.js";

const learningResourcesRouter = Router();

// Public routes - anyone can view resources
learningResourcesRouter.get("/learning-resources", getAllLearningResourcesController);
learningResourcesRouter.get("/learning-resources/categories", getLearningResourceCategoriesController);
learningResourcesRouter.get("/learning-resources/:id", getLearningResourceByIdController);

// Admin routes - require authentication and admin role
learningResourcesRouter.post("/admin/learning-resources", authenticateToken, createLearningResourceController);
learningResourcesRouter.patch("/admin/learning-resources/:id", authenticateToken, updateLearningResourceController);
learningResourcesRouter.delete("/admin/learning-resources/:id", authenticateToken, deleteLearningResourceController);

export default learningResourcesRouter;
