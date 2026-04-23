import { catchAsync } from "../utils/asyncHelpers.js";
import { AppError } from "../utils/AppError.js";
import * as CourseDiscussionModel from "../models/CourseDiscussion.model.js";

// ====== CREATE COURSE DISCUSSION ========
export const createCourseDiscussionController = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { title, content, type = 'general' } = req.body;
  const instructorId = req.user.id;

  // Verify user is an instructor
  if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
    throw new AppError('Only instructors can create discussions', 403);
  }

  const discussion = await CourseDiscussionModel.createCourseDiscussion(
    courseId, 
    instructorId, 
    title, 
    content, 
    type
  );

  res.status(201).json({
    success: true,
    message: 'Discussion created successfully',
    data: discussion
  });
});

// ====== GET COURSE DISCUSSIONS ========
export const getCourseDiscussionsController = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  
  const discussions = await CourseDiscussionModel.getCourseDiscussions(courseId);

  res.json({
    success: true,
    data: discussions
  });
});

// ====== GET DISCUSSION BY ID ========
export const getDiscussionByIdController = catchAsync(async (req, res) => {
  const { discussionId } = req.params;
  
  const discussion = await CourseDiscussionModel.getDiscussionById(discussionId);
  if (!discussion) {
    throw new AppError('Discussion not found', 404);
  }

  // Get comments for this discussion
  const comments = await CourseDiscussionModel.getDiscussionComments(discussionId);

  res.json({
    success: true,
    data: {
      ...discussion,
      comments
    }
  });
});

// ====== ADD COMMENT TO DISCUSSION ========
export const addCommentController = catchAsync(async (req, res) => {
  const { discussionId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim() === '') {
    throw new AppError('Comment content is required', 400);
  }

  const comment = await CourseDiscussionModel.addDiscussionComment(
    discussionId, 
    userId, 
    content.trim()
  );

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: comment
  });
});

// ====== GRADE STUDENT PARTICIPATION ========
export const gradeStudentController = catchAsync(async (req, res) => {
  const { discussionId } = req.params;
  const { studentId, grade, feedback } = req.body;
  const instructorId = req.user.id;

  // Verify user is an instructor
  if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
    throw new AppError('Only instructors can grade students', 403);
  }

  // Validate grade
  if (grade < 0 || grade > 100) {
    throw new AppError('Grade must be between 0 and 100', 400);
  }

  const gradeRecord = await CourseDiscussionModel.gradeStudentParticipation(
    discussionId, 
    studentId, 
    grade, 
    feedback
  );

  res.json({
    success: true,
    message: 'Student graded successfully',
    data: gradeRecord
  });
});

// ====== GET STUDENT PARTICIPATION STATUS ========
export const getStudentParticipationController = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.id;

  const participation = await CourseDiscussionModel.getStudentParticipationStatus(
    courseId, 
    studentId
  );

  res.json({
    success: true,
    data: participation
  });
});

// ====== GET DISCUSSION GRADES (for instructors) ========
export const getDiscussionGradesController = catchAsync(async (req, res) => {
  const { discussionId } = req.params;
  const instructorId = req.user.id;

  // Verify user is an instructor
  if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
    throw new AppError('Only instructors can view grades', 403);
  }

  const grades = await CourseDiscussionModel.getDiscussionGrades(discussionId);

  res.json({
    success: true,
    data: grades
  });
});
