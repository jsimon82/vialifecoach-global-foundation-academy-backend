import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..', 'seeds');

function readJson(p) {
  return JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
}

const first3 = readJson('academy_program_first3_courses.json');
const c4 = readJson('course4_overcoming_procrastination.json');
const c5 = readJson('course5_goal_setting_mastery.json');
const c6 = readJson('course6_power_of_focus.json');
const c7 = readJson('course7_time_management_mastery.json');

const baseCourses = [
  ...first3.courses.slice(0, 3),
  c4,
  c5,
  c6,
  c7,
];

function inferPillar(title, fallback) {
  if (fallback) return fallback;
  if (/confidence|negative thinking|mindset/i.test(title)) return 'Mindset and Personal Mastery';
  if (/procrastination|goal|focus|time/i.test(title)) return 'Productivity and Success Strategies';
  if (/listen|leadership/i.test(title)) return 'Leadership and Influence';
  return 'Resilience, Well-Being, and Social Impact';
}

function expandModule(module, moduleIndex) {
  const lessons = [];
  const baseLessons = module.lessons || [];

  baseLessons.forEach((lesson, idx) => {
    lessons.push({
      title: lesson.title,
      duration_minutes: 8,
      content_markdown:
        `${lesson.content_markdown || ''}\n\n### Expanded Insight\nThis segment deepens the original concept with practical interpretation, common mistakes, and implementation patterns for real-life execution.`,
      lesson_type: 'concept',
    });
  });

  const moduleName = module.title.replace(/^Chapter\s*\d+[:.]?\s*/i, '').replace(/^Module\s*\d+[:.]?\s*/i, '');

  lessons.push({
    title: `Case Study: ${moduleName}`,
    duration_minutes: 6,
    content_markdown:
      `A realistic scenario is used to apply ${moduleName.toLowerCase()} under pressure. Learners identify the decision points, evaluate options, and choose an action path.\n\n### Case Prompts\n- What was the main bottleneck?\n- Which principle from this module solved it?\n- How would you adapt this approach to your own context?`,
    lesson_type: 'case_study',
  });

  lessons.push({
    title: `Practice Lab: ${moduleName}`,
    duration_minutes: 8,
    content_markdown:
      `Hands-on implementation session for ${moduleName.toLowerCase()}.\n\n### Lab Workflow\n1. Define one specific action for today.\n2. Run a 20-minute implementation sprint.\n3. Record friction points.\n4. Refine and repeat.\n\n### Output\nSubmit one before/after behavior change statement.`,
    lesson_type: 'practice',
  });

  lessons.push({
    title: `Reflection and Quiz Checkpoint ${moduleIndex + 1}`,
    duration_minutes: 5,
    content_markdown:
      `### Reflection\n- What changed in your thinking this week?\n- What action did you actually complete?\n- What will you improve next cycle?\n\n### Quiz\n1. Identify the key principle in this module.\n2. Choose the most effective implementation strategy.\n3. Select the best response to a common obstacle.`,
    lesson_type: 'quiz_review',
  });

  return lessons;
}

const expandedCourses = baseCourses.map((course, cIdx) => {
  const modules = (course.modules || []).map((module, mIdx) => ({
    title: module.title,
    lessons: expandModule(module, mIdx),
  }));

  const totalMinutes = modules.reduce(
    (acc, m) => acc + m.lessons.reduce((a, l) => a + (l.duration_minutes || 0), 0),
    0
  );

  return {
    course_code: course.course_code || `L1-C${cIdx + 1}`,
    title: course.title,
    import_title: `${course.course_code || `L1-C${cIdx + 1}`}: ${course.title}`,
    pillar: inferPillar(course.title, course.pillar),
    level: course.level || 'Beginner',
    format: 'Coursera-style Expanded',
    estimated_duration_minutes: Math.min(180, Math.max(130, totalMinutes)),
    estimated_duration_label: '2-3 hours',
    objectives: course.objectives || [],
    introduction: course.introduction || course.overview || '',
    modules,
    key_takeaways: course.key_takeaways || [],
    closing_insight: course.closing_insight || course.final_reflection || '',
  };
});

const outputJson = {
  generated_at: new Date().toISOString(),
  note: 'Expanded 2-3 hour versions for courses 1-7 with concept, case study, practice, and quiz checkpoint lessons.',
  courses: expandedCourses,
};

fs.writeFileSync(
  path.join(root, 'courses_1_7_expanded_2to3h.json'),
  JSON.stringify(outputJson, null, 2),
  'utf8'
);

function esc(v) {
  return String(v ?? '').replace(/'/g, "''");
}

let sql = '';
sql += 'BEGIN;\n\n';
sql += `CREATE TABLE IF NOT EXISTS lesson_contents (\n`;
sql += `  id SERIAL PRIMARY KEY,\n`;
sql += `  lesson_id INTEGER NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,\n`;
sql += `  body_markdown TEXT NOT NULL,\n`;
sql += `  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n`;
sql += `);\n\n`;

const pillars = [...new Set(expandedCourses.map((c) => c.pillar))];
for (const p of pillars) {
  sql += `INSERT INTO categories (name) SELECT '${esc(p)}' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name='${esc(p)}');\n`;
}
sql += '\n';

expandedCourses.forEach((course, ci) => {
  const title = course.import_title;
  sql += `-- Course ${ci + 1}\n`;
  sql += `DELETE FROM courses WHERE title = '${esc(title)}';\n`;
  sql += `WITH cat AS (SELECT id FROM categories WHERE name='${esc(course.pillar)}' LIMIT 1),\n`;
  sql += `new_course AS (\n`;
  sql += `  INSERT INTO courses (title, description, short_description, long_description, category_id, delivery_mode, has_certificate, duration_weeks)\n`;
  sql += `  SELECT '${esc(title)}', '${esc(`Expanded ${course.estimated_duration_label} course`)}', '${esc(course.title)}', '${esc(course.introduction)}', cat.id, 'self-paced', TRUE, 6\n`;
  sql += `  FROM cat RETURNING id\n`;
  sql += `)\n`;

  course.modules.forEach((m, mi) => {
    sql += `,m${mi + 1} AS (INSERT INTO modules (course_id, title, order_index) SELECT id, '${esc(m.title)}', ${mi + 1} FROM new_course RETURNING id)\n`;
  });
  sql += `SELECT 1;\n\n`;

  sql += `WITH c AS (SELECT id FROM courses WHERE title='${esc(title)}' LIMIT 1),\n`;
  course.modules.forEach((m, mi) => {
    sql += `${mi === 0 ? '' : ','}m${mi + 1} AS (SELECT id FROM modules WHERE course_id=(SELECT id FROM c) AND title='${esc(m.title)}' LIMIT 1)\n`;
  });

  let lessonCtes = '';
  let contentRows = [];
  let lessonCounter = 1;
  course.modules.forEach((m, mi) => {
    m.lessons.forEach((l, li) => {
      const cte = `l${lessonCounter}`;
      lessonCtes += `,${cte} AS (INSERT INTO lessons (module_id, title, content_type, order_index) SELECT id, '${esc(l.title)}', 'article', ${li + 1} FROM m${mi + 1} RETURNING id)\n`;
      contentRows.push(`SELECT (SELECT id FROM ${cte}) AS id, '${esc(`# ${l.title}\n\nEstimated duration: ${l.duration_minutes} minutes\n\n${l.content_markdown}`)}' AS body`);
      lessonCounter += 1;
    });
  });

  sql += lessonCtes;
  sql += `INSERT INTO lesson_contents (lesson_id, body_markdown)\n`;
  sql += contentRows.join('\nUNION ALL\n');
  sql += `;\n\n`;
});

sql += 'COMMIT;\n';

fs.writeFileSync(path.join(root, 'courses_1_7_expanded_2to3h.sql'), sql, 'utf8');
console.log('Generated expanded JSON and SQL for courses 1-7');
