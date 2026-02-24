import { Router } from "express";
import { submitTicket, submitBooking } from "../controllers/support.controller.js";

const router = Router();

// no authentication required; simple public endpoints
router.post("/support/ticket", submitTicket);
router.post("/support/booking", submitBooking);

export default router;
