import { Router } from "express";
import { recordSiteVisitController, recordShareClickController } from "../controllers/analytics.controller.js";

const analyticsRouter = Router();

analyticsRouter.post("/analytics/visit", recordSiteVisitController);
analyticsRouter.post("/analytics/share-click", recordShareClickController);

export default analyticsRouter;
