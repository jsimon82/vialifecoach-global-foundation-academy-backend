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
WHERE title = 'Goal-Setting Mastery: Creating and Crushing Your Goals';

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
    'Goal-Setting Mastery: Creating and Crushing Your Goals',
    'Turn dreams into measurable outcomes using clarity, systems, and disciplined execution.',
    'A structured guide for SMART goals, habit systems, and sustained momentum.',
    'This course helps learners convert aspirations into strategic action plans. It covers clear intention, SMART goal design, behavior systems, barrier management, progress tracking, and momentum architecture so learners can complete meaningful goals consistently.',
    cat.id,
    'self-paced',
    TRUE,
    6
  FROM cat
  RETURNING id
),
m1 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 1: The Power of Clear Intentions', 1 FROM new_course RETURNING id),
m2 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 2: Designing SMART Goals', 2 FROM new_course RETURNING id),
m3 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 3: Building Systems and Habits', 3 FROM new_course RETURNING id),
m4 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 4: Mental Barriers and Self-Sabotage', 4 FROM new_course RETURNING id),
m5 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 5: Tracking Progress and Staying Accountable', 5 FROM new_course RETURNING id),
m6 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 6: Sustaining Motivation and Momentum', 6 FROM new_course RETURNING id)
SELECT 1;

WITH c AS (
  SELECT id FROM courses WHERE title = 'Goal-Setting Mastery: Creating and Crushing Your Goals' LIMIT 1
),
m1 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 1: The Power of Clear Intentions' LIMIT 1),
m2 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 2: Designing SMART Goals' LIMIT 1),
m3 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 3: Building Systems and Habits' LIMIT 1),
m4 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 4: Mental Barriers and Self-Sabotage' LIMIT 1),
m5 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 5: Tracking Progress and Staying Accountable' LIMIT 1),
m6 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 6: Sustaining Motivation and Momentum' LIMIT 1),
l11 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Clarity Creates Direction', 'article', 1 FROM m1 RETURNING id),
l21 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'From Dream to Structured Goal', 'article', 1 FROM m2 RETURNING id),
l31 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Systems Sustain What Motivation Starts', 'article', 1 FROM m3 RETURNING id),
l41 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Overcoming Inner Resistance', 'article', 1 FROM m4 RETURNING id),
l51 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Measurement and Accountability', 'article', 1 FROM m5 RETURNING id),
l61 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Long-Term Discipline and Energy', 'article', 1 FROM m6 RETURNING id)
INSERT INTO lesson_contents (lesson_id, body_markdown)
SELECT id, body FROM (
  SELECT (SELECT id FROM l11) AS id, 'Clarity is the beginning of achievement. With defined intention and emotional purpose, attention systems align with opportunity recognition. Exercise: define 3 goals for 12 months and the why for each.' AS body
  UNION ALL
  SELECT (SELECT id FROM l21), 'Use SMART design: specific outcomes, measurable indicators, achievable scope, relevance to values, and clear deadlines. Convert vague goals into operational commitments.'
  UNION ALL
  SELECT (SELECT id FROM l31), 'Goals set direction; systems produce daily execution. Build recurring routines: fixed action slots, habit stacks, weekly review, and milestone tracking.'
  UNION ALL
  SELECT (SELECT id FROM l41), 'Fear, perfectionism, and doubt create self-sabotage loops. Reframe setbacks as data, not identity. Use progress language and iterative behavior.'
  UNION ALL
  SELECT (SELECT id FROM l51), 'Track progress weekly and use accountability structures. Report what worked, what failed, and what next action is due. Small-win celebration increases persistence.'
  UNION ALL
  SELECT (SELECT id FROM l61), 'Sustain momentum through discipline when motivation dips. Use visualization, rewards, and purpose reconnection rituals to continue consistent execution.'
) q;

COMMIT;
