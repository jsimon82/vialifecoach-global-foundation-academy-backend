import { pool } from "../config/postgres.js";

export async function createScriptGenerationJob(payload) {
  const {
    course_id = null,
    lesson_id = null,
    script_text,
    status = "queued",
    provider = "local-storyboard",
    output_video_url = null,
    output_ppt_url = null,
    output_slides = [],
    error_message = null,
  } = payload;

  const { rows } = await pool.query(
    `INSERT INTO script_generation_jobs (
      course_id, lesson_id, script_text, status, provider, output_video_url, output_ppt_url, output_slides, error_message
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9
    )
    RETURNING *`,
    [
      course_id,
      lesson_id,
      script_text,
      status,
      provider,
      output_video_url,
      output_ppt_url,
      JSON.stringify(output_slides || []),
      error_message,
    ]
  );

  return rows[0];
}

export async function getScriptGenerationJobById(id) {
  const { rows } = await pool.query(
    "SELECT * FROM script_generation_jobs WHERE id = $1",
    [id]
  );
  return rows[0];
}

export async function listScriptGenerationJobs({ course_id, lesson_id, limit = 50 } = {}) {
  const conditions = [];
  const params = [];

  if (course_id) {
    params.push(course_id);
    conditions.push(`course_id = $${params.length}`);
  }
  if (lesson_id) {
    params.push(lesson_id);
    conditions.push(`lesson_id = $${params.length}`);
  }

  params.push(Math.min(Number(limit) || 50, 200));

  let query = "SELECT * FROM script_generation_jobs";
  if (conditions.length) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }
  query += ` ORDER BY created_at DESC LIMIT $${params.length}`;

  const { rows } = await pool.query(query, params);
  return rows;
}

export async function updateScriptGenerationJob(id, updates) {
  const allowed = [
    "status",
    "provider",
    "output_video_url",
    "output_ppt_url",
    "output_slides",
    "error_message",
    "updated_at",
  ];
  const keys = Object.keys(updates).filter((k) => allowed.includes(k));
  if (!keys.length) return null;

  const fields = keys.map((k, i) => {
    if (k === "output_slides") return `${k} = $${i + 1}::jsonb`;
    return `${k} = $${i + 1}`;
  }).join(", ");

  const values = keys.map((k) => k === "output_slides" ? JSON.stringify(updates[k] || []) : updates[k]);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE script_generation_jobs
     SET ${fields}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING *`,
    values
  );
  return rows[0];
}
