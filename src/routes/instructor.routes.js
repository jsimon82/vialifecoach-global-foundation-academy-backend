import { Router } from "express";
import {
    getAllInstructorsController,
    getInstructorByIdController
} from '../controllers/instructor.controller.js';

const instructorRouter = Router()

instructorRouter.get("/instructors", getAllInstructorsController);
instructorRouter.get("/instructors/:id", getInstructorByIdController);

export default instructorRouter
