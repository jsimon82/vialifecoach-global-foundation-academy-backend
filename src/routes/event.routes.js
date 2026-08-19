import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getAllRegistrations,
  createRegistration,
  updateRegistration,
  deleteRegistration,
  sendReminderEmails,
  getEmailCampaigns,
  getRegistrationStats
} from "../controllers/event.controller.js";

const eventRouter = Router();

// Event routes
eventRouter.get("/events", authenticateToken, getAllEvents);
eventRouter.get("/events/:id", authenticateToken, getEventById);
eventRouter.post("/events", authenticateToken, createEvent);
eventRouter.put("/events/:id", authenticateToken, updateEvent);
eventRouter.delete("/events/:id", authenticateToken, deleteEvent);

// Registration routes
eventRouter.get("/registrations", authenticateToken, getAllRegistrations);
eventRouter.post("/registrations", createRegistration); // Public endpoint for registration
eventRouter.put("/registrations/:id", authenticateToken, updateRegistration);
eventRouter.delete("/registrations/:id", authenticateToken, deleteRegistration);

// Email campaign routes
eventRouter.post("/events/:id/send-reminders", authenticateToken, sendReminderEmails);
eventRouter.get("/email-campaigns", authenticateToken, getEmailCampaigns);

// Statistics routes
eventRouter.get("/registration-stats", authenticateToken, getRegistrationStats);

export default eventRouter;
