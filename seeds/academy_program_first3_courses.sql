BEGIN;

-- Optional content storage table to keep full lesson bodies (markdown/text)
CREATE TABLE IF NOT EXISTS lesson_contents (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
  body_markdown TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure categories exist
INSERT INTO categories (name)
SELECT 'Mindset and Personal Mastery'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Mindset and Personal Mastery');

INSERT INTO categories (name)
SELECT 'Productivity and Success Strategies'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Productivity and Success Strategies');

INSERT INTO categories (name)
SELECT 'Leadership and Influence'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Leadership and Influence');

INSERT INTO categories (name)
SELECT 'Resilience, Well-Being, and Social Impact'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Resilience, Well-Being, and Social Impact');

-- Clean previous versions of these seed courses only
DELETE FROM courses
WHERE title IN (
  'Program Orientation: Foundations Across the Four Pillars',
  'The Confidence Code: Building Unstoppable Self-Belief',
  'Overcoming Negative Thinking: Rewiring Your Brain for Positivity',
  'Overcoming Procrastination: How to Get Things Done Now'
);

-- ===================================================================
-- COURSE 0: INTRODUCTION FOR ALL FOUR PILLARS
-- ===================================================================
WITH new_course AS (
  INSERT INTO courses (title, description, short_description, long_description, category_id, delivery_mode, has_certificate, duration_weeks)
  VALUES (
    'Program Orientation: Foundations Across the Four Pillars',
    'Introductory foundation for all learners before entering the 14-course pathway.',
    'Understand the academy model, all four pillars, and your personal growth baseline.',
    'This orientation introduces the full academy architecture: three levels and four pillars. Learners define baseline goals, build a learning contract, and establish accountability rhythms before entering specialized courses. The orientation emphasizes transformation through reflection, practice, and applied action.',
    NULL,
    'self-paced',
    TRUE,
    1
  )
  RETURNING id
), m1 AS (
  INSERT INTO modules (course_id, title, order_index)
  SELECT id, 'Module 1: The Academy Blueprint', 1 FROM new_course RETURNING id
), m2 AS (
  INSERT INTO modules (course_id, title, order_index)
  SELECT id, 'Module 2: Learning for Transformation', 2 FROM new_course RETURNING id
)
SELECT 1;

WITH c AS (SELECT id FROM courses WHERE title = 'Program Orientation: Foundations Across the Four Pillars' LIMIT 1),
m1 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Module 1: The Academy Blueprint' LIMIT 1),
m2 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Module 2: Learning for Transformation' LIMIT 1),
l11 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 1.1: Why the Four Pillars Matter Together', 'article', 1 FROM m1 RETURNING id),
l12 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 1.2: Personal Baseline Mapping', 'article', 2 FROM m1 RETURNING id),
l21 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 2.1: Reflection, Practice, and Accountability', 'article', 1 FROM m2 RETURNING id),
l22 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 2.2: Building Your Commitment Contract', 'article', 2 FROM m2 RETURNING id)
INSERT INTO lesson_contents (lesson_id, body_markdown)
SELECT id, body FROM (
  SELECT (SELECT id FROM l11) AS id, 'The Academy works as one integrated system. Mindset shapes identity, productivity drives execution, leadership amplifies influence, and resilience sustains long-term growth. This lesson explains why these pillars must be developed together.' AS body
  UNION ALL
  SELECT (SELECT id FROM l12), 'Learners map confidence, focus, communication, and stress patterns using a baseline self-assessment. This baseline becomes the reference point for measurable progress through all remaining courses.'
  UNION ALL
  SELECT (SELECT id FROM l21), 'Core rhythm: Learn -> Apply -> Reflect. Real growth requires implementation. Each week learners complete one action challenge and one reflection review.'
  UNION ALL
  SELECT (SELECT id FROM l22), 'Learners write a personal commitment contract defining daily practice windows, weekly review timing, and one accountability partner. This contract turns intention into structure.'
) q;

-- ===================================================================
-- COURSE 1: CONFIDENCE CODE
-- ===================================================================
WITH cat AS (
  SELECT id FROM categories WHERE name = 'Mindset and Personal Mastery' LIMIT 1
), new_course AS (
  INSERT INTO courses (title, description, short_description, long_description, category_id, delivery_mode, has_certificate, duration_weeks)
  SELECT
    'The Confidence Code: Building Unstoppable Self-Belief',
    'Build lasting self-belief through thought mastery, courageous action, and resilience.',
    'Confidence is trainable. Build it through identity, action, and repetition.',
    'Your mind is extraordinarily powerful. Confidence is not something you are born with; it is cultivated by changing thought patterns, challenging self-doubt, and practicing bold action consistently. This course develops inner confidence that remains stable under uncertainty and pressure.',
    cat.id,
    'self-paced',
    TRUE,
    4
  FROM cat
  RETURNING id
), m1 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 1: The Psychology of Confidence', 1 FROM new_course RETURNING id),
m2 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 2: Breaking the Cycle of Self-Doubt', 2 FROM new_course RETURNING id),
m3 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 3: The Habit of Bold Action', 3 FROM new_course RETURNING id),
m4 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 4: Building Inner Strength and Long-Term Confidence', 4 FROM new_course RETURNING id)
SELECT 1;

WITH c AS (SELECT id FROM courses WHERE title = 'The Confidence Code: Building Unstoppable Self-Belief' LIMIT 1),
m1 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Module 1: The Psychology of Confidence' LIMIT 1),
m2 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Module 2: Breaking the Cycle of Self-Doubt' LIMIT 1),
m3 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Module 3: The Habit of Bold Action' LIMIT 1),
m4 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Module 4: Building Inner Strength and Long-Term Confidence' LIMIT 1),
l11 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 1.1: Confidence Begins in Thought', 'article', 1 FROM m1 RETURNING id),
l12 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 1.2: Self-Image and Performance', 'article', 2 FROM m1 RETURNING id),
l21 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 2.1: Spotting the Voice of Doubt', 'article', 1 FROM m2 RETURNING id),
l22 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 2.2: Reframing Through Micro-Wins', 'article', 2 FROM m2 RETURNING id),
l31 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 3.1: Courage in Practice', 'article', 1 FROM m3 RETURNING id),
l32 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 3.2: Action Creates Confidence', 'article', 2 FROM m3 RETURNING id),
l41 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 4.1: Resilience Over Perfection', 'article', 1 FROM m4 RETURNING id),
l42 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 4.2: The Confidence Code in Daily Life', 'article', 2 FROM m4 RETURNING id)
INSERT INTO lesson_contents (lesson_id, body_markdown)
SELECT id, body FROM (
  SELECT (SELECT id FROM l11) AS id, 'Confidence starts in the mind. Dominant thoughts shape emotional state and behavior. Your self-concept sets the ceiling of action. Repeating constructive beliefs creates neural pathways that make confidence your default response. Quote focus: "As a man thinketh in his heart, so is he" (Proverbs 23:7).' AS body
  UNION ALL
  SELECT (SELECT id FROM l12), 'Self-image governs performance. When learners identify as capable and growing, they participate more, recover faster, and take initiative under pressure.'
  UNION ALL
  SELECT (SELECT id FROM l21), 'Self-doubt often grows through comparison and over-attachment to past mistakes. Learners identify internal doubt scripts and replace them with growth language.'
  UNION ALL
  SELECT (SELECT id FROM l22), 'Micro-wins are psychological evidence of capability. Track daily wins to retrain attention toward progress instead of insufficiency.'
  UNION ALL
  SELECT (SELECT id FROM l31), 'Courage is action in the presence of fear. Practical challenges include speaking up, sharing ideas, and taking one bold step daily.'
  UNION ALL
  SELECT (SELECT id FROM l32), 'Confidence grows through repetition. Apply the 24-hour courage rule: when clarity appears, act within 24 hours. Quote focus: "Faith without works is dead" (James 2:17).'
  UNION ALL
  SELECT (SELECT id FROM l41), 'Resilience is the root of stable confidence. Confidence does not require perfection; it requires recovery and consistency.'
  UNION ALL
  SELECT (SELECT id FROM l42), 'Daily confidence protocol: affirm identity, reframe challenge as growth, remember past victories, and choose progress over perfection. Quote focus: "I can do all things through Christ who strengthens me" (Philippians 4:13).'
) q;

-- ===================================================================
-- COURSE 2: OVERCOMING NEGATIVE THINKING
-- ===================================================================
WITH cat AS (
  SELECT id FROM categories WHERE name = 'Mindset and Personal Mastery' LIMIT 1
), new_course AS (
  INSERT INTO courses (title, description, short_description, long_description, category_id, delivery_mode, has_certificate, duration_weeks)
  SELECT
    'Overcoming Negative Thinking: Rewiring Your Brain for Positivity',
    'Transform negative thought patterns through neuroplasticity, reframing, and mental discipline.',
    'Identify distortions, reframe thoughts, and build constructive mental habits.',
    'Negative thinking is a learned mental pattern. This course helps learners identify cognitive distortions, interrupt harmful scripts, and build optimism and emotional resilience through daily systems and environment design.',
    cat.id,
    'self-paced',
    TRUE,
    5
  FROM cat
  RETURNING id
), m1 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 1: The Science of Thought', 1 FROM new_course RETURNING id),
m2 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 2: The Nature of Negative Thinking', 2 FROM new_course RETURNING id),
m3 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 3: Recognizing Cognitive Distortions', 3 FROM new_course RETURNING id),
m4 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 4: Rewiring for Positivity', 4 FROM new_course RETURNING id),
m5 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 5: Gratitude, Perspective, and Environment', 5 FROM new_course RETURNING id)
SELECT 1;

WITH c AS (SELECT id FROM courses WHERE title = 'Overcoming Negative Thinking: Rewiring Your Brain for Positivity' LIMIT 1),
m1 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Module 1: The Science of Thought' LIMIT 1),
m2 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Module 2: The Nature of Negative Thinking' LIMIT 1),
m3 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Module 3: Recognizing Cognitive Distortions' LIMIT 1),
m4 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Module 4: Rewiring for Positivity' LIMIT 1),
m5 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Module 5: Gratitude, Perspective, and Environment' LIMIT 1),
l11 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 1.1: Neuroplasticity and Mental Patterns', 'article', 1 FROM m1 RETURNING id),
l12 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 1.2: Emotional Chemistry of Thought', 'article', 2 FROM m1 RETURNING id),
l21 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 2.1: Core Beliefs and Internal Scripts', 'article', 1 FROM m2 RETURNING id),
l22 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 2.2: Beliefs vs. Events', 'article', 2 FROM m2 RETURNING id),
l31 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 3.1: Distortion Types and Detection', 'article', 1 FROM m3 RETURNING id),
l32 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 3.2: Distortion-to-Truth Practice', 'article', 2 FROM m3 RETURNING id),
l41 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 4.1: Interrupt, Question, Replace', 'article', 1 FROM m4 RETURNING id),
l42 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 4.2: Systemizing Better Thinking', 'article', 2 FROM m4 RETURNING id),
l51 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 5.1: Gratitude as Cognitive Training', 'article', 1 FROM m5 RETURNING id),
l52 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 5.2: Designing a Positive Mental Ecosystem', 'article', 2 FROM m5 RETURNING id)
INSERT INTO lesson_contents (lesson_id, body_markdown)
SELECT id, body FROM (
  SELECT (SELECT id FROM l11) AS id, 'Your brain rewires based on repeated thought. This neuroplastic process can reinforce fear or possibility depending on what is rehearsed daily.' AS body
  UNION ALL
  SELECT (SELECT id FROM l12), 'Negative thought patterns increase stress chemistry; constructive patterns improve clarity and motivation. Track trigger-thought-emotion-response loops.'
  UNION ALL
  SELECT (SELECT id FROM l21), 'Core beliefs often begin in early emotional experiences and become scripts such as "I am not enough" or "Nothing works for me."'
  UNION ALL
  SELECT (SELECT id FROM l22), 'Following REBT: events do not automatically create suffering; beliefs about events do. Reframe interpretations to reduce psychological load.'
  UNION ALL
  SELECT (SELECT id FROM l31), 'Common distortions include catastrophizing, personalization, all-or-nothing thinking, and filtering. Labeling distortions weakens their control.'
  UNION ALL
  SELECT (SELECT id FROM l32), 'Replace distorted language with balanced truth. Example: "I failed once" is not "I always fail."'
  UNION ALL
  SELECT (SELECT id FROM l41), 'Three-step thought reset: Interrupt -> Question -> Replace. Practice until it becomes automatic in stressful moments.'
  UNION ALL
  SELECT (SELECT id FROM l42), 'Build a daily mental system: morning intention, midday reset, evening reframing review. Systems sustain cognitive change.'
  UNION ALL
  SELECT (SELECT id FROM l51), 'Gratitude redirects attention from lack to resourcefulness. Daily gratitude increases emotional stability and motivation.'
  UNION ALL
  SELECT (SELECT id FROM l52), 'Curate your input environment: people, conversations, media, and routines. Better ecosystems support better thinking.'
) q;

-- ===================================================================
-- COURSE 3: OVERCOMING PROCRASTINATION
-- ===================================================================
WITH cat AS (
  SELECT id FROM categories WHERE name = 'Productivity and Success Strategies' LIMIT 1
), new_course AS (
  INSERT INTO courses (title, description, short_description, long_description, category_id, delivery_mode, has_certificate, duration_weeks)
  SELECT
    'Overcoming Procrastination: How to Get Things Done Now',
    'Turn delay into disciplined execution through practical behavior systems.',
    'Beat procrastination by lowering start friction and building momentum.',
    'Procrastination is not primarily a time problem; it is an emotional regulation and identity problem. This course gives learners practical frameworks to start quickly, execute consistently, and sustain focus through systems, environment design, and accountability loops.',
    cat.id,
    'self-paced',
    TRUE,
    5
  FROM cat
  RETURNING id
), m1 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 1: The Psychology Behind Procrastination', 1 FROM new_course RETURNING id),
m2 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 2: The Illusion of Later', 2 FROM new_course RETURNING id),
m3 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 3: Emotional Resistance and Fear of Starting', 3 FROM new_course RETURNING id),
m4 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 4: Perfectionism and Momentum', 4 FROM new_course RETURNING id),
m5 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 5: Environment, Focus, and Accountability', 5 FROM new_course RETURNING id)
SELECT 1;

WITH c AS (SELECT id FROM courses WHERE title = 'Overcoming Procrastination: How to Get Things Done Now' LIMIT 1),
m1 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Module 1: The Psychology Behind Procrastination' LIMIT 1),
m2 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Module 2: The Illusion of Later' LIMIT 1),
m3 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Module 3: Emotional Resistance and Fear of Starting' LIMIT 1),
m4 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Module 4: Perfectionism and Momentum' LIMIT 1),
m5 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Module 5: Environment, Focus, and Accountability' LIMIT 1),
l11 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 1.1: Why We Delay', 'article', 1 FROM m1 RETURNING id),
l12 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 1.2: Mood Repair vs Long-Term Reward', 'article', 2 FROM m1 RETURNING id),
l21 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 2.1: Future-Self Myth', 'article', 1 FROM m2 RETURNING id),
l22 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 2.2: Decision Management Systems', 'article', 2 FROM m2 RETURNING id),
l31 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 3.1: Activation Threshold', 'article', 1 FROM m3 RETURNING id),
l32 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 3.2: The 2-Minute Rule', 'article', 2 FROM m3 RETURNING id),
l41 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 4.1: Perfectionism as Hidden Delay', 'article', 1 FROM m4 RETURNING id),
l42 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 4.2: Building Momentum with Small Wins', 'article', 2 FROM m4 RETURNING id),
l51 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 5.1: Focus Environment Design', 'article', 1 FROM m5 RETURNING id),
l52 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 5.2: Accountability and Follow-Through', 'article', 2 FROM m5 RETURNING id)
INSERT INTO lesson_contents (lesson_id, body_markdown)
SELECT id, body FROM (
  SELECT (SELECT id FROM l11) AS id, 'Procrastination is usually emotional avoidance, not laziness. Learners identify discomfort triggers and design response actions.' AS body
  UNION ALL
  SELECT (SELECT id FROM l12), 'The mind chooses immediate mood relief over long-term reward unless structure is in place. Replace comfort loops with execution cues.'
  UNION ALL
  SELECT (SELECT id FROM l21), '"Later" is often a false promise. Future-you will face the same emotions unless you alter your system now.'
  UNION ALL
  SELECT (SELECT id FROM l22), 'Use implementation intentions and pre-commitment rules to remove decision friction and start on time.'
  UNION ALL
  SELECT (SELECT id FROM l31), 'The greatest resistance appears before starting. Lower activation threshold with tiny first actions and countdown starts.'
  UNION ALL
  SELECT (SELECT id FROM l32), 'Two-minute starts: open the file, read one paragraph, put on workout shoes. Starting rewires identity toward action.'
  UNION ALL
  SELECT (SELECT id FROM l41), 'Perfectionism delays progress by demanding flawless first attempts. Shift to draft-first execution and iterative improvement.'
  UNION ALL
  SELECT (SELECT id FROM l42), 'Break tasks into micro-steps, celebrate completions, and build momentum through consistency over intensity.'
  UNION ALL
  SELECT (SELECT id FROM l51), 'Design a distraction-resistant workspace and use focus blocks (e.g., Pomodoro) to protect attention.'
  UNION ALL
  SELECT (SELECT id FROM l52), 'Accountability increases completion rates. Share goals, report progress weekly, and track execution publicly with a trusted partner.'
) q;

COMMIT;
