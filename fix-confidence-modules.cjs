const { pool } = require('./src/config/postgres.js');

(async () => {
  try {
    // Reorder modules for 2-column layout with Module 1 & 7 on left column
    // Row 1: Module 1 (top left) + Module 7 (below) | Module 2 (right)
    // Row 2: Module 3 (left) + Module 4 (right)
    // Row 3: Module 5 (left) + Module 6 (right)
    const updates = [
      { id: 13, title: "Module 1: Introduction", order_index: 1 },        // Row 1, top left
      { id: 6, title: "Module 7: Your Confidence Blueprint", order_index: 2 }, // Row 1, bottom left (below module 1)
      { id: 1, title: "Module 2: The Psychology of Confidence", order_index: 3 }, // Row 1, right
      { id: 2, title: "Module 3: Breaking the Cycle of Self-Doubt", order_index: 4 }, // Row 2, left
      { id: 3, title: "Module 4: The Habit of Bold Action", order_index: 5 }, // Row 2, right
      { id: 4, title: "Module 5: Building Inner Strength", order_index: 6 }, // Row 3, left
      { id: 5, title: "Module 6: The Confidence Code in Action", order_index: 7 }  // Row 3, right
    ];

    for (const mod of updates) {
      await pool.query(
        'UPDATE modules SET title = $1, order_index = $2 WHERE id = $3',
        [mod.title, mod.order_index, mod.id]
      );
      console.log(`Updated module ${mod.id}: ${mod.title} (order: ${mod.order_index})`);
    }

    // Verify the changes
    const result = await pool.query(
      'SELECT id, title, order_index FROM modules WHERE course_id = 3 ORDER BY order_index'
    );
    console.log('\n=== Updated Modules for Course 3 ===');
    console.log(JSON.stringify(result.rows, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
