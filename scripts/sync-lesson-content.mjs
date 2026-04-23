import { pool } from "../src/config/postgres.js";

async function main() {
  const q = `
    SELECT l.id, lc.body
    FROM lessons l
    JOIN modules m ON l.module_id = m.id
    LEFT JOIN lesson_content lc
      ON lc.lesson_id = l.id AND lc.content_type = 'text'
    WHERE m.course_id = 3
    ORDER BY m.order_index, l.order_index
  `;

  const { rows } = await pool.query(q);
  for (const row of rows) {
    const body = row.body || "";
    const description = body.slice(0, 220);
    await pool.query(
      "UPDATE lessons SET content = $1, description = $2, lesson_type = $3 WHERE id = $4",
      [body, description, "video", row.id]
    );
  }

  console.log(`Updated ${rows.length} lessons.`);
}

main()
  .catch((err) => {
    console.error("Sync failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
