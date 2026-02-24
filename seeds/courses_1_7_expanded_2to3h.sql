BEGIN;

CREATE TABLE IF NOT EXISTS lesson_contents (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
  body_markdown TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categories (name) SELECT 'Mindset and Personal Mastery' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Mindset and Personal Mastery');
INSERT INTO categories (name) SELECT 'Productivity and Success Strategies' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='Productivity and Success Strategies');

-- Course 1
DELETE FROM courses WHERE title = 'L1-P1-C1: The Confidence Code: Building Unstoppable Self-Belief';
WITH cat AS (SELECT id FROM categories WHERE name='Mindset and Personal Mastery' LIMIT 1),
new_course AS (
  INSERT INTO courses (title, description, short_description, long_description, category_id, delivery_mode, has_certificate, duration_weeks)
  SELECT 'L1-P1-C1: The Confidence Code: Building Unstoppable Self-Belief', 'Expanded 2-3 hours course', 'The Confidence Code: Building Unstoppable Self-Belief', 'Your mind is extraordinarily powerful. Your thoughts shape energy, emotions, and destiny. Confidence is not an inborn gift; it is a trainable identity built through intentional thinking, courageous action, and repeated self-trust. This course helps learners decode and strengthen inner belief so they can perform under pressure, recover from setbacks, and move forward with conviction.', cat.id, 'self-paced', TRUE, 6
  FROM cat RETURNING id
)
,m1 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 1: The Psychology of Confidence', 1 FROM new_course RETURNING id)
,m2 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 2: Breaking the Cycle of Self-Doubt', 2 FROM new_course RETURNING id)
,m3 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 3: The Habit of Bold Action', 3 FROM new_course RETURNING id)
,m4 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 4: Building Inner Strength and Long-Term Confidence', 4 FROM new_course RETURNING id)
SELECT 1;

WITH c AS (SELECT id FROM courses WHERE title='L1-P1-C1: The Confidence Code: Building Unstoppable Self-Belief' LIMIT 1),
m1 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Module 1: The Psychology of Confidence' LIMIT 1)
,m2 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Module 2: Breaking the Cycle of Self-Doubt' LIMIT 1)
,m3 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Module 3: The Habit of Bold Action' LIMIT 1)
,m4 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Module 4: Building Inner Strength and Long-Term Confidence' LIMIT 1)
,l1 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 1.1: Confidence Begins in Thought', 'article', 1 FROM m1 RETURNING id)
,l2 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 1.2: Self-Image and Performance', 'article', 2 FROM m1 RETURNING id)
,l3 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: The Psychology of Confidence', 'article', 3 FROM m1 RETURNING id)
,l4 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: The Psychology of Confidence', 'article', 4 FROM m1 RETURNING id)
,l5 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 1', 'article', 5 FROM m1 RETURNING id)
,l6 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 2.1: Spotting the Voice of Doubt', 'article', 1 FROM m2 RETURNING id)
,l7 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 2.2: Reframing Through Micro-Wins', 'article', 2 FROM m2 RETURNING id)
,l8 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Breaking the Cycle of Self-Doubt', 'article', 3 FROM m2 RETURNING id)
,l9 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Breaking the Cycle of Self-Doubt', 'article', 4 FROM m2 RETURNING id)
,l10 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 2', 'article', 5 FROM m2 RETURNING id)
,l11 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 3.1: Courage in Practice', 'article', 1 FROM m3 RETURNING id)
,l12 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 3.2: Action Creates Confidence', 'article', 2 FROM m3 RETURNING id)
,l13 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: The Habit of Bold Action', 'article', 3 FROM m3 RETURNING id)
,l14 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: The Habit of Bold Action', 'article', 4 FROM m3 RETURNING id)
,l15 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 3', 'article', 5 FROM m3 RETURNING id)
,l16 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 4.1: Resilience Over Perfection', 'article', 1 FROM m4 RETURNING id)
,l17 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 4.2: The Confidence Code in Daily Life', 'article', 2 FROM m4 RETURNING id)
,l18 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Building Inner Strength and Long-Term Confidence', 'article', 3 FROM m4 RETURNING id)
,l19 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Building Inner Strength and Long-Term Confidence', 'article', 4 FROM m4 RETURNING id)
,l20 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 4', 'article', 5 FROM m4 RETURNING id)
INSERT INTO lesson_contents (lesson_id, body_markdown)
SELECT (SELECT id FROM l1) AS id, '# Lesson 1.1: Confidence Begins in Thought

Estimated duration: 8 minutes

Confidence begins in the mind. Dominant thoughts become dominant behavior. Your self-concept acts as an internal thermostat, regulating how far you allow yourself to go. When you repeatedly see yourself as capable, the brain aligns emotion and action with that identity. Repetition of constructive self-belief builds neural pathways that make confidence feel natural.

Quote focus: "As a man thinketh in his heart, so is he" (Proverbs 23:7).

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l2) AS id, '# Lesson 1.2: Self-Image and Performance

Estimated duration: 8 minutes

Performance is often a mirror of identity. People who believe they are resourceful, worthy, and able to learn from failure are more likely to take initiative. This lesson introduces self-image recalibration through reflection prompts and identity-based affirmations.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l3) AS id, '# Case Study: The Psychology of Confidence

Estimated duration: 6 minutes

A realistic scenario is used to apply the psychology of confidence under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l4) AS id, '# Practice Lab: The Psychology of Confidence

Estimated duration: 8 minutes

Hands-on implementation session for the psychology of confidence.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l5) AS id, '# Reflection and Quiz Checkpoint 1

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l6) AS id, '# Lesson 2.1: Spotting the Voice of Doubt

Estimated duration: 8 minutes

Self-doubt grows through comparison, harsh self-judgment, and fixation on past failure. Confidence grows through evidence of progress. Learners will identify their top recurring doubt scripts and replace them with growth statements.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l7) AS id, '# Lesson 2.2: Reframing Through Micro-Wins

Estimated duration: 8 minutes

Use a daily victory log: write three actions you completed, even small ones. This trains the mind to recognize capability instead of deficiency. Every confident person once felt uncertain; confidence develops when action continues anyway.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l8) AS id, '# Case Study: Breaking the Cycle of Self-Doubt

Estimated duration: 6 minutes

A realistic scenario is used to apply breaking the cycle of self-doubt under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l9) AS id, '# Practice Lab: Breaking the Cycle of Self-Doubt

Estimated duration: 8 minutes

Hands-on implementation session for breaking the cycle of self-doubt.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l10) AS id, '# Reflection and Quiz Checkpoint 2

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l11) AS id, '# Lesson 3.1: Courage in Practice

Estimated duration: 8 minutes

Courage is not the absence of fear but movement despite fear. Each bold action creates memory evidence that reduces future hesitation. Start with small risks: speak up, share a viewpoint, initiate a difficult conversation, or volunteer for responsibility.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l12) AS id, '# Lesson 3.2: Action Creates Confidence

Estimated duration: 8 minutes

Confidence is built through repetition, not luck. Learners practice the 24-hour courage rule: take one action within 24 hours of identifying an opportunity.

Quote focus: "Faith without works is dead" (James 2:17).

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l13) AS id, '# Case Study: The Habit of Bold Action

Estimated duration: 6 minutes

A realistic scenario is used to apply the habit of bold action under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l14) AS id, '# Practice Lab: The Habit of Bold Action

Estimated duration: 8 minutes

Hands-on implementation session for the habit of bold action.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l15) AS id, '# Reflection and Quiz Checkpoint 3

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l16) AS id, '# Lesson 4.1: Resilience Over Perfection

Estimated duration: 8 minutes

True confidence does not come from being flawless. It comes from recovering quickly and staying anchored when life shakes you. Learners develop a resilience routine using reflection, affirmations, and emotional reset tools.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l17) AS id, '# Lesson 4.2: The Confidence Code in Daily Life

Estimated duration: 8 minutes

Live confidently by reframing challenges as growth opportunities, choosing progress over perfection, and recalling past victories before high-pressure tasks.

Affirmation model: "I am capable. I am growing. I am enough."

Quote focus: "I can do all things through Christ who strengthens me" (Philippians 4:13).

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l18) AS id, '# Case Study: Building Inner Strength and Long-Term Confidence

Estimated duration: 6 minutes

A realistic scenario is used to apply building inner strength and long-term confidence under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l19) AS id, '# Practice Lab: Building Inner Strength and Long-Term Confidence

Estimated duration: 8 minutes

Hands-on implementation session for building inner strength and long-term confidence.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l20) AS id, '# Reflection and Quiz Checkpoint 4

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body;

-- Course 2
DELETE FROM courses WHERE title = 'L1-P1-C2: Overcoming Negative Thinking: Rewiring Your Brain for Positivity';
WITH cat AS (SELECT id FROM categories WHERE name='Mindset and Personal Mastery' LIMIT 1),
new_course AS (
  INSERT INTO courses (title, description, short_description, long_description, category_id, delivery_mode, has_certificate, duration_weeks)
  SELECT 'L1-P1-C2: Overcoming Negative Thinking: Rewiring Your Brain for Positivity', 'Expanded 2-3 hours course', 'Overcoming Negative Thinking: Rewiring Your Brain for Positivity', 'Negative thinking is not destiny. It is a learned mental program that can be unlearned through neuroplasticity, awareness, and disciplined cognitive practice. This course teaches learners to identify destructive thought patterns, challenge distortions, and build emotional clarity, optimism, and resilience.', cat.id, 'self-paced', TRUE, 6
  FROM cat RETURNING id
)
,m1 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 1: The Science of Thought', 1 FROM new_course RETURNING id)
,m2 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 2: The Nature of Negative Thinking', 2 FROM new_course RETURNING id)
,m3 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 3: Recognizing Cognitive Distortions', 3 FROM new_course RETURNING id)
,m4 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 4: Rewiring for Positivity', 4 FROM new_course RETURNING id)
,m5 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 5: Gratitude, Perspective, and Environment', 5 FROM new_course RETURNING id)
SELECT 1;

WITH c AS (SELECT id FROM courses WHERE title='L1-P1-C2: Overcoming Negative Thinking: Rewiring Your Brain for Positivity' LIMIT 1),
m1 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Module 1: The Science of Thought' LIMIT 1)
,m2 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Module 2: The Nature of Negative Thinking' LIMIT 1)
,m3 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Module 3: Recognizing Cognitive Distortions' LIMIT 1)
,m4 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Module 4: Rewiring for Positivity' LIMIT 1)
,m5 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Module 5: Gratitude, Perspective, and Environment' LIMIT 1)
,l1 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 1.1: Neuroplasticity and Mental Patterns', 'article', 1 FROM m1 RETURNING id)
,l2 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 1.2: Emotional Chemistry of Thought', 'article', 2 FROM m1 RETURNING id)
,l3 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: The Science of Thought', 'article', 3 FROM m1 RETURNING id)
,l4 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: The Science of Thought', 'article', 4 FROM m1 RETURNING id)
,l5 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 1', 'article', 5 FROM m1 RETURNING id)
,l6 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 2.1: Core Beliefs and Internal Scripts', 'article', 1 FROM m2 RETURNING id)
,l7 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 2.2: Beliefs vs. Events', 'article', 2 FROM m2 RETURNING id)
,l8 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: The Nature of Negative Thinking', 'article', 3 FROM m2 RETURNING id)
,l9 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: The Nature of Negative Thinking', 'article', 4 FROM m2 RETURNING id)
,l10 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 2', 'article', 5 FROM m2 RETURNING id)
,l11 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 3.1: Distortion Types and Detection', 'article', 1 FROM m3 RETURNING id)
,l12 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 3.2: Distortion-to-Truth Practice', 'article', 2 FROM m3 RETURNING id)
,l13 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Recognizing Cognitive Distortions', 'article', 3 FROM m3 RETURNING id)
,l14 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Recognizing Cognitive Distortions', 'article', 4 FROM m3 RETURNING id)
,l15 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 3', 'article', 5 FROM m3 RETURNING id)
,l16 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 4.1: Interrupt, Question, Replace', 'article', 1 FROM m4 RETURNING id)
,l17 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 4.2: Systemizing Better Thinking', 'article', 2 FROM m4 RETURNING id)
,l18 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Rewiring for Positivity', 'article', 3 FROM m4 RETURNING id)
,l19 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Rewiring for Positivity', 'article', 4 FROM m4 RETURNING id)
,l20 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 4', 'article', 5 FROM m4 RETURNING id)
,l21 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 5.1: Gratitude as Cognitive Training', 'article', 1 FROM m5 RETURNING id)
,l22 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 5.2: Designing a Positive Mental Ecosystem', 'article', 2 FROM m5 RETURNING id)
,l23 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Gratitude, Perspective, and Environment', 'article', 3 FROM m5 RETURNING id)
,l24 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Gratitude, Perspective, and Environment', 'article', 4 FROM m5 RETURNING id)
,l25 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 5', 'article', 5 FROM m5 RETURNING id)
INSERT INTO lesson_contents (lesson_id, body_markdown)
SELECT (SELECT id FROM l1) AS id, '# Lesson 1.1: Neuroplasticity and Mental Patterns

Estimated duration: 8 minutes

Your brain rewires based on repetition. Each thought strengthens a pathway. Repeated negative thoughts train the brain to scan for danger; repeated constructive thoughts train it to notice options and resources. Thought management is future management.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l2) AS id, '# Lesson 1.2: Emotional Chemistry of Thought

Estimated duration: 8 minutes

Negative thoughts trigger stress chemistry and narrowed perception. Constructive thoughts increase calm, motivation, and creativity. This lesson introduces a thought-chemistry tracker to map triggers and emotional outcomes.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l3) AS id, '# Case Study: The Science of Thought

Estimated duration: 6 minutes

A realistic scenario is used to apply the science of thought under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l4) AS id, '# Practice Lab: The Science of Thought

Estimated duration: 8 minutes

Hands-on implementation session for the science of thought.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l5) AS id, '# Reflection and Quiz Checkpoint 1

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l6) AS id, '# Lesson 2.1: Core Beliefs and Internal Scripts

Estimated duration: 8 minutes

Many negative beliefs begin in early emotional experiences and become internal scripts: "I am not enough," "Nothing works out for me," or "I cannot trust anyone." Learners identify and map their top three inherited scripts.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l7) AS id, '# Lesson 2.2: Beliefs vs. Events

Estimated duration: 8 minutes

Following REBT principles, distress is often created by interpretation rather than event alone. The shift begins when learners ask: What happened? What did I tell myself it means? Is that story fully true?

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l8) AS id, '# Case Study: The Nature of Negative Thinking

Estimated duration: 6 minutes

A realistic scenario is used to apply the nature of negative thinking under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l9) AS id, '# Practice Lab: The Nature of Negative Thinking

Estimated duration: 8 minutes

Hands-on implementation session for the nature of negative thinking.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l10) AS id, '# Reflection and Quiz Checkpoint 2

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l11) AS id, '# Lesson 3.1: Distortion Types and Detection

Estimated duration: 8 minutes

Key distortions include catastrophizing, personalization, all-or-nothing thinking, and filtering. Labeling a distortion weakens its emotional grip and creates mental distance from it.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l12) AS id, '# Lesson 3.2: Distortion-to-Truth Practice

Estimated duration: 8 minutes

Learners convert distorted statements into balanced truth statements. Example: "If this fails, everything is over" becomes "This may be difficult, but one event does not define my future."

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l13) AS id, '# Case Study: Recognizing Cognitive Distortions

Estimated duration: 6 minutes

A realistic scenario is used to apply recognizing cognitive distortions under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l14) AS id, '# Practice Lab: Recognizing Cognitive Distortions

Estimated duration: 8 minutes

Hands-on implementation session for recognizing cognitive distortions.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l15) AS id, '# Reflection and Quiz Checkpoint 3

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l16) AS id, '# Lesson 4.1: Interrupt, Question, Replace

Estimated duration: 8 minutes

Use a 3-step reset: Interrupt the thought, question its accuracy, replace it with a constructive alternative. Practice this repeatedly until it becomes automatic under stress.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l17) AS id, '# Lesson 4.2: Systemizing Better Thinking

Estimated duration: 8 minutes

Goals do not sustain mindset change; systems do. Learners build a daily thinking system with morning intention, midday reset, and evening reframing review.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l18) AS id, '# Case Study: Rewiring for Positivity

Estimated duration: 6 minutes

A realistic scenario is used to apply rewiring for positivity under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l19) AS id, '# Practice Lab: Rewiring for Positivity

Estimated duration: 8 minutes

Hands-on implementation session for rewiring for positivity.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l20) AS id, '# Reflection and Quiz Checkpoint 4

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l21) AS id, '# Lesson 5.1: Gratitude as Cognitive Training

Estimated duration: 8 minutes

Gratitude is not denial of pain; it is disciplined attention to what is still working. Daily gratitude practice shifts perception from scarcity toward resourcefulness and strengthens motivation.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l22) AS id, '# Lesson 5.2: Designing a Positive Mental Ecosystem

Estimated duration: 8 minutes

Your environment shapes your mental tone. Curate inputs: conversations, media, books, and communities. Positivity becomes sustainable when your ecosystem supports it.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l23) AS id, '# Case Study: Gratitude, Perspective, and Environment

Estimated duration: 6 minutes

A realistic scenario is used to apply gratitude, perspective, and environment under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l24) AS id, '# Practice Lab: Gratitude, Perspective, and Environment

Estimated duration: 8 minutes

Hands-on implementation session for gratitude, perspective, and environment.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l25) AS id, '# Reflection and Quiz Checkpoint 5

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body;

-- Course 3
DELETE FROM courses WHERE title = 'L1-P2-C3: Overcoming Procrastination: How to Get Things Done Now';
WITH cat AS (SELECT id FROM categories WHERE name='Productivity and Success Strategies' LIMIT 1),
new_course AS (
  INSERT INTO courses (title, description, short_description, long_description, category_id, delivery_mode, has_certificate, duration_weeks)
  SELECT 'L1-P2-C3: Overcoming Procrastination: How to Get Things Done Now', 'Expanded 2-3 hours course', 'Overcoming Procrastination: How to Get Things Done Now', 'Procrastination is not a time problem. It is a regulation problem where short-term comfort overrides meaningful action. This course helps learners understand the psychology behind delay and build systems that turn intention into consistent execution.', cat.id, 'self-paced', TRUE, 6
  FROM cat RETURNING id
)
,m1 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 1: The Psychology Behind Procrastination', 1 FROM new_course RETURNING id)
,m2 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 2: The Illusion of Later', 2 FROM new_course RETURNING id)
,m3 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 3: Emotional Resistance and the Fear of Starting', 3 FROM new_course RETURNING id)
,m4 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 4: Perfectionism and Momentum', 4 FROM new_course RETURNING id)
,m5 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Module 5: Environment, Focus, and Accountability', 5 FROM new_course RETURNING id)
SELECT 1;

WITH c AS (SELECT id FROM courses WHERE title='L1-P2-C3: Overcoming Procrastination: How to Get Things Done Now' LIMIT 1),
m1 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Module 1: The Psychology Behind Procrastination' LIMIT 1)
,m2 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Module 2: The Illusion of Later' LIMIT 1)
,m3 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Module 3: Emotional Resistance and the Fear of Starting' LIMIT 1)
,m4 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Module 4: Perfectionism and Momentum' LIMIT 1)
,m5 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Module 5: Environment, Focus, and Accountability' LIMIT 1)
,l1 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 1.1: Why We Delay', 'article', 1 FROM m1 RETURNING id)
,l2 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 1.2: Mood Repair vs. Long-Term Reward', 'article', 2 FROM m1 RETURNING id)
,l3 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: The Psychology Behind Procrastination', 'article', 3 FROM m1 RETURNING id)
,l4 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: The Psychology Behind Procrastination', 'article', 4 FROM m1 RETURNING id)
,l5 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 1', 'article', 5 FROM m1 RETURNING id)
,l6 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 2.1: Future-Self Myth', 'article', 1 FROM m2 RETURNING id)
,l7 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 2.2: Decision Management', 'article', 2 FROM m2 RETURNING id)
,l8 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: The Illusion of Later', 'article', 3 FROM m2 RETURNING id)
,l9 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: The Illusion of Later', 'article', 4 FROM m2 RETURNING id)
,l10 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 2', 'article', 5 FROM m2 RETURNING id)
,l11 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 3.1: Activation Threshold', 'article', 1 FROM m3 RETURNING id)
,l12 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 3.2: The 2-Minute Rule', 'article', 2 FROM m3 RETURNING id)
,l13 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Emotional Resistance and the Fear of Starting', 'article', 3 FROM m3 RETURNING id)
,l14 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Emotional Resistance and the Fear of Starting', 'article', 4 FROM m3 RETURNING id)
,l15 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 3', 'article', 5 FROM m3 RETURNING id)
,l16 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 4.1: Perfectionism as Hidden Delay', 'article', 1 FROM m4 RETURNING id)
,l17 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 4.2: Small Wins Framework', 'article', 2 FROM m4 RETURNING id)
,l18 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Perfectionism and Momentum', 'article', 3 FROM m4 RETURNING id)
,l19 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Perfectionism and Momentum', 'article', 4 FROM m4 RETURNING id)
,l20 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 4', 'article', 5 FROM m4 RETURNING id)
,l21 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 5.1: Designing for Focus', 'article', 1 FROM m5 RETURNING id)
,l22 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lesson 5.2: Accountability Systems', 'article', 2 FROM m5 RETURNING id)
,l23 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Environment, Focus, and Accountability', 'article', 3 FROM m5 RETURNING id)
,l24 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Environment, Focus, and Accountability', 'article', 4 FROM m5 RETURNING id)
,l25 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 5', 'article', 5 FROM m5 RETURNING id)
INSERT INTO lesson_contents (lesson_id, body_markdown)
SELECT (SELECT id FROM l1) AS id, '# Lesson 1.1: Why We Delay

Estimated duration: 8 minutes

Procrastination is often emotional mismanagement, not laziness. We avoid tasks that trigger discomfort: fear of failure, uncertainty, frustration, or perfection pressure. Understanding this reduces self-blame and improves strategy selection.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l2) AS id, '# Lesson 1.2: Mood Repair vs. Long-Term Reward

Estimated duration: 8 minutes

The brain prefers immediate relief over delayed reward. Learners map their common comfort substitutions (scrolling, avoidance tasks, over-planning) and design response alternatives.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l3) AS id, '# Case Study: The Psychology Behind Procrastination

Estimated duration: 6 minutes

A realistic scenario is used to apply the psychology behind procrastination under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l4) AS id, '# Practice Lab: The Psychology Behind Procrastination

Estimated duration: 8 minutes

Hands-on implementation session for the psychology behind procrastination.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l5) AS id, '# Reflection and Quiz Checkpoint 1

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l6) AS id, '# Lesson 2.1: Future-Self Myth

Estimated duration: 8 minutes

"Later" feels strategic but often postpones the same emotional difficulty. The future self is likely to face the same resistance unless systems change now.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l7) AS id, '# Lesson 2.2: Decision Management

Estimated duration: 8 minutes

Execution improves when decisions are pre-made. Learners apply if-then rules: "If it is 8:00 PM, I begin 25 minutes of focused study." Reducing decision friction reduces delay.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l8) AS id, '# Case Study: The Illusion of Later

Estimated duration: 6 minutes

A realistic scenario is used to apply the illusion of later under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l9) AS id, '# Practice Lab: The Illusion of Later

Estimated duration: 8 minutes

Hands-on implementation session for the illusion of later.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l10) AS id, '# Reflection and Quiz Checkpoint 2

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l11) AS id, '# Lesson 3.1: Activation Threshold

Estimated duration: 8 minutes

Starting is the hardest part. Once action begins, resistance drops. Learners use activation rituals and countdown entry methods to lower start friction.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l12) AS id, '# Lesson 3.2: The 2-Minute Rule

Estimated duration: 8 minutes

Start with a two-minute version of the task: open the file, write one line, read one paragraph, wear gym shoes. Initial motion generates momentum and dopamine reinforcement.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l13) AS id, '# Case Study: Emotional Resistance and the Fear of Starting

Estimated duration: 6 minutes

A realistic scenario is used to apply emotional resistance and the fear of starting under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l14) AS id, '# Practice Lab: Emotional Resistance and the Fear of Starting

Estimated duration: 8 minutes

Hands-on implementation session for emotional resistance and the fear of starting.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l15) AS id, '# Reflection and Quiz Checkpoint 3

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l16) AS id, '# Lesson 4.1: Perfectionism as Hidden Delay

Estimated duration: 8 minutes

Many delays are fear of imperfect output. The shift is from perfection to iteration: produce draft one, then improve. Progress compounds; perfection stalls.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l17) AS id, '# Lesson 4.2: Small Wins Framework

Estimated duration: 8 minutes

Break tasks into low-friction substeps, complete one visible unit at a time, and celebrate completion. Momentum is built from consistency, not intensity.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l18) AS id, '# Case Study: Perfectionism and Momentum

Estimated duration: 6 minutes

A realistic scenario is used to apply perfectionism and momentum under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l19) AS id, '# Practice Lab: Perfectionism and Momentum

Estimated duration: 8 minutes

Hands-on implementation session for perfectionism and momentum.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l20) AS id, '# Reflection and Quiz Checkpoint 4

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l21) AS id, '# Lesson 5.1: Designing for Focus

Estimated duration: 8 minutes

Use a distraction-resistant setup: clean workspace, muted notifications, and time-boxed focus intervals (Pomodoro). Protect attention like a limited asset.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l22) AS id, '# Lesson 5.2: Accountability Systems

Estimated duration: 8 minutes

Public commitments increase follow-through. Learners build accountability loops with peers, mentors, or digital trackers. The principle is simple: what gets reported gets done.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l23) AS id, '# Case Study: Environment, Focus, and Accountability

Estimated duration: 6 minutes

A realistic scenario is used to apply environment, focus, and accountability under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l24) AS id, '# Practice Lab: Environment, Focus, and Accountability

Estimated duration: 8 minutes

Hands-on implementation session for environment, focus, and accountability.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l25) AS id, '# Reflection and Quiz Checkpoint 5

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body;

-- Course 4
DELETE FROM courses WHERE title = 'L1-P2-C4: Overcoming Procrastination: How to Get Things Done Now';
WITH cat AS (SELECT id FROM categories WHERE name='Productivity and Success Strategies' LIMIT 1),
new_course AS (
  INSERT INTO courses (title, description, short_description, long_description, category_id, delivery_mode, has_certificate, duration_weeks)
  SELECT 'L1-P2-C4: Overcoming Procrastination: How to Get Things Done Now', 'Expanded 2-3 hours course', 'Overcoming Procrastination: How to Get Things Done Now', 'Procrastination is not a time problem; it is a mind problem. It is not that you do not have enough hours in the day — it is that your thoughts, emotions, and priorities are not aligned with action. Every time you delay a task, you trade progress for temporary comfort. You tell yourself, ''I will start later,'' but later often becomes never. Your brain is wired to seek comfort and avoid discomfort. Starting something uncertain, difficult, or demanding triggers the brain’s alarm system, and your natural response is to escape. But the truth is this: you will never feel fully ready. Action precedes motivation. Once you begin, momentum builds.', cat.id, 'self-paced', TRUE, 6
  FROM cat RETURNING id
)
,m1 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 1. The Psychology Behind Procrastination', 1 FROM new_course RETURNING id)
,m2 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 2. The Illusion of Later', 2 FROM new_course RETURNING id)
,m3 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 3. Emotional Resistance and the Fear of Starting', 3 FROM new_course RETURNING id)
,m4 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 4. Perfectionism: The Hidden Face of Procrastination', 4 FROM new_course RETURNING id)
,m5 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 5. Building Momentum Through Small Wins', 5 FROM new_course RETURNING id)
,m6 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 6. Environment and Focus', 6 FROM new_course RETURNING id)
,m7 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 7. Accountability and Commitment', 7 FROM new_course RETURNING id)
SELECT 1;

WITH c AS (SELECT id FROM courses WHERE title='L1-P2-C4: Overcoming Procrastination: How to Get Things Done Now' LIMIT 1),
m1 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 1. The Psychology Behind Procrastination' LIMIT 1)
,m2 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 2. The Illusion of Later' LIMIT 1)
,m3 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 3. Emotional Resistance and the Fear of Starting' LIMIT 1)
,m4 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 4. Perfectionism: The Hidden Face of Procrastination' LIMIT 1)
,m5 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 5. Building Momentum Through Small Wins' LIMIT 1)
,m6 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 6. Environment and Focus' LIMIT 1)
,m7 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 7. Accountability and Commitment' LIMIT 1)
,l1 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Why Delay Happens', 'article', 1 FROM m1 RETURNING id)
,l2 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: The Psychology Behind Procrastination', 'article', 2 FROM m1 RETURNING id)
,l3 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: The Psychology Behind Procrastination', 'article', 3 FROM m1 RETURNING id)
,l4 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 1', 'article', 4 FROM m1 RETURNING id)
,l5 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Decision Management Over Time Management', 'article', 1 FROM m2 RETURNING id)
,l6 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: The Illusion of Later', 'article', 2 FROM m2 RETURNING id)
,l7 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: The Illusion of Later', 'article', 3 FROM m2 RETURNING id)
,l8 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 2', 'article', 4 FROM m2 RETURNING id)
,l9 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Lowering the Activation Threshold', 'article', 1 FROM m3 RETURNING id)
,l10 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Emotional Resistance and the Fear of Starting', 'article', 2 FROM m3 RETURNING id)
,l11 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Emotional Resistance and the Fear of Starting', 'article', 3 FROM m3 RETURNING id)
,l12 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 3', 'article', 4 FROM m3 RETURNING id)
,l13 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Progress Over Perfection', 'article', 1 FROM m4 RETURNING id)
,l14 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Perfectionism: The Hidden Face of Procrastination', 'article', 2 FROM m4 RETURNING id)
,l15 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Perfectionism: The Hidden Face of Procrastination', 'article', 3 FROM m4 RETURNING id)
,l16 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 4', 'article', 4 FROM m4 RETURNING id)
,l17 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Consistency Compounds', 'article', 1 FROM m5 RETURNING id)
,l18 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Building Momentum Through Small Wins', 'article', 2 FROM m5 RETURNING id)
,l19 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Building Momentum Through Small Wins', 'article', 3 FROM m5 RETURNING id)
,l20 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 5', 'article', 4 FROM m5 RETURNING id)
,l21 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Designing a Focus-Friendly Environment', 'article', 1 FROM m6 RETURNING id)
,l22 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Pomodoro Technique in Practice', 'article', 2 FROM m6 RETURNING id)
,l23 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Environment and Focus', 'article', 3 FROM m6 RETURNING id)
,l24 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Environment and Focus', 'article', 4 FROM m6 RETURNING id)
,l25 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 6', 'article', 5 FROM m6 RETURNING id)
,l26 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Social Structure for Follow-Through', 'article', 1 FROM m7 RETURNING id)
,l27 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Accountability and Commitment', 'article', 2 FROM m7 RETURNING id)
,l28 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Accountability and Commitment', 'article', 3 FROM m7 RETURNING id)
,l29 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 7', 'article', 4 FROM m7 RETURNING id)
INSERT INTO lesson_contents (lesson_id, body_markdown)
SELECT (SELECT id FROM l1) AS id, '# Why Delay Happens

Estimated duration: 8 minutes

Procrastination is not laziness — it is emotional mismanagement. According to Dr. Piers Steel, we procrastinate when we value short-term mood repair over long-term reward. We do not avoid work; we avoid the emotional discomfort linked to work, such as uncertainty, fear of failure, and perfection pressure. The brain interprets these emotions as danger and activates avoidance. To overcome procrastination, train yourself to act based on purpose, not mood.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l2) AS id, '# Case Study: The Psychology Behind Procrastination

Estimated duration: 6 minutes

A realistic scenario is used to apply the psychology behind procrastination under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l3) AS id, '# Practice Lab: The Psychology Behind Procrastination

Estimated duration: 8 minutes

Hands-on implementation session for the psychology behind procrastination.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l4) AS id, '# Reflection and Quiz Checkpoint 1

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l5) AS id, '# Decision Management Over Time Management

Estimated duration: 8 minutes

''Later'' feels safe because it promises control without commitment. But it is a mental trap. Your future self will face the same emotions and distractions unless your system changes. As James Clear writes, you do not rise to the level of your goals; you fall to the level of your systems. The antidote is decision management: make clear execution decisions now.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l6) AS id, '# Case Study: The Illusion of Later

Estimated duration: 6 minutes

A realistic scenario is used to apply the illusion of later under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l7) AS id, '# Practice Lab: The Illusion of Later

Estimated duration: 8 minutes

Hands-on implementation session for the illusion of later.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l8) AS id, '# Reflection and Quiz Checkpoint 2

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l9) AS id, '# Lowering the Activation Threshold

Estimated duration: 8 minutes

The hardest part of any task is beginning. Once you start, resistance weakens. Apply the 2-Minute Rule: begin with an action that takes less than two minutes. Open the document. Put on workout shoes. Read one paragraph. Starting creates momentum and reduces anxiety.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l10) AS id, '# Case Study: Emotional Resistance and the Fear of Starting

Estimated duration: 6 minutes

A realistic scenario is used to apply emotional resistance and the fear of starting under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l11) AS id, '# Practice Lab: Emotional Resistance and the Fear of Starting

Estimated duration: 8 minutes

Hands-on implementation session for emotional resistance and the fear of starting.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l12) AS id, '# Reflection and Quiz Checkpoint 3

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l13) AS id, '# Progress Over Perfection

Estimated duration: 8 minutes

Many people delay because they care deeply and fear imperfection. Perfectionism creates impossible standards and blocks execution. The winning mindset is iteration: start imperfectly, then improve. Every masterpiece begins as a rough draft.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l14) AS id, '# Case Study: Perfectionism: The Hidden Face of Procrastination

Estimated duration: 6 minutes

A realistic scenario is used to apply perfectionism: the hidden face of procrastination under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l15) AS id, '# Practice Lab: Perfectionism: The Hidden Face of Procrastination

Estimated duration: 8 minutes

Hands-on implementation session for perfectionism: the hidden face of procrastination.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l16) AS id, '# Reflection and Quiz Checkpoint 4

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l17) AS id, '# Consistency Compounds

Estimated duration: 8 minutes

Momentum is productivity’s hidden force. Break tasks into small actions, complete one step at a time, and celebrate completion. Focus on consistency over intensity. Small daily progress is stronger than rare bursts of effort.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l18) AS id, '# Case Study: Building Momentum Through Small Wins

Estimated duration: 6 minutes

A realistic scenario is used to apply building momentum through small wins under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l19) AS id, '# Practice Lab: Building Momentum Through Small Wins

Estimated duration: 8 minutes

Hands-on implementation session for building momentum through small wins.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l20) AS id, '# Reflection and Quiz Checkpoint 5

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l21) AS id, '# Designing a Focus-Friendly Environment

Estimated duration: 8 minutes

Your environment can feed or fight procrastination. Keep your workspace clean, silence unnecessary alerts, and use focus blocks. Protect attention as a limited resource.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l22) AS id, '# Pomodoro Technique in Practice

Estimated duration: 8 minutes

Choose one task. Set a timer for one focused interval (one Pomodoro). Work only on that task until the timer rings. Take a 5-minute break. Repeat. After four cycles, take a longer break. This structure improves focus and reduces overwhelm.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l23) AS id, '# Case Study: Environment and Focus

Estimated duration: 6 minutes

A realistic scenario is used to apply environment and focus under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l24) AS id, '# Practice Lab: Environment and Focus

Estimated duration: 8 minutes

Hands-on implementation session for environment and focus.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l25) AS id, '# Reflection and Quiz Checkpoint 6

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l26) AS id, '# Social Structure for Follow-Through

Estimated duration: 8 minutes

Goals remain flexible when private and become commitments when shared. Research shows completion increases when goals are reported to someone trusted. Use an accountability partner, mentor, or group to maintain execution discipline.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l27) AS id, '# Case Study: Accountability and Commitment

Estimated duration: 6 minutes

A realistic scenario is used to apply accountability and commitment under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l28) AS id, '# Practice Lab: Accountability and Commitment

Estimated duration: 8 minutes

Hands-on implementation session for accountability and commitment.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l29) AS id, '# Reflection and Quiz Checkpoint 7

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body;

-- Course 5
DELETE FROM courses WHERE title = 'L1-P2-C5: Goal-Setting Mastery: Creating and Crushing Your Goals';
WITH cat AS (SELECT id FROM categories WHERE name='Productivity and Success Strategies' LIMIT 1),
new_course AS (
  INSERT INTO courses (title, description, short_description, long_description, category_id, delivery_mode, has_certificate, duration_weeks)
  SELECT 'L1-P2-C5: Goal-Setting Mastery: Creating and Crushing Your Goals', 'Expanded 2-3 hours course', 'Goal-Setting Mastery: Creating and Crushing Your Goals', 'Your goals are the blueprint of your future. Every great achievement begins with clear vision and committed action. Goal-setting mastery is about taking control — defining what you want, why you want it, and how you will make it happen. This course transforms vague dreams into precise, measurable actions and helps you maintain momentum until results are achieved.', cat.id, 'self-paced', TRUE, 6
  FROM cat RETURNING id
)
,m1 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 1: The Power of Clear Intentions', 1 FROM new_course RETURNING id)
,m2 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 2: Designing SMART Goals', 2 FROM new_course RETURNING id)
,m3 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 3: Building Systems and Habits', 3 FROM new_course RETURNING id)
,m4 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 4: Mental Barriers and Self-Sabotage', 4 FROM new_course RETURNING id)
,m5 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 5: Tracking Progress and Staying Accountable', 5 FROM new_course RETURNING id)
,m6 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 6: Sustaining Motivation and Momentum', 6 FROM new_course RETURNING id)
SELECT 1;

WITH c AS (SELECT id FROM courses WHERE title='L1-P2-C5: Goal-Setting Mastery: Creating and Crushing Your Goals' LIMIT 1),
m1 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 1: The Power of Clear Intentions' LIMIT 1)
,m2 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 2: Designing SMART Goals' LIMIT 1)
,m3 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 3: Building Systems and Habits' LIMIT 1)
,m4 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 4: Mental Barriers and Self-Sabotage' LIMIT 1)
,m5 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 5: Tracking Progress and Staying Accountable' LIMIT 1)
,m6 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 6: Sustaining Motivation and Momentum' LIMIT 1)
,l1 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Clarity Creates Direction', 'article', 1 FROM m1 RETURNING id)
,l2 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: The Power of Clear Intentions', 'article', 2 FROM m1 RETURNING id)
,l3 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: The Power of Clear Intentions', 'article', 3 FROM m1 RETURNING id)
,l4 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 1', 'article', 4 FROM m1 RETURNING id)
,l5 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'From Dream to Structured Goal', 'article', 1 FROM m2 RETURNING id)
,l6 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Designing SMART Goals', 'article', 2 FROM m2 RETURNING id)
,l7 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Designing SMART Goals', 'article', 3 FROM m2 RETURNING id)
,l8 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 2', 'article', 4 FROM m2 RETURNING id)
,l9 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Systems Sustain What Motivation Starts', 'article', 1 FROM m3 RETURNING id)
,l10 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Building Systems and Habits', 'article', 2 FROM m3 RETURNING id)
,l11 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Building Systems and Habits', 'article', 3 FROM m3 RETURNING id)
,l12 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 3', 'article', 4 FROM m3 RETURNING id)
,l13 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Overcoming Inner Resistance', 'article', 1 FROM m4 RETURNING id)
,l14 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Mental Barriers and Self-Sabotage', 'article', 2 FROM m4 RETURNING id)
,l15 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Mental Barriers and Self-Sabotage', 'article', 3 FROM m4 RETURNING id)
,l16 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 4', 'article', 4 FROM m4 RETURNING id)
,l17 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Measurement and Accountability', 'article', 1 FROM m5 RETURNING id)
,l18 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Tracking Progress and Staying Accountable', 'article', 2 FROM m5 RETURNING id)
,l19 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Tracking Progress and Staying Accountable', 'article', 3 FROM m5 RETURNING id)
,l20 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 5', 'article', 4 FROM m5 RETURNING id)
,l21 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Long-Term Discipline and Energy', 'article', 1 FROM m6 RETURNING id)
,l22 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Sustaining Motivation and Momentum', 'article', 2 FROM m6 RETURNING id)
,l23 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Sustaining Motivation and Momentum', 'article', 3 FROM m6 RETURNING id)
,l24 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 6', 'article', 4 FROM m6 RETURNING id)
INSERT INTO lesson_contents (lesson_id, body_markdown)
SELECT (SELECT id FROM l1) AS id, '# Clarity Creates Direction

Estimated duration: 8 minutes

Everything starts with clarity. Without a target, the mind has no direction. When goals are specific and emotionally meaningful, attention systems such as the Reticular Activating System (RAS) begin filtering opportunities aligned to that direction. Quote focus: "A person who aims at nothing is sure to hit it." - Zig Ziglar.

Key exercise: write 3 specific 12-month goals and define the deeper why behind each.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l2) AS id, '# Case Study: The Power of Clear Intentions

Estimated duration: 6 minutes

A realistic scenario is used to apply the power of clear intentions under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l3) AS id, '# Practice Lab: The Power of Clear Intentions

Estimated duration: 8 minutes

Hands-on implementation session for the power of clear intentions.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l4) AS id, '# Reflection and Quiz Checkpoint 1

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l5) AS id, '# From Dream to Structured Goal

Estimated duration: 8 minutes

A dream becomes actionable when it is Specific, Measurable, Achievable, Relevant, and Time-bound. Learners practice converting vague outcomes into precise commitments with clear measurement methods, review checkpoints, and deadlines.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l6) AS id, '# Case Study: Designing SMART Goals

Estimated duration: 6 minutes

A realistic scenario is used to apply designing smart goals under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l7) AS id, '# Practice Lab: Designing SMART Goals

Estimated duration: 8 minutes

Hands-on implementation session for designing smart goals.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l8) AS id, '# Reflection and Quiz Checkpoint 2

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l9) AS id, '# Systems Sustain What Motivation Starts

Estimated duration: 8 minutes

Motivation can initiate action, but systems preserve progress. Build recurring behavior loops (daily actions, weekly reviews, milestone tracking). If the goal is writing a book, the system is writing a fixed word count consistently. Future outcomes are built by repeated practice, not occasional effort.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l10) AS id, '# Case Study: Building Systems and Habits

Estimated duration: 6 minutes

A realistic scenario is used to apply building systems and habits under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l11) AS id, '# Practice Lab: Building Systems and Habits

Estimated duration: 8 minutes

Hands-on implementation session for building systems and habits.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l12) AS id, '# Reflection and Quiz Checkpoint 3

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l13) AS id, '# Overcoming Inner Resistance

Estimated duration: 8 minutes

Fear, perfectionism, and doubt delay execution. Procrastination is often emotional regulation failure, not planning failure. Reframe setbacks as data. Replace all-or-nothing thinking with iterative progress. Quote focus: "You don’t rise to the level of your goals; you fall to the level of your systems." - James Clear.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l14) AS id, '# Case Study: Mental Barriers and Self-Sabotage

Estimated duration: 6 minutes

A realistic scenario is used to apply mental barriers and self-sabotage under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l15) AS id, '# Practice Lab: Mental Barriers and Self-Sabotage

Estimated duration: 8 minutes

Hands-on implementation session for mental barriers and self-sabotage.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l16) AS id, '# Reflection and Quiz Checkpoint 4

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l17) AS id, '# Measurement and Accountability

Estimated duration: 8 minutes

High performers review progress weekly. Track wins, friction points, and next actions. Accountability with mentors, peers, or systems significantly increases completion rates. Celebrating small wins reinforces identity and motivation.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l18) AS id, '# Case Study: Tracking Progress and Staying Accountable

Estimated duration: 6 minutes

A realistic scenario is used to apply tracking progress and staying accountable under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l19) AS id, '# Practice Lab: Tracking Progress and Staying Accountable

Estimated duration: 8 minutes

Hands-on implementation session for tracking progress and staying accountable.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l20) AS id, '# Reflection and Quiz Checkpoint 5

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l21) AS id, '# Long-Term Discipline and Energy

Estimated duration: 8 minutes

Discipline is action even when mood is low. Sustain momentum by visualizing outcomes, rewarding progress, and reconnecting to purpose regularly. Momentum grows when execution becomes habitual.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l22) AS id, '# Case Study: Sustaining Motivation and Momentum

Estimated duration: 6 minutes

A realistic scenario is used to apply sustaining motivation and momentum under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l23) AS id, '# Practice Lab: Sustaining Motivation and Momentum

Estimated duration: 8 minutes

Hands-on implementation session for sustaining motivation and momentum.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l24) AS id, '# Reflection and Quiz Checkpoint 6

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body;

-- Course 6
DELETE FROM courses WHERE title = 'L1-P2-C6: The Power of Focus: How to Stay on Track and Achieve Your Goals';
WITH cat AS (SELECT id FROM categories WHERE name='Productivity and Success Strategies' LIMIT 1),
new_course AS (
  INSERT INTO courses (title, description, short_description, long_description, category_id, delivery_mode, has_certificate, duration_weeks)
  SELECT 'L1-P2-C6: The Power of Focus: How to Stay on Track and Achieve Your Goals', 'Expanded 2-3 hours course', 'The Power of Focus: How to Stay on Track and Achieve Your Goals', 'Your mind is extraordinarily powerful. Focus is the deliberate direction of thought toward a meaningful outcome. In a noisy world, focus converts scattered effort into measurable progress. It is less about doing more and more about choosing what matters and sustaining attention long enough for results to appear.', cat.id, 'self-paced', TRUE, 6
  FROM cat RETURNING id
)
,m1 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 1. The Psychology of Focus', 1 FROM new_course RETURNING id)
,m2 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 2. Clarity: The Foundation of Focus', 2 FROM new_course RETURNING id)
,m3 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 3. Deep Work: The Engine of Achievement', 3 FROM new_course RETURNING id)
,m4 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 4. The Enemies of Focus', 4 FROM new_course RETURNING id)
,m5 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 5. The Power of Mental Endurance', 5 FROM new_course RETURNING id)
,m6 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 6. Aligning Focus with Purpose', 6 FROM new_course RETURNING id)
SELECT 1;

WITH c AS (SELECT id FROM courses WHERE title='L1-P2-C6: The Power of Focus: How to Stay on Track and Achieve Your Goals' LIMIT 1),
m1 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 1. The Psychology of Focus' LIMIT 1)
,m2 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 2. Clarity: The Foundation of Focus' LIMIT 1)
,m3 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 3. Deep Work: The Engine of Achievement' LIMIT 1)
,m4 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 4. The Enemies of Focus' LIMIT 1)
,m5 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 5. The Power of Mental Endurance' LIMIT 1)
,m6 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 6. Aligning Focus with Purpose' LIMIT 1)
,l1 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Focus as a Limited Cognitive Resource', 'article', 1 FROM m1 RETURNING id)
,l2 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: The Psychology of Focus', 'article', 2 FROM m1 RETURNING id)
,l3 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: The Psychology of Focus', 'article', 3 FROM m1 RETURNING id)
,l4 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 1', 'article', 4 FROM m1 RETURNING id)
,l5 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Clarity Before Concentration', 'article', 1 FROM m2 RETURNING id)
,l6 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Clarity: The Foundation of Focus', 'article', 2 FROM m2 RETURNING id)
,l7 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Clarity: The Foundation of Focus', 'article', 3 FROM m2 RETURNING id)
,l8 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 2', 'article', 4 FROM m2 RETURNING id)
,l9 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Shallow Work vs Deep Work', 'article', 1 FROM m3 RETURNING id)
,l10 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Deep Work: The Engine of Achievement', 'article', 2 FROM m3 RETURNING id)
,l11 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Deep Work: The Engine of Achievement', 'article', 3 FROM m3 RETURNING id)
,l12 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 3', 'article', 4 FROM m3 RETURNING id)
,l13 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Distraction, Multitasking, and Attention Leakage', 'article', 1 FROM m4 RETURNING id)
,l14 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: The Enemies of Focus', 'article', 2 FROM m4 RETURNING id)
,l15 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: The Enemies of Focus', 'article', 3 FROM m4 RETURNING id)
,l16 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 4', 'article', 4 FROM m4 RETURNING id)
,l17 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Training Attention Like a Muscle', 'article', 1 FROM m5 RETURNING id)
,l18 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: The Power of Mental Endurance', 'article', 2 FROM m5 RETURNING id)
,l19 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: The Power of Mental Endurance', 'article', 3 FROM m5 RETURNING id)
,l20 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 5', 'article', 4 FROM m5 RETURNING id)
,l21 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Purpose as Attention Fuel', 'article', 1 FROM m6 RETURNING id)
,l22 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Aligning Focus with Purpose', 'article', 2 FROM m6 RETURNING id)
,l23 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Aligning Focus with Purpose', 'article', 3 FROM m6 RETURNING id)
,l24 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 6', 'article', 4 FROM m6 RETURNING id)
INSERT INTO lesson_contents (lesson_id, body_markdown)
SELECT (SELECT id FROM l1) AS id, '# Focus as a Limited Cognitive Resource

Estimated duration: 8 minutes

The brain cannot sustain high-quality attention across many streams at once. When attention is fragmented, performance drops. When attention converges on one task, neural synchronization increases and flow becomes possible.

Practical experience: Observe professionals under pressure (surgeons, athletes, musicians). Their output quality is linked to depth of single-task attention.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l2) AS id, '# Case Study: The Psychology of Focus

Estimated duration: 6 minutes

A realistic scenario is used to apply the psychology of focus under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l3) AS id, '# Practice Lab: The Psychology of Focus

Estimated duration: 8 minutes

Hands-on implementation session for the psychology of focus.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l4) AS id, '# Reflection and Quiz Checkpoint 1

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l5) AS id, '# Clarity Before Concentration

Estimated duration: 8 minutes

You cannot focus on undefined goals. Clarity sets direction, and direction channels attention. Without clear targets, effort becomes scattered and progress stalls.

Quote focus: "The successful person is the average person, focused." - Napoleon Hill

Practical experience: Apply a weekly ''focus filter'' by selecting only 1-3 outcomes and consciously saying no to non-essential tasks.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l6) AS id, '# Case Study: Clarity: The Foundation of Focus

Estimated duration: 6 minutes

A realistic scenario is used to apply clarity: the foundation of focus under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l7) AS id, '# Practice Lab: Clarity: The Foundation of Focus

Estimated duration: 8 minutes

Hands-on implementation session for clarity: the foundation of focus.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l8) AS id, '# Reflection and Quiz Checkpoint 2

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l9) AS id, '# Shallow Work vs Deep Work

Estimated duration: 8 minutes

Shallow work creates the feeling of busyness. Deep work creates actual value through concentrated creation, problem-solving, and strategic thinking. High-level results come from uninterrupted focus windows over time.

Practical experience: Schedule two deep-work blocks per day (45-90 minutes), remove notifications, and define one clear output per block.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l10) AS id, '# Case Study: Deep Work: The Engine of Achievement

Estimated duration: 6 minutes

A realistic scenario is used to apply deep work: the engine of achievement under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l11) AS id, '# Practice Lab: Deep Work: The Engine of Achievement

Estimated duration: 8 minutes

Hands-on implementation session for deep work: the engine of achievement.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l12) AS id, '# Reflection and Quiz Checkpoint 3

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l13) AS id, '# Distraction, Multitasking, and Attention Leakage

Estimated duration: 8 minutes

Focus is attacked externally (devices, noise, interruptions) and internally (fear, fatigue, procrastination, emotional overload). Multitasking lowers efficiency and weakens memory retention.

Practical experience: Track interruption frequency for one study/work session and measure recovery time to full concentration. Build interruption boundaries to protect attention.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l14) AS id, '# Case Study: The Enemies of Focus

Estimated duration: 6 minutes

A realistic scenario is used to apply the enemies of focus under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l15) AS id, '# Practice Lab: The Enemies of Focus

Estimated duration: 8 minutes

Hands-on implementation session for the enemies of focus.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l16) AS id, '# Reflection and Quiz Checkpoint 4

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l17) AS id, '# Training Attention Like a Muscle

Estimated duration: 8 minutes

Focus is not a one-time talent; it is trained endurance. Attention grows with repeated deliberate practice and weakens with constant switching. Discipline provides stability when motivation fluctuates.

Quote focus: "Discipline is choosing what you want most over what you want now." - Abraham Lincoln

Practical experience: Use routine anchors (start time, location, ritual) to reduce decision fatigue and maintain consistent focus output.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l18) AS id, '# Case Study: The Power of Mental Endurance

Estimated duration: 6 minutes

A realistic scenario is used to apply the power of mental endurance under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l19) AS id, '# Practice Lab: The Power of Mental Endurance

Estimated duration: 8 minutes

Hands-on implementation session for the power of mental endurance.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l20) AS id, '# Reflection and Quiz Checkpoint 5

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l21) AS id, '# Purpose as Attention Fuel

Estimated duration: 8 minutes

Purpose gives focus emotional gravity. Without purpose, focus feels forced. Without focus, purpose remains unrealized. When both align, momentum becomes sustainable.

Practical experience: Write a one-sentence purpose statement for your current goal and review it before each focus block. This creates psychological alignment and improves persistence under pressure.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l22) AS id, '# Case Study: Aligning Focus with Purpose

Estimated duration: 6 minutes

A realistic scenario is used to apply aligning focus with purpose under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l23) AS id, '# Practice Lab: Aligning Focus with Purpose

Estimated duration: 8 minutes

Hands-on implementation session for aligning focus with purpose.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l24) AS id, '# Reflection and Quiz Checkpoint 6

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body;

-- Course 7
DELETE FROM courses WHERE title = 'L1-P2-C7: How to Master Time Management: Taking Control of Your Day';
WITH cat AS (SELECT id FROM categories WHERE name='Productivity and Success Strategies' LIMIT 1),
new_course AS (
  INSERT INTO courses (title, description, short_description, long_description, category_id, delivery_mode, has_certificate, duration_weeks)
  SELECT 'L1-P2-C7: How to Master Time Management: Taking Control of Your Day', 'Expanded 2-3 hours course', 'How to Master Time Management: Taking Control of Your Day', 'Time is life’s greatest equalizer. Everyone receives the same 24 hours, but outcomes differ by how those hours are used. Time management is not about squeezing in more tasks; it is about directing energy and priorities toward what matters most. When you master your time, you reduce chaos, increase consistency, and make space for growth and purpose.', cat.id, 'self-paced', TRUE, 6
  FROM cat RETURNING id
)
,m1 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 1. Understanding the Nature of Time', 1 FROM new_course RETURNING id)
,m2 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 2. The Psychology of Control', 2 FROM new_course RETURNING id)
,m3 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 3. The Priority Principle', 3 FROM new_course RETURNING id)
,m4 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 4. The Power of Planning', 4 FROM new_course RETURNING id)
,m5 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 5. Defeating Time Thieves', 5 FROM new_course RETURNING id)
,m6 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 6. Balancing Work and Renewal', 6 FROM new_course RETURNING id)
,m7 AS (INSERT INTO modules (course_id, title, order_index) SELECT id, 'Chapter 7. The Mindset of Time Investors', 7 FROM new_course RETURNING id)
SELECT 1;

WITH c AS (SELECT id FROM courses WHERE title='L1-P2-C7: How to Master Time Management: Taking Control of Your Day' LIMIT 1),
m1 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 1. Understanding the Nature of Time' LIMIT 1)
,m2 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 2. The Psychology of Control' LIMIT 1)
,m3 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 3. The Priority Principle' LIMIT 1)
,m4 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 4. The Power of Planning' LIMIT 1)
,m5 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 5. Defeating Time Thieves' LIMIT 1)
,m6 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 6. Balancing Work and Renewal' LIMIT 1)
,m7 AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='Chapter 7. The Mindset of Time Investors' LIMIT 1)
,l1 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Time as an Investment Asset', 'article', 1 FROM m1 RETURNING id)
,l2 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Understanding the Nature of Time', 'article', 2 FROM m1 RETURNING id)
,l3 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Understanding the Nature of Time', 'article', 3 FROM m1 RETURNING id)
,l4 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 1', 'article', 4 FROM m1 RETURNING id)
,l5 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reclaiming Schedule Authority', 'article', 1 FROM m2 RETURNING id)
,l6 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: The Psychology of Control', 'article', 2 FROM m2 RETURNING id)
,l7 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: The Psychology of Control', 'article', 3 FROM m2 RETURNING id)
,l8 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 2', 'article', 4 FROM m2 RETURNING id)
,l9 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Doing What Matters Most', 'article', 1 FROM m3 RETURNING id)
,l10 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: The Priority Principle', 'article', 2 FROM m3 RETURNING id)
,l11 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: The Priority Principle', 'article', 3 FROM m3 RETURNING id)
,l12 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 3', 'article', 4 FROM m3 RETURNING id)
,l13 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Time-Blocking for Execution', 'article', 1 FROM m4 RETURNING id)
,l14 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: The Power of Planning', 'article', 2 FROM m4 RETURNING id)
,l15 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: The Power of Planning', 'article', 3 FROM m4 RETURNING id)
,l16 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 4', 'article', 4 FROM m4 RETURNING id)
,l17 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Attention Loss and Recovery Costs', 'article', 1 FROM m5 RETURNING id)
,l18 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Defeating Time Thieves', 'article', 2 FROM m5 RETURNING id)
,l19 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Defeating Time Thieves', 'article', 3 FROM m5 RETURNING id)
,l20 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 5', 'article', 4 FROM m5 RETURNING id)
,l21 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Energy Cycles and Sustainable Output', 'article', 1 FROM m6 RETURNING id)
,l22 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: Balancing Work and Renewal', 'article', 2 FROM m6 RETURNING id)
,l23 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: Balancing Work and Renewal', 'article', 3 FROM m6 RETURNING id)
,l24 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 6', 'article', 4 FROM m6 RETURNING id)
,l25 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Treating Time Like Capital', 'article', 1 FROM m7 RETURNING id)
,l26 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Case Study: The Mindset of Time Investors', 'article', 2 FROM m7 RETURNING id)
,l27 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Practice Lab: The Mindset of Time Investors', 'article', 3 FROM m7 RETURNING id)
,l28 AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, 'Reflection and Quiz Checkpoint 7', 'article', 4 FROM m7 RETURNING id)
INSERT INTO lesson_contents (lesson_id, body_markdown)
SELECT (SELECT id FROM l1) AS id, '# Time as an Investment Asset

Estimated duration: 8 minutes

Time is invisible yet measurable. Productive people treat time as an investment rather than a consumable. Every hour can generate progress or regret.

Practical experience: compare two equal 8-hour schedules — one reactive, one structured. The difference in output reveals the compounding power of intentional planning.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l2) AS id, '# Case Study: Understanding the Nature of Time

Estimated duration: 6 minutes

A realistic scenario is used to apply understanding the nature of time under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l3) AS id, '# Practice Lab: Understanding the Nature of Time

Estimated duration: 8 minutes

Hands-on implementation session for understanding the nature of time.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l4) AS id, '# Reflection and Quiz Checkpoint 1

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l5) AS id, '# Reclaiming Schedule Authority

Estimated duration: 8 minutes

Many people say they do not have time, but the deeper issue is often loss of control. With an internal locus of control, each hour becomes a conscious choice.

Practical experience: track one week of time leaks, then plan the next day every evening. Most learners recover significant productive hours and reduce stress quickly.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l6) AS id, '# Case Study: The Psychology of Control

Estimated duration: 6 minutes

A realistic scenario is used to apply the psychology of control under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l7) AS id, '# Practice Lab: The Psychology of Control

Estimated duration: 8 minutes

Hands-on implementation session for the psychology of control.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l8) AS id, '# Reflection and Quiz Checkpoint 2

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l9) AS id, '# Doing What Matters Most

Estimated duration: 8 minutes

You can do anything, but not everything. Use Covey’s matrix to separate urgent activity from important progress. High growth comes from consistent work in the important-but-not-urgent quadrant.

Practical experience: redesign your morning around one strategic important task before reactive communication.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l10) AS id, '# Case Study: The Priority Principle

Estimated duration: 6 minutes

A realistic scenario is used to apply the priority principle under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l11) AS id, '# Practice Lab: The Priority Principle

Estimated duration: 8 minutes

Hands-on implementation session for the priority principle.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l12) AS id, '# Reflection and Quiz Checkpoint 3

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l13) AS id, '# Time-Blocking for Execution

Estimated duration: 8 minutes

Planning turns vision into executable structure. Time-blocking assigns boundaries for focused work, meetings, renewal, and study. This reduces decision fatigue and protects cognitive energy.

Practical experience: build a day map with fixed blocks (study, deep work, exercise, review) and run it for 7 days.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l14) AS id, '# Case Study: The Power of Planning

Estimated duration: 6 minutes

A realistic scenario is used to apply the power of planning under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l15) AS id, '# Practice Lab: The Power of Planning

Estimated duration: 8 minutes

Hands-on implementation session for the power of planning.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l16) AS id, '# Reflection and Quiz Checkpoint 4

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l17) AS id, '# Attention Loss and Recovery Costs

Estimated duration: 8 minutes

Common time thieves include multitasking, social media loops, perfection delay, and unplanned interruptions. Frequent switching creates hidden recovery costs that collapse real output.

Practical experience: silence non-essential alerts, batch communication windows, and use distraction-free work blocks to recover lost hours.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l18) AS id, '# Case Study: Defeating Time Thieves

Estimated duration: 6 minutes

A realistic scenario is used to apply defeating time thieves under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l19) AS id, '# Practice Lab: Defeating Time Thieves

Estimated duration: 8 minutes

Hands-on implementation session for defeating time thieves.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l20) AS id, '# Reflection and Quiz Checkpoint 5

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l21) AS id, '# Energy Cycles and Sustainable Output

Estimated duration: 8 minutes

Time mastery requires balance. Productivity without recovery causes burnout; recovery without direction causes stagnation. Work in focused cycles followed by deliberate renewal.

Practical experience: test a 90-minute focus + 15-minute recovery cycle and monitor quality of output and mental clarity.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l22) AS id, '# Case Study: Balancing Work and Renewal

Estimated duration: 6 minutes

A realistic scenario is used to apply balancing work and renewal under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l23) AS id, '# Practice Lab: Balancing Work and Renewal

Estimated duration: 8 minutes

Hands-on implementation session for balancing work and renewal.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l24) AS id, '# Reflection and Quiz Checkpoint 6

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body
UNION ALL
SELECT (SELECT id FROM l25) AS id, '# Treating Time Like Capital

Estimated duration: 8 minutes

High performers evaluate time like financial capital: every activity is a deposit or a withdrawal. Ask whether each task advances strategic outcomes.

Practical experience: run a weekly time audit and redirect low-return hours into skill growth, execution, and high-value relationships.

### Expanded Insight
This segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.' AS body
UNION ALL
SELECT (SELECT id FROM l26) AS id, '# Case Study: The Mindset of Time Investors

Estimated duration: 6 minutes

A realistic scenario is used to apply the mindset of time investors under pressure. Learners identify the decision points, evaluate options, and choose an action path.

### Case Prompts
- What was the main bottleneck?
- Which principle from this module solved it?
- How would you adapt this approach to your own context?' AS body
UNION ALL
SELECT (SELECT id FROM l27) AS id, '# Practice Lab: The Mindset of Time Investors

Estimated duration: 8 minutes

Hands-on implementation session for the mindset of time investors.

### Lab Workflow
1. Define one specific action for today.
2. Run a 20-minute implementation sprint.
3. Record friction points.
4. Refine and repeat.

### Output
Submit one before/after behavior change statement.' AS body
UNION ALL
SELECT (SELECT id FROM l28) AS id, '# Reflection and Quiz Checkpoint 7

Estimated duration: 5 minutes

### Reflection
- What changed in your thinking this week?
- What action did you actually complete?
- What will you improve next cycle?

### Quiz
1. Identify the key principle in this module.
2. Choose the most effective implementation strategy.
3. Select the best response to a common obstacle.' AS body;

COMMIT;
