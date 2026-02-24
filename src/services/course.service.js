import * as CourseModel from '../models/Course.model.js';
import logger from '../utils/logger.js';

export async function createCourse(courseData) {
  try {
    logger.info('Creating new course', { title: courseData.title });
    const course = await CourseModel.createCourse(courseData);
    logger.info('Course created successfully', { courseId: course.id });
    return course;
  } catch (error) {
    logger.error('Error creating course', { error: error.message });
    throw error;
  }
}

export async function getCourseById(id) {
  try {
    logger.info('Fetching course by ID', { courseId: id });
    const course = await CourseModel.getCourseById(id);
    if (!course) {
      logger.warn('Course not found', { courseId: id });
    }
    return course;
  } catch (error) {
    logger.error('Error fetching course', { courseId: id, error: error.message });
    throw error;
  }
}

export async function getAllCourses() {
  try {
    logger.info('Fetching all courses');
    const courses = await CourseModel.getAllCourses();
    logger.info('Courses fetched successfully', { count: courses.length });
    return courses;
  } catch (error) {
    logger.error('Error fetching all courses', { error: error.message });
    throw error;
  }
}

export async function getCourseWithModules(id) {
  try {
    logger.info('Fetching course with modules', { courseId: id });
    const result = await CourseModel.getCourseWithModules(id);
    if (!result) {
      logger.warn('Course with modules not found', { courseId: id });
    }
    return result;
  } catch (error) {
    logger.error('Error fetching course with modules', { courseId: id, error: error.message });
    throw error;
  }
}
