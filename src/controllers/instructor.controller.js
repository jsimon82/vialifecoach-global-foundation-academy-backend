
import * as InstructorModel from "../models/Instructor.model.js";
import { AppError } from "../utils/AppError.js";
import { catchAsync } from "../utils/asyncHelpers.js";

// ====== GET INSTRUCTOR BY ID =======

export const getInstructorByIdController = catchAsync(async(req,res)=>{

        const { id } = req.params;
        const instructor = await InstructorModel.getInstructorById(id);
        if(!instructor) throw new AppError("Instructor not found",404);
        res.json({ success: true, data: instructor });
    }
)

// ========= GET ALL INSTRUCTORS =============
export const getAllInstructorsController = catchAsync(async (req, res) => {
    const instructors = await InstructorModel.getAllInstructors();
    if(!instructors) throw new AppError("No instructors found",404);
    res.json({ success: true, data: instructors });
}
)
