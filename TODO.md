# LMS Backend Upgrade - TODO

## Phase 1 — Database Schema Extensions
- [ ] Extend `courses` table with new columns (status, level, subtitle, etc.)
- [ ] Add `lesson_content` table
- [ ] Add `quizzes` table
- [ ] Add `quiz_questions` table
- [ ] Add `quiz_answers` table
- [ ] Add `quiz_results` table
- [ ] Add `progress` table
- [ ] Add `certificates` table
- [ ] Add `support_tickets` table
- [ ] Add `support_ticket_replies` table
- [ ] Add `announcements` table

## Phase 2 — Full Course Management APIs
- [ ] Extend `Course.model.js` (update, delete, duplicate, publish/unpublish)
- [ ] Create `Module.model.js`
- [ ] Create `Lesson.model.js`
- [ ] Create `LessonContent.model.js`
- [ ] Extend `course.controller.js`
- [ ] Create `module.controller.js`
- [ ] Create `lesson.controller.js`
- [ ] Extend `course.routes.js`
- [ ] Create `module.routes.js`

## Phase 3 — Quiz Builder APIs
- [ ] Create `Quiz.model.js`
- [ ] Extend `quiz.controller.js`
- [ ] Extend `quiz.routes.js`

## Phase 4 — Enhanced Admin Dashboard & Analytics
- [ ] Extend `User.model.js` with growth/analytics queries
- [ ] Extend `admin.controller.js` with analytics
- [ ] Add analytics routes to `admin.routes.js`

## Phase 5 — User Management Extensions
- [ ] Extend `User.model.js` (suspend, activate, deactivate)
- [ ] Extend `admin.controller.js` with user management
- [ ] Add user management routes

## Phase 6 — Enrollment Management
- [ ] Extend `enrolement.model.js` (manual enroll, progress, certificates)
- [ ] Extend `admin.controller.js` with enrollment management
- [ ] Add enrollment management routes

## Phase 7 — Support Ticket System
- [ ] Create `SupportTicket.model.js`
- [ ] Create `support.controller.js`
- [ ] Create `support.routes.js`
- [ ] Register support routes in `app.js`
