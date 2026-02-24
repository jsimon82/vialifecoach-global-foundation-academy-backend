//====get ENrolments by user id ===============
import * as EnrollementModel from "../models/enrolement.model.js";

export async function getEnrollementsByUserId(req, res) {
  try {
    const userId = parseInt(req.params.userId, 10);
    const enrollements = await EnrollementModel.getEnrollementsByUserId(userId);
    if (!enrollements) {
      return res.status(404).json({ message: "No enrollements found for this user" });
    }
    res.json(enrollements);
  } catch (error) {
    console.error("Error fetching enrollements:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}           
//====get ENrolments by course id ===============
export async function getEnrollementsByCourseId(req, res) {         

    try {
        const courseId = parseInt(req.params.courseId, 10);
        const enrollements = await EnrollementModel.getEnrollementsByCourseId(courseId);
        if (!enrollements) {
        return res.status(404).json({ message: "No enrollements found for this course" });
        }
        res.json(enrollements);
    } catch (error) {
        console.error("Error fetching enrollements:", error);
        res.status(500).json({ message: "Internal server error" });
    }
    }   
//====create Enrolment ===============
export async function createEnrollement(req, res) { 
    try {
        console.log(req.body);
        const { userId, courseId } = req.body;
        if (!userId || !courseId) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const enrollementId = await EnrollementModel.enrollUserInCourse(userId, courseId);
        res.status(201).json({ message: "Enrollement created", enrollementId });
    } catch (error) {
        console.error("Error creating enrollement:", error);
        res.status(500).json({ message: "Server error" });
    }
}                   
//====delete Enrolment ===============
export async function deleteEnrollement(req, res) {         
    try {
        const enrollementId = parseInt(req.params.id, 10);
        const deleted = await EnrollementModel.deleteEnrollement(enrollementId);
        if (deleted === 0) {
            return res.status(404).json({ message: "Enrollement not found" });
        }
        res.json({ message: "Enrollement deleted" });
    } catch (error) {
        console.error("Error deleting enrollement:", error);
        res.status(500).json({ message: "Server error" });
    }
}   
//====get ALL Enrolments ===============
export async function getAllEnrollements(req, res) {         
    try {
        const enrollements = await EnrollementModel.getAllEnrollements();
        if (!enrollements) {
            return res.status(404).json({ message: "No enrollements found" });
        }
        res.json(enrollements);
    } catch (error) {
        console.error("Error fetching enrollements:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}       
//====get ENrolment by ID ===============
export async function getEnrollementById(req, res) {     
    try {
        const enrollementId = parseInt(req.params.id, 10);
        const enrollement = await EnrollementModel.getEnrollementById(enrollementId);
        if (!enrollement) {
            return res.status(404).json({ message: "Enrollement not found" });
        }
        res.json(enrollement);
    } catch (error) {
        console.error("Error fetching enrollement:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

