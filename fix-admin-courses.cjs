const fs = require('fs');

// Read the current admin controller
const adminControllerContent = fs.readFileSync('./src/controllers/admin.controller.js', 'utf8');

// Create a new getAllCoursesAdminController function that includes modules and lessons
const newGetAllCoursesAdminController = `// Get all courses (admin view) - WITH MODULES AND LESSONS
export async function getAllCoursesAdminController(req, res) {
  try {
    const { status, level, category_id, instructor_id } = req.query;
    const filters = { status, level, category_id, instructor_id };
    
    // Enhanced query to get courses with modules and lessons
    let query = \`
      SELECT 
        c.id, c.title, c.description, c.price, c.thumbnail_url, c.published,
        COUNT(DISTINCT m.id) as module_count,
        COUNT(DISTINCT l.id) as lesson_count,
        array_agg(DISTINCT m.title) as modules,
        array_agg(DISTINCT l.title) as lessons
      FROM courses c
      LEFT JOIN modules m ON c.id = m.course_id
      LEFT JOIN lessons l ON m.id = l.module_id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
    \`;
    
    const params = [];
    const conditions = [];
    
    if (filters.status) {
      params.push(filters.status);
      conditions.push(\`c.status = $\${params.length}\`);
    }
    if (filters.category_id) {
      params.push(filters.category_id);
      conditions.push(\`c.category_id = $\${params.length}\`);
    }
    if (filters.level) {
      params.push(filters.level);
      conditions.push(\`c.level = $\${params.length}\`);
    }
    if (filters.instructor_id) {
      params.push(filters.instructor_id);
      conditions.push(\`c.instructor_id = $\${params.length}\`);
    }
    
    if (conditions.length > 0) {
      query += \` WHERE \${conditions.join(" AND ")}\`;
    }
    
    query += \` 
      GROUP BY c.id, c.title, c.description, c.price, c.thumbnail_url, c.published, cat.name, u.name
      ORDER BY c.created_at DESC\`;
    
    const { rows } = await pool.query(query, params);
    
    // Format the response
    const courses = rows.map(course => ({
      ...course,
      modules: course.modules || [],
      lessons: course.lessons || []
    }));
    
    res.json({ success: true, data: courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ message: "Server error" });
  }
}`;

// Replace the old function with the new one
const updatedControllerContent = adminControllerContent.replace(
  /export async function getAllCoursesAdminController\(req, res\) \{[\s\S]*?try \{[\s\S]*?const \{ filters \} = req\.query;[\s\S]*?const courses = await CourseModel\.getAllCourses\(filters\);[\s\S]*?res\.json\(\{ success: true, data: courses \}\);[\s\S]*?\} catch \{[\s\S]*?console\.error\("Error fetching courses:", error\);[\s\S]*?res\.status\(500\)\.json\(\{ message: "Server error" \}\);[\s\S]*?\}/g,
  newGetAllCoursesAdminController
);

// Write the updated controller
fs.writeFileSync('./src/controllers/admin.controller.js', updatedControllerContent);

console.log('✅ Admin controller updated to include modules and lessons!');
