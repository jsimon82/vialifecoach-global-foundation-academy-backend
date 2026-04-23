// ======== GET COURSE BY ID =============
import * as CourseModel from "../models/Course.model.js";
export async function getCourseById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const course = await CourseModel.getCourseById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

import fs from 'fs';

export async function getAllCourses(req, res) {
  const log = (msg) => fs.appendFileSync('debug.log', msg + '\n');
  log('getAllCourses controller invoked');
  try {
    const courses = await CourseModel.getAllCourses();
    log('courses fetched: ' + (Array.isArray(courses) ? courses.length : typeof courses));
    if(!courses){
      log('no courses returned from model');
      return res.status(404).json({message: "No courses found"});
    }
    res.json(courses);
  } catch (error) {
    console.error("Error fetching course:", error);
    log('error in getAllCourses: ' + error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createCourseController(req, res) {
  try {
    const { title, description, instructor_id } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: "title and description are required" });
    }

    const isAdmin = req.user.role === "admin";
    const ownerId = isAdmin && instructor_id ? instructor_id : req.user.id;

    const createdCourse = await CourseModel.createCourse({
      title,
      description,
      instructor_id: ownerId,
    });

    res.status(201).json({
      message: "Course created successfully",
      data: createdCourse,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


// ======== GET COURSE OVERVIEW (with modules & lessons) ===========
export async function handleGetCourseOverview(req, res) {
  try {
    const result = await CourseModel.getCourseWithModules(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Course not found" });
    }

    const { course, moduleLessonRows } = result;

    // Group lessons under modules
    const modules = {};
    moduleLessonRows.forEach(row => {
      if (!modules[row.module_id]) {
        modules[row.module_id] = {
          id: row.module_id,
          title: row.module_title,
          order_index: row.module_order,
          lessons: []
        };
      }

      if (row.lesson_id) {
        modules[row.module_id].lessons.push({
          id: row.lesson_id,
          title: row.lesson_title,
          content_type: row.content_type,
          order_index: row.lesson_order
        });
      }
    });

    res.json({
      ...course,
      modules: Object.values(modules)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// ======== GET COURSE MODULES (public) ===========
export async function getCourseModules(req, res) {
  try {
    const result = await CourseModel.getCourseWithModules(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Course not found" });
    }

    const { moduleLessonRows } = result;
    const modules = {};
    moduleLessonRows.forEach(row => {
      if (!modules[row.module_id]) {
        modules[row.module_id] = {
          id: row.module_id,
          title: row.module_title,
          order_index: row.module_order,
          lessons: []
        };
      }
      if (row.lesson_id) {
        modules[row.module_id].lessons.push({
          id: row.lesson_id,
          title: row.lesson_title,
          content_type: row.content_type,
          order_index: row.lesson_order
        });
      }
    });

    res.json({ success: true, data: Object.values(modules) });
  } catch (error) {
    console.error("Error fetching course modules:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
