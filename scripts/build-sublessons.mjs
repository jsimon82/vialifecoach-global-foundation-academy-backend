import { pool } from "../src/config/postgres.js";

const COURSE_ID = 3;

const INTRO_MODULE_TITLE = "Module 0: Introduction";
const INTRO_LESSON_1 = "Lesson 0.1 - Welcome to the Confidence Code";
const INTRO_LESSON_2 = "Lesson 0.2 - What Confidence Really Means";

const SECTION_ORDER = [
  "Lesson Overview",
  "How It Works",
  "Deepening the Idea",
  "Common Obstacles",
  "Real Life Example",
  "Practice Plan",
  "Reflection and Faith",
  "Commitment",
  "Coaching Questions",
  "Weekly Challenge",
  "Common Mistakes and Fixes",
  "Application Prompt",
  "Practice Steps:",
  "Reflection Questions:",
  "Weekly Challenge Checklist:",
  "Common Mistakes:",
  "Scripture Focus",
  "Affirmation"
];

const SUB_TITLES = ["a", "b", "c", "d"];

function splitSections(content) {
  const blocks = String(content || "").split(/\n{2,}/).filter(Boolean);
  const sections = {};
  let current = null;

  for (const block of blocks) {
    const firstLine = block.split("\n")[0].trim();
    const isHeading = SECTION_ORDER.includes(firstLine.replace(/:$/, ""));
    if (isHeading) {
      current = firstLine.replace(/:$/, "");
      sections[current] = [block];
    } else if (current) {
      sections[current].push(block);
    } else {
      sections.misc = sections.misc || [];
      sections.misc.push(block);
    }
  }

  return sections;
}

function buildSubLessons(lessonTitle, content) {
  const sections = splitSections(content);

  const partA = [
    ...(sections["Lesson Overview"] || []),
    ...(sections["How It Works"] || [])
  ];
  const partB = [
    ...(sections["Deepening the Idea"] || []),
    ...(sections["Common Obstacles"] || []),
    ...(sections["Real Life Example"] || [])
  ];
  const partC = [
    ...(sections["Practice Plan"] || []),
    ...(sections["Reflection and Faith"] || []),
    ...(sections["Commitment"] || [])
  ];
  const partD = [
    ...(sections["Coaching Questions"] || []),
    ...(sections["Weekly Challenge"] || []),
    ...(sections["Common Mistakes and Fixes"] || []),
    ...(sections["Application Prompt"] || []),
    ...(sections["Practice Steps"] || []),
    ...(sections["Reflection Questions"] || []),
    ...(sections["Weekly Challenge Checklist"] || []),
    ...(sections["Common Mistakes"] || []),
    ...(sections["Scripture Focus"] || []),
    ...(sections["Affirmation"] || [])
  ];

  const groups = [partA, partB, partC, partD].filter((g) => g.length);
  if (!groups.length) {
    const paragraphs = String(content || "").split(/\n{2,}/).filter(Boolean);
    const size = Math.max(1, Math.ceil(paragraphs.length / 4));
    for (let i = 0; i < 4; i += 1) {
      const chunk = paragraphs.slice(i * size, (i + 1) * size);
      if (chunk.length) groups.push(chunk);
    }
  }

  return groups.map((group, index) => {
    const letter = SUB_TITLES[index] || String.fromCharCode(97 + index);
    const titleBase = lessonTitle.replace(/^Lesson\s+/, "");
    return {
      title: `${index === 0 ? "Foundations" : index === 1 ? "Deepening" : index === 2 ? "Practice" : "Integration"}`,
      body: group.join("\n\n"),
      order_index: index
    };
  });
}

async function main() {
  const introModuleQ = await pool.query(
    "SELECT id FROM modules WHERE course_id = $1 AND title = $2 LIMIT 1",
    [COURSE_ID, INTRO_MODULE_TITLE]
  );
  const introModuleId = introModuleQ.rows[0]?.id;
  if (introModuleId) {
    const introLessonsQ = await pool.query(
      "SELECT id, title FROM lessons WHERE module_id = $1",
      [introModuleId]
    );
    const introLessons = introLessonsQ.rows;
    const hasLesson1 = introLessons.some((l) => l.title === INTRO_LESSON_1);
    const hasLesson2 = introLessons.some((l) => l.title === INTRO_LESSON_2);

    if (!hasLesson1) {
      const insertLesson1 = await pool.query(
        `INSERT INTO lessons (module_id, title, content_type, order_index, duration_minutes, is_free_preview)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [introModuleId, INTRO_LESSON_1, "video", 0, 8, false]
      );
      const lessonId = insertLesson1.rows[0].id;
      await pool.query(
        `INSERT INTO lesson_content (lesson_id, content_type, title, body, order_index)
         VALUES ($1, $2, $3, $4, $5)`,
        [lessonId, "video", "Video", null, 0]
      );
      await pool.query(
        `INSERT INTO lesson_content (lesson_id, content_type, title, body, order_index)
         VALUES ($1, $2, $3, $4, $5)`,
        [lessonId, "text", "Reading", null, 1]
      );
    }

    if (!hasLesson2) {
      const insertLesson2 = await pool.query(
        `INSERT INTO lessons (module_id, title, content_type, order_index, duration_minutes, is_free_preview)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [introModuleId, INTRO_LESSON_2, "video", 1, 8, false]
      );
      const lessonId = insertLesson2.rows[0].id;
      await pool.query(
        `INSERT INTO lesson_content (lesson_id, content_type, title, body, order_index)
         VALUES ($1, $2, $3, $4, $5)`,
        [lessonId, "video", "Video", null, 0]
      );
      await pool.query(
        `INSERT INTO lesson_content (lesson_id, content_type, title, body, order_index)
         VALUES ($1, $2, $3, $4, $5)`,
        [lessonId, "text", "Reading", null, 1]
      );
    }
  }

  const lessonRows = await pool.query(
    `SELECT l.id, l.title, l.content, m.title AS module_title, m.order_index AS module_order
     FROM lessons l
     JOIN modules m ON l.module_id = m.id
     WHERE m.course_id = $1
     ORDER BY m.order_index, l.order_index`,
    [COURSE_ID]
  );

  const lessons = lessonRows.rows;

  // Keep lessons 0.1 and 0.2 as separate pages.

  const lessonIds = lessons.map((l) => l.id);
  if (lessonIds.length) {
    await pool.query(
      "DELETE FROM lesson_content WHERE content_type = 'sub_lesson' AND lesson_id = ANY($1::int[])",
      [lessonIds]
    );
  }

  for (const lesson of lessons) {
    if (lesson.title.startsWith("Lesson 0.")) continue;
    const subLessons = buildSubLessons(lesson.title, lesson.content);
    for (const sub of subLessons) {
      await pool.query(
        `INSERT INTO lesson_content (lesson_id, content_type, title, body, order_index)
         VALUES ($1, $2, $3, $4, $5)`,
        [lesson.id, "sub_lesson", sub.title, sub.body, sub.order_index]
      );
    }
  }

  console.log("Sub-lessons created and intro consolidated.");
}

main()
  .catch((err) => {
    console.error("Sub-lesson build failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
