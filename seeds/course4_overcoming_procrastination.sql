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
WHERE title = 'Overcoming Procrastination: How to Get Things Done Now (Course 4 Extended)';

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
    'Overcoming Procrastination: How to Get Things Done Now (Course 4 Extended)',
    'Break delay cycles using psychology, structured focus, and accountability systems.',
    'A complete anti-procrastination course with chapters, exercises, and applied routines.',
    'Preface: This course was created to help learners break free from delay, distraction, and hesitation. Procrastination is not a flaw; it is a rewritable habit. Dedication: To everyone who has delayed their work, this course is for you. Introduction: Procrastination is a mind problem where comfort is chosen over meaningful action. Action precedes motivation. This extended course covers emotional resistance, perfectionism, momentum, focus environments, Pomodoro practice, and accountability systems.',
    cat.id,
    'self-paced',
    TRUE,
    5
  FROM cat
  RETURNING id
),
m1 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 1. The Psychology Behind Procrastination', 1 FROM new_course RETURNING id),
m2 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 2. The Illusion of Later', 2 FROM new_course RETURNING id),
m3 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 3. Emotional Resistance and the Fear of Starting', 3 FROM new_course RETURNING id),
m4 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 4. Perfectionism: The Hidden Face of Procrastination', 4 FROM new_course RETURNING id),
m5 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 5. Building Momentum Through Small Wins', 5 FROM new_course RETURNING id),
m6 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 6. Environment and Focus', 6 FROM new_course RETURNING id),
m7 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 7. Accountability and Commitment', 7 FROM new_course RETURNING id)
SELECT 1;

WITH c AS (
  SELECT id FROM courses WHERE title = 'Overcoming Procrastination: How to Get Things Done Now (Course 4 Extended)' LIMIT 1
),
m1 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 1. The Psychology Behind Procrastination' LIMIT 1),
m2 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 2. The Illusion of Later' LIMIT 1),
m3 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 3. Emotional Resistance and the Fear of Starting' LIMIT 1),
m4 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 4. Perfectionism: The Hidden Face of Procrastination' LIMIT 1),
m5 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 5. Building Momentum Through Small Wins' LIMIT 1),
m6 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 6. Environment and Focus' LIMIT 1),
m7 AS (SELECT id FROM modules WHERE course_id = (SELECT id FROM c) AND title = 'Chapter 7. Accountability and Commitment' LIMIT 1),
l11 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Why Delay Happens', 'article', 1 FROM m1 RETURNING id),
l21 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Decision Management Over Time Management', 'article', 1 FROM m2 RETURNING id),
l31 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lowering the Activation Threshold', 'article', 1 FROM m3 RETURNING id),
l41 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Progress Over Perfection', 'article', 1 FROM m4 RETURNING id),
l51 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Consistency Compounds', 'article', 1 FROM m5 RETURNING id),
l61 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Designing a Focus-Friendly Environment', 'article', 1 FROM m6 RETURNING id),
l62 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Pomodoro Technique in Practice', 'article', 2 FROM m6 RETURNING id),
l71 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Social Structure for Follow-Through', 'article', 1 FROM m7 RETURNING id)
INSERT INTO lesson_contents (lesson_id, body_markdown)
SELECT id, body FROM (
  SELECT (SELECT id FROM l11) AS id, 'Procrastination is not laziness; it is emotional mismanagement. We avoid the emotional discomfort tied to tasks, not the tasks themselves. Your brain seeks short-term relief and interprets discomfort as danger. The shift is to act from purpose, not mood.' AS body
  UNION ALL
  SELECT (SELECT id FROM l21), 'Later feels safe but usually delays the same emotional friction. Future-you is not automatically more motivated. Build systems now: fixed start times, if-then rules, and pre-committed work windows.'
  UNION ALL
  SELECT (SELECT id FROM l31), 'Starting is the highest-friction moment. Use the 2-Minute Rule to reduce resistance. Start tiny: open the file, wear gym shoes, read one paragraph. Once started, momentum lowers anxiety and increases focus.'
  UNION ALL
  SELECT (SELECT id FROM l41), 'Perfectionism delays execution through fear of imperfection. Replace perfection with iteration. First drafts are supposed to be imperfect. Progress is built through repeated improvement.'
  UNION ALL
  SELECT (SELECT id FROM l51), 'Momentum grows through small wins. Break large tasks into micro-steps, complete one visible action, and continue consistently. Consistency beats occasional intensity.'
  UNION ALL
  SELECT (SELECT id FROM l61), 'Your environment influences behavior. Remove distractions, clean workspace clutter, silence notifications, and define deep work windows. Protect focus as a high-value resource.'
  UNION ALL
  SELECT (SELECT id FROM l62), 'Pomodoro flow: choose a task, set timer, work single-task until timer ends, take 5-minute break, repeat four cycles, then take longer break. This rhythm improves completion and mental stamina.'
  UNION ALL
  SELECT (SELECT id FROM l71), 'Accountability increases completion. Share goals with a trusted person, report progress weekly, and commit publicly to action milestones. What gets reported gets done.'
) q;

COMMIT;
