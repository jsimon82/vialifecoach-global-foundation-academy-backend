import { Router } from "express";
import {
  createPublicRegistration,
  getPublicEvent,
  getPublicEvents,
  getPublicSheetEvents,
  checkRegistrationStatus
} from "../controllers/publicRegistration.controller.js";

const publicRouter = Router();

// Public registration endpoints - NO authentication required
publicRouter.post("/registrations", createPublicRegistration);
publicRouter.get("/events", getPublicEvents);
publicRouter.get("/events/google", getPublicSheetEvents);
publicRouter.get("/events/:id", getPublicEvent);
publicRouter.get("/registrations/status", checkRegistrationStatus);

export default publicRouter;
