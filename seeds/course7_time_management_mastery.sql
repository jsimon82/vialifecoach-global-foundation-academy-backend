BEGIN;

CREATE TABLE IF NOT EXISTS lesson_contents (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
  body_markdown TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categories (name)
SELECT 'Productivity and Success Strategies'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Productivity and Success Strategies');

DELETE FROM courses
WHERE title = 'How to Master Time Management: Taking Control of Your Day';

WITH cat AS (
  SELECT id FROM categories WHERE name = 'Productivity and Success Strategies' LIMIT 1
), new_course AS (
  INSERT INTO courses (
    title,
    description,
    short_description,
    long_description,
    category_id,
    delivery_mode,
    has_certificate,
    duration_weeks
  )
  SELECT
    'How to Master Time Management: Taking Control of Your Day',
    'Design your day with priorities, structure, and renewal for consistent high performance.',
    'A practical framework to convert hours into measurable progress.',
    'This course trains learners to treat time as strategic capital. Through priority frameworks, planning systems, distraction defense, and recovery cycles, learners develop a sustainable approach to execution and life direction.',
    cat.id,
    'self-paced',
    TRUE,
    7
  FROM cat
  RETURNING id
),
m1 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 1. Understanding the Nature of Time', 1 FROM new_course RETURNING id),
m2 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 2. The Psychology of Control', 2 FROM new_course RETURNING id),
m3 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 3. The Priority Principle', 3 FROM new_course RETURNING id),
m4 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 4. The Power of Planning', 4 FROM new_course RETURNING id),
m5 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 5. Defeating Time Thieves', 5 FROM new_course RETURNING id),
m6 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 6. Balancing Work and Renewal', 6 FROM new_course RETURNING id),
m7 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 7. The Mindset of Time Investors', 7 FROM new_course RETURNING id)
SELECT 1;

WITH c AS (
  SELECT id FROM courses WHERE title = 'How to Master Time Management: Taking Control of Your Day' LIMIT 1
),
m1 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 1. Understanding the Nature of Time' LIMIT 1),
m2 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 2. The Psychology of Control' LIMIT 1),
m3 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 3. The Priority Principle' LIMIT 1),
m4 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 4. The Power of Planning' LIMIT 1),
m5 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 5. Defeating Time Thieves' LIMIT 1),
m6 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 6. Balancing Work and Renewal' LIMIT 1),
m7 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 7. The Mindset of Time Investors' LIMIT 1),
l11 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Time as an Investment Asset', 'article', 1 FROM m1 RETURNING id),
l21 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reclaiming Schedule Authority', 'article', 1 FROM m2 RETURNING id),
l31 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Doing What Matters Most', 'article', 1 FROM m3 RETURNING id),
l41 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Time-Blocking for Execution', 'article', 1 FROM m4 RETURNING id),
l51 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Attention Loss and Recovery Costs', 'article', 1 FROM m5 RETURNING id),
l61 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Energy Cycles and Sustainable Output', 'article', 1 FROM m6 RETURNING id),
l71 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Treating Time Like Capital', 'article', 1 FROM m7 RETURNING id)
INSERT INTO lesson_contents (lesson_id, body_markdown)
SELECT id, body FROM (
  SELECT (SELECT id FROM l11) AS id, 'Time is finite and non-renewable. Treat each hour as an investment unit that should produce meaningful return in learning, execution, health, or relationship value.' AS body
  UNION ALL
  SELECT (SELECT id FROM l21), 'Schedule control starts with awareness. Track how time is spent, identify leakage patterns, and reclaim authority through pre-planned daily structure.'
  UNION ALL
  SELECT (SELECT id FROM l31), 'Use the urgent-important framework to prioritize what matters most. Sustainable growth comes from consistent work on important but not urgent activities.'
  UNION ALL
  SELECT (SELECT id FROM l41), 'Planning converts intention into sequence. Time-blocking protects attention, reduces cognitive switching, and turns goals into executable time windows.'
  UNION ALL
  SELECT (SELECT id FROM l51), 'Time thieves include interruption loops, multitasking, and reactive communication. Defend focus through boundary systems and distraction-reduction protocols.'
  UNION ALL
  SELECT (SELECT id FROM l61), 'Performance requires alternation between concentrated effort and recovery. Structured breaks improve long-duration productivity and reduce burnout risk.'
  UNION ALL
  SELECT (SELECT id FROM l71), 'Adopt a time investor mindset: audit weekly activities, remove low-return patterns, and reallocate hours toward high-value growth and execution.'
) q;

COMMIT;
