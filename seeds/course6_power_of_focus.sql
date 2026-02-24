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
WHERE title = 'The Power of Focus: How to Stay on Track and Achieve Your Goals';

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
    'The Power of Focus: How to Stay on Track and Achieve Your Goals',
    'Master attention, deep work, and purpose alignment to achieve high-value goals.',
    'A practical concentration framework for clarity, endurance, and execution.',
    'This course teaches focus as a trainable performance system. Learners move from scattered effort to directed execution by mastering clarity, deep work, attention defense, mental endurance, and purpose alignment.',
    cat.id,
    'self-paced',
    TRUE,
    6
  FROM cat
  RETURNING id
),
m1 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 1. The Psychology of Focus', 1 FROM new_course RETURNING id),
m2 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 2. Clarity: The Foundation of Focus', 2 FROM new_course RETURNING id),
m3 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 3. Deep Work: The Engine of Achievement', 3 FROM new_course RETURNING id),
m4 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 4. The Enemies of Focus', 4 FROM new_course RETURNING id),
m5 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 5. The Power of Mental Endurance', 5 FROM new_course RETURNING id),
m6 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 6. Aligning Focus with Purpose', 6 FROM new_course RETURNING id)
SELECT 1;

WITH c AS (
  SELECT id FROM courses WHERE title = 'The Power of Focus: How to Stay on Track and Achieve Your Goals' LIMIT 1
),
m1 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 1. The Psychology of Focus' LIMIT 1),
m2 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 2. Clarity: The Foundation of Focus' LIMIT 1),
m3 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 3. Deep Work: The Engine of Achievement' LIMIT 1),
m4 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 4. The Enemies of Focus' LIMIT 1),
m5 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 5. The Power of Mental Endurance' LIMIT 1),
m6 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 6. Aligning Focus with Purpose' LIMIT 1),
l11 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Focus as a Limited Cognitive Resource', 'article', 1 FROM m1 RETURNING id),
l21 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Clarity Before Concentration', 'article', 1 FROM m2 RETURNING id),
l31 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Shallow Work vs Deep Work', 'article', 1 FROM m3 RETURNING id),
l41 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Distraction, Multitasking, and Attention Leakage', 'article', 1 FROM m4 RETURNING id),
l51 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Training Attention Like a Muscle', 'article', 1 FROM m5 RETURNING id),
l61 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Purpose as Attention Fuel', 'article', 1 FROM m6 RETURNING id)
INSERT INTO lesson_contents (lesson_id, body_markdown)
SELECT id, body FROM (
  SELECT (SELECT id FROM l11) AS id, 'Attention is finite. Fragmented attention weakens output; concentrated attention enables flow and precision. Build single-task concentration to increase cognitive quality.' AS body
  UNION ALL
  SELECT (SELECT id FROM l21), 'Clarity defines what deserves attention. Without a defined target, effort diffuses. Apply intentional priority filters and reduce competing objectives.'
  UNION ALL
  SELECT (SELECT id FROM l31), 'Deep work creates transformation through uninterrupted thinking and creation. Replace reactive busyness with protected high-value work sessions.'
  UNION ALL
  SELECT (SELECT id FROM l41), 'Multitasking and context-switching create hidden cognitive costs. Track interruptions and design boundaries to defend attention from internal and external sabotage.'
  UNION ALL
  SELECT (SELECT id FROM l51), 'Attention endurance is trained through repetition and routine. Use fixed start rituals, time blocks, and consistency protocols when motivation drops.'
  UNION ALL
  SELECT (SELECT id FROM l61), 'Purpose gives focus meaning and persistence. Connect each work block to your deeper why to sustain execution during setbacks and fatigue.'
) q;

COMMIT;
