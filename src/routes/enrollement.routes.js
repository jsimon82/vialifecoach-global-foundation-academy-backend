import { Router } from "express";
import { createEnrollement } from "../controllers/enrolement.controller.js";

const enrolementRouter = Router();

enrolementRouter.post('/enroll', createEnrollement)

export default enrolementRouter;