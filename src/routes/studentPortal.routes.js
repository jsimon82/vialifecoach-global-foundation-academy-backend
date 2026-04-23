// src/routes/studentPortal.routes.js

import { Router } from "express";
import { authenticateToken, requireRoles } from "../middlewares/auth.middleware.js";

// Import controllers for student portal features
import {
  getStudentCourseGradesDetailController,
  getStudentCatalogController,
  getStudentGradesDetailController,
  getStudentGradesController,
  getStudentDashboardController
} from "../controllers/student.controller.js";

import { 
  getCourseByIdController,
  getAllCoursesController,
  handleGetCourseOverview // placeholder function, see below
} from "../controllers/course.controller.js";

import {
  acknowledgeQuizRulesController,
  getQuizRulesAcceptanceStatusController,
  getQuizRulesController,
  logQuizViolationController,
} from "../controllers/quiz.controller.js";

import {
  deleteChatMessageController,
  createDiscussionPostController,
  createDiscussionReplyController,
  createCommunitySuccessStoryController,
  editChatMessageController,
  getChatContactProfileController,
  getCommunityProfileByUserIdController,
  getSuccessStoryPermissionsController,
  getChatMessagesController,
  joinCommunityChallengeController,
  listCommunityMentorsController,
  listCommunitySuccessStoriesController,
  listChatContactsController,
  listCommunityChallengesController,
  listCommunityEventsController,
  listDiscussionGroupsController,
  listDiscussionsController,
  listRecentLiveMessagesController,
  markChatMessageReadController,
  registerCommunityEventController,
  requestMentorshipController,
  sendChatMessageController,
  deleteConversationController,
} from "../controllers/community.controller.js";

import { getMe, updateMe } from "../controllers/auth.controller.js";

import {
  createEnrollement,
  deleteEnrollement,
  getAllEnrollements,
  getEnrollementById,
  getEnrollementsByCourseId,
  getEnrollementsByUserId,
} from "../controllers/enrolement.controller.js";

import {
  addMyTicketReply,
  getMyTicketById,
  listMyTickets,
  submitTicket
} from "../controllers/support.controller.js";

const studentPortalRouter = Router();

// Debug middleware to log all requests
studentPortalRouter.use((req, res, next) => {
  console.log('🔍 Student Portal Request:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    user: req.user
  });
  next();
});

// Public test route
studentPortalRouter.get("/test", (req, res) => {
  res.json({
    message: "Student portal router is working!",
    timestamp: new Date().toISOString()
  });
});

// All student portal routes require authentication
studentPortalRouter.use(authenticateToken);

// Debug route to test authentication
studentPortalRouter.get("/debug", (req, res) => {
  res.json({
    message: "Debug route working!",
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// ======== STUDENT DASHBOARD & PROFILE ========
studentPortalRouter.get("/dashboard", getStudentDashboardController);
studentPortalRouter.get("/profile", getMe);
studentPortalRouter.patch("/profile", updateMe);

// ======== COURSES (Student View) ========
studentPortalRouter.get("/catalog", getStudentCatalogController);
studentPortalRouter.get("/courses", getAllCoursesController);
studentPortalRouter.get("/courses/:id", getCourseByIdController);
studentPortalRouter.get("/courses/:id/overview", handleGetCourseOverview);

// ======== GRADES ========
studentPortalRouter.get("/grades", getStudentGradesController);
studentPortalRouter.get("/grades/details", getStudentGradesDetailController);
studentPortalRouter.get("/grades/courses/:courseId", getStudentCourseGradesDetailController);

// ======== QUIZ FEATURES ========
studentPortalRouter.get("/quiz/rules", getQuizRulesController);
studentPortalRouter.get("/quiz/rules/status/:courseId", getQuizRulesAcceptanceStatusController);
studentPortalRouter.post("/quiz/rules/acknowledge", acknowledgeQuizRulesController);
studentPortalRouter.post("/quiz/rules/violation", logQuizViolationController);

// ======== COMMUNITY FEATURES ========
// Events
studentPortalRouter.get("/community/events", listCommunityEventsController);
studentPortalRouter.post("/community/events/:eventId/register", registerCommunityEventController);

// Discussions
studentPortalRouter.get("/community/discussion-groups", listDiscussionGroupsController);
studentPortalRouter.get("/community/discussions", listDiscussionsController);
studentPortalRouter.post("/community/discussions", createDiscussionPostController);
studentPortalRouter.post("/community/discussions/:postId/replies", createDiscussionReplyController);

// Chat & Messaging
studentPortalRouter.get("/community/live/messages", listRecentLiveMessagesController);
studentPortalRouter.get("/community/chat/contacts", listChatContactsController);
studentPortalRouter.get("/community/chat/contacts/:contactId/profile", getChatContactProfileController);
studentPortalRouter.get("/community/profiles/:userId", getCommunityProfileByUserIdController);
studentPortalRouter.get("/community/chat/messages/:contactId", getChatMessagesController);
studentPortalRouter.post("/community/chat/messages/:contactId", sendChatMessageController);
studentPortalRouter.patch("/community/chat/messages/:messageId", editChatMessageController);
studentPortalRouter.delete("/community/chat/messages/:messageId", deleteChatMessageController);
studentPortalRouter.post("/community/chat/messages/:messageId/read", markChatMessageReadController);
studentPortalRouter.delete("/community/chat/conversations/:contactId", deleteConversationController);

// Challenges
studentPortalRouter.get("/community/challenges", listCommunityChallengesController);
studentPortalRouter.post("/community/challenges/:challengeId/join", joinCommunityChallengeController);

// Success Stories
studentPortalRouter.get("/community/success-stories", listCommunitySuccessStoriesController);
studentPortalRouter.post("/community/success-stories", createCommunitySuccessStoryController);
studentPortalRouter.get("/community/success-stories/can-post", getSuccessStoryPermissionsController);

// Mentorship
studentPortalRouter.get("/community/mentors", listCommunityMentorsController);
studentPortalRouter.post("/community/mentors/:mentorId/request", requestMentorshipController);

// ======== ENROLLMENT MANAGEMENT ========
studentPortalRouter.get("/enrollments", (req, res) =>
  getEnrollementsByUserId({ ...req, params: { userId: req.user.id } }, res)
);
studentPortalRouter.get("/enrollments/course/:courseId", getEnrollementsByCourseId);
studentPortalRouter.post("/enrollments", createEnrollement);
studentPortalRouter.delete("/enrollments/:id", deleteEnrollement);

// ======== SUPPORT & BOOKINGS ========
studentPortalRouter.get("/support/tickets", listMyTickets);
studentPortalRouter.get("/support/tickets/:ticketId", getMyTicketById);
studentPortalRouter.post("/support/tickets/:ticketId/replies", addMyTicketReply);
studentPortalRouter.post("/support/ticket", submitTicket);

export default studentPortalRouter;