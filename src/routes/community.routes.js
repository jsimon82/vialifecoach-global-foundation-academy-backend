import { Router } from "express";
import { authenticateToken, optionalAuthenticateToken } from "../middlewares/auth.middleware.js";
import {
  deleteChatMessageController,
  createDiscussionPostController,
  createDiscussionReplyController,
  createCommunitySuccessStoryController,
  deleteConversationController,
  editChatMessageController,
  getChatContactProfileController,
  getCommunityProfileByUserIdController,
  getDeletedConversationsController,
  getSuccessStoryPermissionsController,
  getChatMessagesController,
  joinCommunityChallengeController,
  listCommunityMentorsController,
  listCommunitySuccessStoriesController,
  listChatContactsController,
  listCommunityChallengesController,
  listCommunityEventsController,
  listDiscussionsController,
  registerCommunityEventController,
  requestMentorshipController,
  markChatMessageReadController,
  restoreConversationController,
  sendChatMessageController,
} from "../controllers/community.controller.js";

const communityRouter = Router();

communityRouter.get("/community/events", listCommunityEventsController);
communityRouter.post("/community/events/:eventId/register", optionalAuthenticateToken, registerCommunityEventController);

communityRouter.get("/community/discussions", authenticateToken, listDiscussionsController);
communityRouter.post("/community/discussions", authenticateToken, createDiscussionPostController);
communityRouter.post("/community/discussions/:postId/replies", authenticateToken, createDiscussionReplyController);

communityRouter.get("/community/chat/contacts", authenticateToken, listChatContactsController);
communityRouter.get("/community/chat/contacts/:contactId/profile", authenticateToken, getChatContactProfileController);
communityRouter.get("/community/profiles/:userId", authenticateToken, getCommunityProfileByUserIdController);
communityRouter.get("/community/chat/messages/:contactId", authenticateToken, getChatMessagesController);
communityRouter.post("/community/chat/messages/:contactId", authenticateToken, sendChatMessageController);
communityRouter.patch("/community/chat/messages/:messageId", authenticateToken, editChatMessageController);
communityRouter.delete("/community/chat/messages/:messageId", authenticateToken, deleteChatMessageController);
communityRouter.post("/community/chat/messages/:messageId/read", authenticateToken, markChatMessageReadController);
communityRouter.delete("/community/chat/conversations/:contactId", authenticateToken, deleteConversationController);

communityRouter.get("/community/challenges", listCommunityChallengesController);
communityRouter.post("/community/challenges/:challengeId/join", optionalAuthenticateToken, joinCommunityChallengeController);

communityRouter.get("/community/success-stories", listCommunitySuccessStoriesController);
communityRouter.post("/community/success-stories", authenticateToken, createCommunitySuccessStoryController);
communityRouter.get("/community/success-stories/can-post", authenticateToken, getSuccessStoryPermissionsController);

communityRouter.get("/community/mentors", authenticateToken, listCommunityMentorsController);
communityRouter.post("/community/mentors/:mentorId/request", authenticateToken, requestMentorshipController);

// ======== ADMIN CONVERSATION AUDIT ROUTES ========
communityRouter.get(
  "/admin/community/deleted-conversations",
  authenticateToken,
  (req, res, next) => {
    console.log('🔍 Admin route - User info:', req.user);
    console.log('🔍 Admin route - User role:', req.user?.role);
    console.log('🔍 Admin route - User role type:', typeof req.user?.role);
    console.log('🔍 Admin route - Normalized role:', req.user?.role ? req.user.role.toLowerCase() : 'undefined');
    
    // Only allow admin - try multiple checks
    const userRole = req.user?.role;
    const isAdmin = userRole === "admin" || userRole === "Admin" || (typeof userRole === 'string' && userRole.toLowerCase() === 'admin');
    
    if (!isAdmin) {
      console.log('❌ Admin route - Access denied for role:', userRole);
      return res.status(403).json({ message: "You are not authorized", role: userRole });
    }
    
    console.log('✅ Admin route - Access granted for admin');
    next();
  },
  getDeletedConversationsController
);

communityRouter.post(
  "/admin/community/restore-conversations",
  authenticateToken,
  (req, res, next) => {
    console.log('🔍 Admin restore route - User info:', req.user);
    console.log('🔍 Admin restore route - User role:', req.user?.role);
    
    // Only allow admin
    if (req.user.role !== "admin") {
      console.log('❌ Admin restore route - Access denied for role:', req.user?.role);
      return res.status(403).json({ message: "You are not authorized" });
    }
    
    console.log('✅ Admin restore route - Access granted for admin');
    next();
  },
  restoreConversationController
);

export default communityRouter;
