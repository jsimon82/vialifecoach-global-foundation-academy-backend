const pool = require('./src/config/postgres.js').pool;

async function updateCourseDescriptions() {
  try {
    // Update Course 1: Overcoming Negative Thinking
    const course1 = await pool.query(
      'UPDATE courses SET description = $1 WHERE id = $2 RETURNING *',
      [
        `This course explores how negative thought patterns develop and how they influence emotions, behavior, and decision-making. Drawing on principles from cognitive psychology and behavioral science, it provides practical strategies for identifying automatic negative thoughts and replacing them with more balanced and constructive interpretations. Through structured reflection, real-life examples, and practical exercises, the course helps build emotional resilience, strengthen self-awareness, and improve mental clarity. By understanding how the brain forms habitual thinking patterns, participants gain the tools needed to interrupt negative cycles and cultivate a healthier, more resilient mindset that supports personal growth, confidence, and psychological wellbeing.`,
        1
      ]
    );

    // Update Course 2: How to Master Time Management
    const course2 = await pool.query(
      'UPDATE courses SET description = $1 WHERE id = $2 RETURNING *',
      [
        `This course provides a structured approach to managing time as a strategic resource. It examines how planning, prioritization, and focus influence productivity and long-term success. Participants learn how to identify high-impact activities, reduce distractions, and organize their schedules using practical tools such as time-blocking and priority frameworks. The course also addresses common barriers to productivity, including procrastination and reactive work habits. By developing disciplined time management practices and a mindset that treats time as a valuable asset, individuals gain greater control over their daily activities and improve their ability to achieve meaningful goals in both professional and personal life.`,
        2
      ]
    );

    console.log('Course 1 updated:', course1.rows[0].title);
    console.log('Course 2 updated:', course2.rows[0].title);
    console.log('Course descriptions successfully updated!');
    pool.end();
  } catch (error) {
    console.error('Error updating course descriptions:', error);
    pool.end();
  }
}

updateCourseDescriptions();
