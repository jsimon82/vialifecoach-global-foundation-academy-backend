import { pool } from "../config/postgres.js";

const STAFF_ROLES = new Set(["admin", "owner", "manager", "content_editor", "support", "instructor", "lecturer"]);
const SUCCESS_STORY_EXTRA_ROLES = new Set(["alumni", "organization", "partner"]);

async function isFeatureEnabled(key, fallback = true) {
  const row = await pool.query(`SELECT enabled FROM feature_flags WHERE key = $1 LIMIT 1`, [key]);
  if (!row.rows[0]) return fallback;
  return Boolean(row.rows[0].enabled);
}

async function isEnrolledUser(userId) {
  if (!userId) return false;
  const q = await pool.query(`SELECT 1 FROM enrollment WHERE user_id = $1 LIMIT 1`, [userId]);
  return q.rowCount > 0;
}

async function isMentorUser(userId) {
  if (!userId) return false;
  const q = await pool.query(
    `SELECT 1 FROM community_mentors WHERE user_id = $1 AND is_active = TRUE LIMIT 1`,
    [userId]
  );
  return q.rowCount > 0;
}

async function canAccessRestrictedCommunity(user) {
  if (!user?.id) {
    console.log('Access denied - no user ID');
    return false;
  }
  
  const userRole = String(user.role || "").toLowerCase();
  console.log('Checking access for user:', user.id, 'with role:', userRole);
  
  // Admins have full access
  if (userRole === 'admin') {
    console.log('Access granted - admin role:', userRole);
    return true;
  }
  
  if (STAFF_ROLES.has(userRole)) {
    console.log('Access granted - staff role:', userRole);
    return true;
  }
  
  const [enrolled, mentor] = await Promise.all([isEnrolledUser(user.id), isMentorUser(user.id)]);
  console.log('Enrolled:', enrolled, 'Mentor:', mentor);
  
  const hasAccess = enrolled || mentor;
  console.log('Final access decision:', hasAccess);
  
  return hasAccess;
}

async function canAccessSuccessStories(user) {
  if (!user?.id) return false;
  const role = String(user.role || "").toLowerCase();
  if (STAFF_ROLES.has(role) || SUCCESS_STORY_EXTRA_ROLES.has(role)) return true;
  const [enrolled, mentor] = await Promise.all([isEnrolledUser(user.id), isMentorUser(user.id)]);
  return enrolled || mentor;
}

async function loadCommunityProfile(userId) {
  const profileQ = await pool.query(
    `SELECT
       id,
       name,
       email,
       role,
       status,
       photo_url,
       bio,
       city,
       state,
       country,
       phone,
       last_active_at,
       created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );
  const profile = profileQ.rows[0];
  if (!profile) return null;

  const enrollmentsQ = await pool.query(
    `SELECT
       c.id,
       c.title,
       c.slug,
       c.thumbnail_url,
       e.enrolled_at,
       e.completed_at
     FROM enrollment e
     JOIN courses c ON c.id = e.course_id
     WHERE e.user_id = $1
     ORDER BY e.enrolled_at DESC`,
    [userId]
  );

  return {
    ...profile,
    enrolled_courses: enrollmentsQ.rows,
  };
}

export async function listDiscussionsController(req, res) {
  try {
    if (!(await canAccessRestrictedCommunity(req.user))) {
      return res.status(403).json({ message: "Community discussions are available only to enrolled students, lecturers, and mentors." });
    }
    const courseId = req.query.courseId ? Number(req.query.courseId) : null;
    const where = [];
    const params = [];
    if (courseId) {
      params.push(courseId);
      where.push(`p.course_id = $${params.length}`);
    }

    let query = `
      SELECT p.id, p.course_id, p.user_id, p.content, p.created_at, p.updated_at,
             u.name AS author_name, u.role AS author_role
      FROM community_posts p
      JOIN users u ON u.id = p.user_id
    `;
    if (where.length) query += ` WHERE ${where.join(" AND ")}`;
    query += ` ORDER BY p.created_at DESC LIMIT 200`;

    const postsQ = await pool.query(query, params);
    const postIds = postsQ.rows.map((p) => p.id);

    let replies = [];
    if (postIds.length) {
      const repliesQ = await pool.query(
        `SELECT r.id, r.post_id, r.user_id, r.content, r.created_at,
                u.name AS author_name, u.role AS author_role
         FROM community_post_replies r
         JOIN users u ON u.id = r.user_id
         WHERE r.post_id = ANY($1::int[])
         ORDER BY r.created_at ASC`,
        [postIds]
      );
      replies = repliesQ.rows;
    }

    const byPost = new Map();
    for (const reply of replies) {
      const list = byPost.get(reply.post_id) || [];
      list.push(reply);
      byPost.set(reply.post_id, list);
    }

    const data = postsQ.rows.map((post) => ({
      ...post,
      replies: byPost.get(post.id) || [],
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error listing discussions:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function createDiscussionPostController(req, res) {
  try {
    if (!(await canAccessRestrictedCommunity(req.user))) {
      return res.status(403).json({ message: "You need enrollment (or lecturer/mentor access) to post in discussions." });
    }
    const { courseId = null, content } = req.body || {};
    if (!content || !String(content).trim()) {
      return res.status(400).json({ message: "content is required" });
    }

    const out = await pool.query(
      `INSERT INTO community_posts (course_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [courseId ? Number(courseId) : null, req.user.id, String(content).trim()]
    );
    return res.status(201).json({ success: true, data: out.rows[0] });
  } catch (error) {
    console.error("Error creating discussion post:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function createDiscussionReplyController(req, res) {
  try {
    if (!(await canAccessRestrictedCommunity(req.user))) {
      return res.status(403).json({ message: "You need enrollment (or lecturer/mentor access) to reply in discussions." });
    }
    const postId = Number(req.params.postId);
    const { content } = req.body || {};
    if (!postId || !content || !String(content).trim()) {
      return res.status(400).json({ message: "postId and content are required" });
    }
    const out = await pool.query(
      `INSERT INTO community_post_replies (post_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [postId, req.user.id, String(content).trim()]
    );
    return res.status(201).json({ success: true, data: out.rows[0] });
  } catch (error) {
    console.error("Error creating discussion reply:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listChatContactsController(req, res) {
  try {
    if (!(await isFeatureEnabled("student_live_messages_enabled", true))) {
      return res.status(403).json({ message: "Live messages are currently disabled by admin." });
    }
    if (!(await canAccessRestrictedCommunity(req.user))) {
      return res.status(403).json({ message: "Community chat is available only to enrolled students, lecturers, and mentors." });
    }
    const activeOnly = String(req.query.activeOnly || "").toLowerCase() === "true";
    const rows = await pool.query(
      `SELECT
         u.id,
         u.name,
         u.role,
         u.status,
         CASE WHEN COALESCE(lm.is_deleted, FALSE) = TRUE THEN 'message deleted' ELSE lm.content END AS last_message,
         lm.created_at AS last_message_at,
         COALESCE(unread.unread_count, 0)::int AS unread_count
       FROM users u
       LEFT JOIN LATERAL (
         SELECT m.content, m.created_at, m.is_deleted
         FROM community_messages m
         WHERE
           (m.sender_id = $1 AND m.recipient_id = u.id)
           OR
           (m.sender_id = u.id AND m.recipient_id = $1)
         ORDER BY m.created_at DESC
         LIMIT 1
       ) lm ON TRUE
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS unread_count
         FROM community_messages m
         WHERE m.sender_id = u.id
           AND m.recipient_id = $1
           AND COALESCE(m.is_read, FALSE) = FALSE
           AND COALESCE(m.is_deleted, FALSE) = FALSE
       ) unread ON TRUE
       WHERE u.id <> $1
         ${activeOnly ? "AND LOWER(COALESCE(u.status, '')) = 'active'" : ""}
         AND LOWER(TRIM(COALESCE(u.name, ''))) NOT IN ('test student', 'demo student', 'sample student')
       ORDER BY
         lm.created_at DESC NULLS LAST,
         CASE
           WHEN LOWER(u.role) IN ('instructor', 'lecturer') THEN 0
           WHEN LOWER(u.role) = 'student' THEN 1
           ELSE 2
         END ASC,
         u.last_active_at DESC NULLS LAST,
         u.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows.rows });
  } catch (error) {
    console.error("Error listing chat contacts:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getChatContactProfileController(req, res) {
  try {
    if (!(await isFeatureEnabled("student_profile_view_enabled", true))) {
      return res.status(403).json({ message: "Profile viewing is currently disabled by admin." });
    }
    if (!(await canAccessRestrictedCommunity(req.user))) {
      return res.status(403).json({ message: "Community chat is available only to enrolled students, lecturers, and mentors." });
    }

    const contactId = Number(req.params.contactId);
    if (!contactId) return res.status(400).json({ message: "Valid contactId is required" });
    if (contactId === req.user.id) {
      return res.status(400).json({ message: "You cannot open your own profile from contact view." });
    }

    const profile = await loadCommunityProfile(contactId);
    if (!profile) {
      return res.status(404).json({ message: "Contact not found" });
    }

    return res.json({ success: true, data: profile });
  } catch (error) {
    console.error("Error getting chat contact profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getCommunityProfileByUserIdController(req, res) {
  try {
    if (!(await isFeatureEnabled("student_profile_view_enabled", true))) {
      return res.status(403).json({ message: "Profile viewing is currently disabled by admin." });
    }
    if (!(await canAccessRestrictedCommunity(req.user))) {
      return res.status(403).json({ message: "Community profile is available only to enrolled students, lecturers, and mentors." });
    }
    const userId = Number(req.params.userId);
    if (!userId) return res.status(400).json({ message: "Valid userId is required" });

    const profile = await loadCommunityProfile(userId);
    if (!profile) return res.status(404).json({ message: "User not found" });

    return res.json({ success: true, data: profile });
  } catch (error) {
    console.error("Error getting community profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getChatMessagesController(req, res) {
  try {
    if (!(await isFeatureEnabled("student_live_messages_enabled", true))) {
      return res.status(403).json({ message: "Live messages are currently disabled by admin." });
    }
    if (!(await canAccessRestrictedCommunity(req.user))) {
      return res.status(403).json({ message: "Community chat is available only to enrolled students, lecturers, and mentors." });
    }
    const contactId = Number(req.params.contactId);
    if (!contactId) return res.status(400).json({ message: "Valid contactId is required" });
    if (contactId === req.user.id) {
      return res.status(400).json({ message: "You cannot open a chat with yourself." });
    }

    const contactExists = await pool.query(
      `SELECT id FROM users WHERE id = $1 LIMIT 1`,
      [contactId]
    );
    if (!contactExists.rows[0]) {
      return res.status(404).json({ message: "Contact not found" });
    }

    await pool.query(
      `UPDATE community_messages
       SET is_read = TRUE, read_at = NOW()
       WHERE sender_id = $1
         AND recipient_id = $2
         AND COALESCE(is_read, FALSE) = FALSE`,
      [contactId, req.user.id]
    );

    const rows = await pool.query(
      `SELECT
         id,
         sender_id,
         recipient_id,
         CASE WHEN COALESCE(is_deleted, FALSE) = TRUE THEN 'message deleted' ELSE content END AS content,
         created_at,
         is_read,
         read_at,
         edited_at,
         is_deleted,
         deleted_at
       FROM community_messages
       WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1)
       ORDER BY created_at ASC`,
      [req.user.id, contactId]
    );
    return res.json({ success: true, data: rows.rows });
  } catch (error) {
    console.error("Error getting messages:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function sendChatMessageController(req, res) {
  try {
    if (!(await isFeatureEnabled("student_live_messages_enabled", true))) {
      return res.status(403).json({ message: "Live messages are currently disabled by admin." });
    }
    if (!(await canAccessRestrictedCommunity(req.user))) {
      return res.status(403).json({ message: "Community chat is available only to enrolled students, lecturers, and mentors." });
    }
    const contactId = Number(req.params.contactId);
    const { content } = req.body || {};
    if (!contactId || !content || !String(content).trim()) {
      return res.status(400).json({ message: "contactId and content are required" });
    }
    if (contactId === req.user.id) {
      return res.status(400).json({ message: "You cannot send a message to yourself." });
    }

    const contactExists = await pool.query(
      `SELECT id FROM users WHERE id = $1 LIMIT 1`,
      [contactId]
    );
    if (!contactExists.rows[0]) {
      return res.status(404).json({ message: "Contact not found" });
    }

    const out = await pool.query(
      `INSERT INTO community_messages (sender_id, recipient_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, contactId, String(content).trim()]
    );
    return res.status(201).json({ success: true, data: out.rows[0] });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function editChatMessageController(req, res) {
  try {
    if (!(await isFeatureEnabled("student_live_messages_enabled", true))) {
      return res.status(403).json({ message: "Live messages are currently disabled by admin." });
    }
    if (!(await canAccessRestrictedCommunity(req.user))) {
      return res.status(403).json({ message: "Community chat is available only to enrolled students, lecturers, and mentors." });
    }
    const messageId = Number(req.params.messageId);
    const { content } = req.body || {};
    if (!messageId || !content || !String(content).trim()) {
      return res.status(400).json({ message: "messageId and content are required" });
    }

    const out = await pool.query(
      `UPDATE community_messages
       SET content = $1, edited_at = NOW()
       WHERE id = $2
         AND sender_id = $3
         AND COALESCE(is_deleted, FALSE) = FALSE
       RETURNING id, sender_id, recipient_id, content, created_at, is_read, read_at, edited_at, is_deleted, deleted_at`,
      [String(content).trim(), messageId, req.user.id]
    );
    if (!out.rows[0]) {
      return res.status(403).json({ message: "You can only edit your own messages." });
    }
    return res.json({ success: true, data: out.rows[0] });
  } catch (error) {
    console.error("Error editing message:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deleteChatMessageController(req, res) {
  try {
    if (!(await isFeatureEnabled("student_live_messages_enabled", true))) {
      return res.status(403).json({ message: "Live messages are currently disabled by admin." });
    }
    if (!(await canAccessRestrictedCommunity(req.user))) {
      return res.status(403).json({ message: "Community chat is available only to enrolled students, lecturers, and mentors." });
    }
    const messageId = Number(req.params.messageId);
    if (!messageId) return res.status(400).json({ message: "Valid messageId is required" });

    const out = await pool.query(
      `UPDATE community_messages
       SET is_deleted = TRUE,
           deleted_at = NOW(),
           edited_at = NULL,
           content = 'message deleted'
       WHERE id = $1
         AND sender_id = $2
       RETURNING id`,
      [messageId, req.user.id]
    );
    if (!out.rows[0]) {
      return res.status(403).json({ message: "You can only delete your own messages." });
    }

    return res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function markChatMessageReadController(req, res) {
  try {
    if (!(await isFeatureEnabled("student_live_messages_enabled", true))) {
      return res.status(403).json({ message: "Live messages are currently disabled by admin." });
    }
    if (!(await canAccessRestrictedCommunity(req.user))) {
      return res.status(403).json({ message: "Community chat is available only to enrolled students, lecturers, and mentors." });
    }
    const messageId = Number(req.params.messageId);
    if (!messageId) return res.status(400).json({ message: "Valid messageId is required" });

    const out = await pool.query(
      `UPDATE community_messages
       SET is_read = TRUE, read_at = NOW()
       WHERE id = $1 AND recipient_id = $2
       RETURNING id, sender_id, recipient_id, content, created_at, is_read, read_at, edited_at, is_deleted, deleted_at`,
      [messageId, req.user.id]
    );
    if (!out.rows[0]) {
      return res.status(403).json({ message: "Only the recipient can mark this message as read." });
    }

    return res.json({ success: true, data: out.rows[0] });
  } catch (error) {
    console.error("Error marking message read:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listCommunityEventsController(req, res) {
  try {
    const viewerId = req.user?.id || null;
    const rows = await pool.query(
      `SELECT e.id, e.title, e.description, e.event_type, e.start_at, e.max_spots, e.is_active,
              u.name AS host_name,
              (SELECT COUNT(*)::int FROM community_event_registrations r WHERE r.event_id = e.id) AS registered_count,
              EXISTS (
                SELECT 1 FROM community_event_registrations r
                WHERE r.event_id = e.id AND r.user_id = $1
              ) AS is_registered
       FROM community_events e
       LEFT JOIN users u ON u.id = e.host_user_id
       WHERE e.is_active = TRUE
       ORDER BY e.start_at ASC`,
      [viewerId]
    );
    return res.json({ success: true, data: rows.rows });
  } catch (error) {
    console.error("Error listing events:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function registerCommunityEventController(req, res) {
  try {
    const eventId = Number(req.params.eventId);
    if (!eventId) return res.status(400).json({ message: "Valid eventId is required" });

    if (req.user?.id) {
      await pool.query(
        `INSERT INTO community_event_registrations (event_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (event_id, user_id) DO NOTHING`,
        [eventId, req.user.id]
      );
      return res.status(201).json({ success: true, message: "Registered successfully" });
    }

    const { name, email } = req.body || {};
    if (!name || !String(name).trim() || !email || !String(email).trim()) {
      return res.status(400).json({ message: "name and email are required for guest registration" });
    }

    const existing = await pool.query(
      `SELECT id FROM community_event_registrations
       WHERE event_id = $1 AND LOWER(COALESCE(guest_email, '')) = LOWER($2)
       LIMIT 1`,
      [eventId, String(email).trim()]
    );
    if (existing.rowCount > 0) {
      return res.status(200).json({ success: true, message: "Already registered" });
    }

    await pool.query(
      `INSERT INTO community_event_registrations (event_id, guest_name, guest_email)
       VALUES ($1, $2, $3)`,
      [eventId, String(name).trim(), String(email).trim()]
    );
    return res.status(201).json({ success: true, message: "Registered successfully" });
  } catch (error) {
    console.error("Error registering event:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listCommunityChallengesController(req, res) {
  try {
    const viewerId = req.user?.id || null;
    const rows = await pool.query(
      `SELECT c.id, c.title, c.description, c.duration_days, c.badge, c.is_active,
              (SELECT COUNT(*)::int FROM community_challenge_participants cp WHERE cp.challenge_id = c.id) AS participants,
              cp.progress,
              (cp.user_id IS NOT NULL) AS joined
       FROM community_challenges c
       LEFT JOIN community_challenge_participants cp
         ON cp.challenge_id = c.id AND cp.user_id = $1
       WHERE c.is_active = TRUE
       ORDER BY c.id ASC`,
      [viewerId]
    );
    return res.json({ success: true, data: rows.rows });
  } catch (error) {
    console.error("Error listing challenges:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function joinCommunityChallengeController(req, res) {
  try {
    const challengeId = Number(req.params.challengeId);
    if (!challengeId) return res.status(400).json({ message: "Valid challengeId is required" });
    if (req.user?.id) {
      await pool.query(
        `INSERT INTO community_challenge_participants (challenge_id, user_id, progress)
         VALUES ($1, $2, 0)
         ON CONFLICT (challenge_id, user_id) DO NOTHING`,
        [challengeId, req.user.id]
      );
      return res.status(201).json({ success: true, message: "Joined challenge" });
    }

    const { name, email } = req.body || {};
    if (!name || !String(name).trim() || !email || !String(email).trim()) {
      return res.status(400).json({ message: "name and email are required for guest challenge registration" });
    }
    const existing = await pool.query(
      `SELECT id FROM community_challenge_participants
       WHERE challenge_id = $1 AND LOWER(COALESCE(guest_email, '')) = LOWER($2)
       LIMIT 1`,
      [challengeId, String(email).trim()]
    );
    if (existing.rowCount > 0) {
      return res.status(200).json({ success: true, message: "Already joined" });
    }
    await pool.query(
      `INSERT INTO community_challenge_participants (challenge_id, guest_name, guest_email, progress)
       VALUES ($1, $2, $3, 0)`,
      [challengeId, String(name).trim(), String(email).trim()]
    );
    return res.status(201).json({ success: true, message: "Joined challenge" });
  } catch (error) {
    console.error("Error joining challenge:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listCommunitySuccessStoriesController(req, res) {
  try {
    const rows = await pool.query(
      `SELECT s.id, s.story, s.course, s.role_label, s.rating, s.created_at,
              s.display_name, s.image_url, s.video_url,
              COALESCE(s.display_name, u.name, 'Community Member') AS name
       FROM community_success_stories s
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.is_approved = TRUE
       ORDER BY s.created_at DESC
       LIMIT 100`
    );
    return res.json({ success: true, data: rows.rows });
  } catch (error) {
    console.error("Error listing success stories:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function createCommunitySuccessStoryController(req, res) {
  try {
    if (!(await canAccessSuccessStories(req.user))) {
      return res.status(403).json({ message: "Only enrolled learners, active team members, recognized alumni, and approved partner accounts can post success stories." });
    }
    const { story, course = null, roleLabel = null, rating = 5 } = req.body || {};
    if (!story || !String(story).trim()) return res.status(400).json({ message: "story is required" });
    const out = await pool.query(
      `INSERT INTO community_success_stories (user_id, story, course, role_label, rating, is_approved)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING *`,
      [req.user.id, String(story).trim(), course ? String(course).trim() : null, roleLabel ? String(roleLabel).trim() : null, Math.max(1, Math.min(5, Number(rating) || 5))]
    );
    return res.status(201).json({ success: true, data: out.rows[0] });
  } catch (error) {
    console.error("Error creating success story:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getSuccessStoryPermissionsController(req, res) {
  try {
    const canPost = await canAccessSuccessStories(req.user);
    return res.json({ success: true, data: { can_post: Boolean(canPost) } });
  } catch (error) {
    console.error("Error checking success story permissions:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listCommunityMentorsController(req, res) {
  try {
    if (!(await canAccessRestrictedCommunity(req.user))) {
      return res.status(403).json({ message: "Mentorship is available only to enrolled students, lecturers, and mentors." });
    }
    const rows = await pool.query(
      `SELECT m.id, m.name, m.expertise, m.bio, m.sessions, m.rating, m.available, m.is_active,
              EXISTS (
                SELECT 1 FROM community_mentor_requests r
                WHERE r.mentor_id = m.id AND r.requester_user_id = $1
              ) AS requested
       FROM community_mentors m
       WHERE m.is_active = TRUE
       ORDER BY m.available DESC, m.rating DESC, m.id ASC`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows.rows });
  } catch (error) {
    console.error("Error listing mentors:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function requestMentorshipController(req, res) {
  try {
    if (!(await canAccessRestrictedCommunity(req.user))) {
      return res.status(403).json({ message: "You need enrollment (or lecturer/mentor access) to request mentorship." });
    }
    const mentorId = Number(req.params.mentorId);
    const { message = "" } = req.body || {};
    if (!mentorId) return res.status(400).json({ message: "Valid mentorId is required" });
    const out = await pool.query(
      `INSERT INTO community_mentor_requests (mentor_id, requester_user_id, message, status)
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT (mentor_id, requester_user_id)
       DO UPDATE SET message = EXCLUDED.message, status = 'pending'
       RETURNING *`,
      [mentorId, req.user.id, String(message || "").trim() || null]
    );
    return res.status(201).json({ success: true, data: out.rows[0] });
  } catch (error) {
    console.error("Error requesting mentorship:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listDiscussionGroupsController(req, res) {
  try {
    if (!(await canAccessRestrictedCommunity(req.user))) {
      return res.status(403).json({ message: "Discussion groups are available only to enrolled students, lecturers, and mentors." });
    }

    const role = String(req.user?.role || "").toLowerCase();
    const isStaff = STAFF_ROLES.has(role);
    const params = [req.user.id];

    const where = isStaff
      ? ""
      : "WHERE EXISTS (SELECT 1 FROM enrollment e WHERE e.course_id = c.id AND e.user_id = $1)";

    const { rows } = await pool.query(
      `SELECT c.id AS course_id,
              c.title AS group_name,
              c.short_description,
              COALESCE(post_stats.post_count, 0) AS posts_count,
              post_stats.last_post_at
       FROM courses c
       LEFT JOIN (
         SELECT p.course_id,
                COUNT(*)::int AS post_count,
                MAX(p.created_at) AS last_post_at
         FROM community_posts p
         WHERE p.course_id IS NOT NULL
         GROUP BY p.course_id
       ) post_stats ON post_stats.course_id = c.id
       ${where}
       ORDER BY post_stats.last_post_at DESC NULLS LAST, c.created_at DESC`,
      params
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error listing discussion groups:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listRecentLiveMessagesController(req, res) {
  try {
    if (!(await isFeatureEnabled("student_live_messages_enabled", true))) {
      return res.status(403).json({ message: "Live messages are currently disabled by admin." });
    }
    if (!(await canAccessRestrictedCommunity(req.user))) {
      return res.status(403).json({ message: "Live messaging is available only to enrolled students, lecturers, and mentors." });
    }

    const rows = await pool.query(
      `WITH conv AS (
         SELECT DISTINCT ON (
           CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END
         )
           m.id,
           CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END AS contact_id,
           m.sender_id,
           m.recipient_id,
           m.content,
           m.created_at
         FROM community_messages m
         WHERE m.sender_id = $1 OR m.recipient_id = $1
         ORDER BY
           CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END,
           m.created_at DESC
       )
       SELECT conv.id,
              conv.contact_id,
              u.name AS contact_name,
              u.role AS contact_role,
              conv.sender_id,
              conv.recipient_id,
              conv.content,
              conv.created_at
       FROM conv
       JOIN users u ON u.id = conv.contact_id
       ORDER BY conv.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    return res.json({ success: true, data: rows.rows });
  } catch (error) {
    console.error("Error listing recent live messages:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deleteConversationController(req, res) {
  try {
    console.log('Delete conversation request - User:', req.user); // Debug log
    
    if (!(await isFeatureEnabled("student_live_messages_enabled", true))) {
      console.log('Feature flag disabled');
      return res.status(403).json({ message: "Live messages are currently disabled by admin." });
    }
    
    console.log('User role:', req.user?.role);
    console.log('Checking access...');
    
    if (!(await canAccessRestrictedCommunity(req.user))) {
      console.log('Access denied - not enrolled or staff');
      return res.status(403).json({ message: "Community chat is available only to enrolled students, lecturers, and mentors." });
    }

    const contactId = Number(req.params.contactId);
    if (!contactId) return res.status(400).json({ message: "Valid contactId is required" });

    console.log('Soft-deleting conversation between user', req.user.id, 'and contact', contactId);

    // Soft-delete: Mark all messages as deleted but keep them for audit
    const result = await pool.query(
      `UPDATE community_messages 
       SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1
       WHERE (sender_id = $2 AND recipient_id = $3) 
          OR (sender_id = $3 AND recipient_id = $2)
          AND COALESCE(is_deleted, false) = false`,
      [req.user.id, req.user.id, contactId]
    );

    console.log('Soft-deleted messages count:', result.rowCount);

    return res.json({ 
      success: true, 
      message: "Conversation deleted successfully", 
      deletedCount: result.rowCount,
      softDeleted: true 
    });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getDeletedConversationsController(req, res) {
  try {
    // Only admins can access deleted conversations
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const result = await pool.query(
      `SELECT 
         cm.id,
         cm.content,
         cm.created_at,
         cm.deleted_at,
         cm.deleted_by,
         sender.name as sender_name,
         sender.role as sender_role,
         recipient.name as recipient_name,
         recipient.role as recipient_role,
         deleter.name as deleted_by_name
       FROM community_messages cm
       LEFT JOIN users sender ON cm.sender_id = sender.id
       LEFT JOIN users recipient ON cm.recipient_id = recipient.id
       LEFT JOIN users deleter ON cm.deleted_by = deleter.id
       WHERE cm.is_deleted = true
       ORDER BY cm.deleted_at DESC
       LIMIT 100`
    );

    return res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error retrieving deleted conversations:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function restoreConversationController(req, res) {
  try {
    // Only admins can restore conversations
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const { messageIds } = req.body;
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: "Valid message IDs array is required" });
    }

    const result = await pool.query(
      `UPDATE community_messages 
       SET is_deleted = false, deleted_at = NULL, deleted_by = NULL
       WHERE id = ANY($1) AND is_deleted = true`,
      [messageIds]
    );

    return res.json({ 
      success: true, 
      message: "Conversation restored successfully", 
      restoredCount: result.rowCount 
    });
  } catch (error) {
    console.error("Error restoring conversation:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
