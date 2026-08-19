import { Router } from "express";
import {
  syncEvent,
  syncEvents,
  getSyncStatus,
  deleteSync
} from "../controllers/eventSync.controller.js";

const eventSyncRouter = Router();

// Event sync endpoints - NO authentication required for community integration
eventSyncRouter.post("/events", syncEvent);
eventSyncRouter.post("/events/batch", syncEvents);
eventSyncRouter.get("/events/status", getSyncStatus);
eventSyncRouter.delete("/events/:community_event_id", deleteSync);

export default eventSyncRouter;
