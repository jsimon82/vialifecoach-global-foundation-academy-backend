BEGIN;

CREATE TABLE IF NOT EXISTS lesson_contents (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
  body_markdown TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categories (name)
SELECT 'Leadership and Influence'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Leadership and Influence');

DELETE FROM courses
WHERE title = 'L1-P3-C8: The Skill to Listen: Transforming Listening into a Superpower';

WITH cat AS (
  SELECT id FROM categories WHERE name = 'Leadership and Influence' LIMIT 1
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
    'L1-P3-C8: The Skill to Listen: Transforming Listening into a Superpower',
    'Build active, empathetic, and influential listening skills for leadership and relationships.',
    'A complete communication course on deep listening and influence.',
    'This course develops listening as a high-impact communication and leadership skill. Learners move from passive hearing to intentional, empathetic listening that strengthens trust, emotional intelligence, and influence.',
    cat.id,
    'self-paced',
    TRUE,
    8
  FROM cat
  RETURNING id
),
m1 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 1. The Essence of Listening', 1 FROM new_course RETURNING id),
m2 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 2. Hearing vs. Listening', 2 FROM new_course RETURNING id),
m3 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 3. The Psychology of Listening', 3 FROM new_course RETURNING id),
m4 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 4. Common Barriers to Effective Listening', 4 FROM new_course RETURNING id),
m5 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 5. The Levels of Listening', 5 FROM new_course RETURNING id),
m6 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 6. The Power of Empathetic Listening', 6 FROM new_course RETURNING id),
m7 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 7. Listening as a Tool for Influence', 7 FROM new_course RETURNING id),
m8 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 8. Listening to Yourself', 8 FROM new_course RETURNING id)
SELECT 1;

WITH c AS (SELECT id FROM courses WHERE title='L1-P3-C8: The Skill to Listen: Transforming Listening into a Superpower' LIMIT 1),
m1 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 1. The Essence of Listening' LIMIT 1),
m2 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 2. Hearing vs. Listening' LIMIT 1),
m3 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 3. The Psychology of Listening' LIMIT 1),
m4 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 4. Common Barriers to Effective Listening' LIMIT 1),
m5 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 5. The Levels of Listening' LIMIT 1),
m6 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 6. The Power of Empathetic Listening' LIMIT 1),
m7 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 7. Listening as a Tool for Influence' LIMIT 1),
m8 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 8. Listening to Yourself' LIMIT 1),
l1 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Listening as the Foundation of Human Connection', 'article', 1 FROM m1 RETURNING id),
l2 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'From Sound Reception to Meaning Interpretation', 'article', 1 FROM m2 RETURNING id),
l3 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Listening, Emotional Safety, and Trust', 'article', 1 FROM m3 RETURNING id),
l4 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Identifying and Removing Mental Noise', 'article', 1 FROM m4 RETURNING id),
l5 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Internal, Focused, and Global Listening', 'article', 1 FROM m5 RETURNING id),
l6 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Compassionate Attention in Action', 'article', 1 FROM m6 RETURNING id),
l7 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'How Listening Builds Leadership Influence', 'article', 1 FROM m7 RETURNING id),
l8 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Inner Listening and Self-Mastery', 'article', 1 FROM m8 RETURNING id)
INSERT INTO lesson_contents (lesson_id, body_markdown)
SELECT id, body FROM (
  SELECT (SELECT id FROM l1) AS id, 'Listening is active meaning-making. It interprets words, tone, emotion, and silence to create deeper understanding and stronger human connection.' AS body
  UNION ALL
  SELECT (SELECT id FROM l2), 'Hearing collects sounds; listening interprets meaning. Example: "I am fine" can communicate distress through tone and posture. Deep listening catches what words hide.'
  UNION ALL
  SELECT (SELECT id FROM l3), 'Listening is psychological co-regulation. Empathetic attention increases trust and lowers defensiveness, improving communication outcomes.'
  UNION ALL
  SELECT (SELECT id FROM l4), 'Main barriers: distraction, assumption, judgment, ego, and premature response. Presence is trained through pause, attention discipline, and response delay.'
  UNION ALL
  SELECT (SELECT id FROM l5), 'Three listening levels: internal, focused, global. Global listening integrates words, emotional tone, and context and is essential for leadership communication.'
  UNION ALL
  SELECT (SELECT id FROM l6), 'Empathetic listening suspends personal bias and seeks the speaker perspective. This reduces conflict and strengthens trust-based relationships.'
  UNION ALL
  SELECT (SELECT id FROM l7), 'Listening creates influence by making people feel heard and safe. Psychological safety increases openness, collaboration, and follow-through.'
  UNION ALL
  SELECT (SELECT id FROM l8), 'Self-listening enables emotional clarity, aligned decisions, and value-based action. It is foundational to self-awareness and sustainable leadership.'
) q;

COMMIT;
