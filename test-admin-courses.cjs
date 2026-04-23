const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vialifecoach_db',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
  ssl: false
});

async function testAdminCourses() {
  try {
    console.log('🔍 Testing admin courses endpoint...\n');
    
    // 1. Test what admin courses endpoint returns
    console.log('📡 Testing /api/v1/admin/courses...');
    const adminCoursesResult = await pool.query(`
      SELECT c.id, c.title, c.description, c.price, c.thumbnail_url, c.published,
             COUNT(m.id) as module_count,
             COUNT(l.id) as lesson_count
      FROM courses c
      LEFT JOIN modules m ON c.id = m.course_id
      LEFT JOIN lessons l ON m.id = l.module_id
      GROUP BY c.id, c.title, c.description, c.price, c.thumbnail_url, c.published
      ORDER BY c.id
    `);
    
    console.log('📚 Admin Courses Data:');
    adminCoursesResult.rows.forEach(course => {
      console.log(`  📚 Course ${course.id}: ${course.title}`);
      console.log(`     📖 Modules: ${course.module_count}`);
      console.log(`     📄 Lessons: ${course.lesson_count}`);
      console.log(`     📄 Published: ${course.published}`);
    });
    
    // 2. Test what regular courses endpoint returns
    console.log('\n📡 Testing /api/v1/courses...');
    const regularCoursesResult = await pool.query(`
      SELECT c.id, c.title, c.description, c.price, c.thumbnail_url,
             COUNT(m.id) as module_count,
             COUNT(l.id) as lesson_count
      FROM courses c
      LEFT JOIN modules m ON c.id = m.course_id
      LEFT JOIN lessons l ON m.id = l.module_id
      GROUP BY c.id, c.title, c.description, c.price, c.thumbnail_url
      ORDER BY c.id
    `);
    
    console.log('📚 Regular Courses Data:');
    regularCoursesResult.rows.forEach(course => {
      console.log(`  📚 Course ${course.id}: ${course.title}`);
      console.log(`     📖 Modules: ${course.module_count}`);
      console.log(`     📄 Lessons: ${course.lesson_count}`);
    });
    
    // 3. Check if admin courses controller exists
    console.log('\n🔍 Checking admin courses controller...');
    const fs = require('fs');
    try {
      const controllerContent = fs.readFileSync('./src/controllers/admin.controller.js', 'utf8');
      console.log('✅ Admin controller file exists');
      
      // Check if getAllCoursesAdminController function exists
      if (controllerContent.includes('getAllCoursesAdminController')) {
        console.log('✅ getAllCoursesAdminController function found');
      } else {
        console.log('❌ getAllCoursesAdminController function NOT found');
      }
      
      // Check for course management functions
      const courseFunctions = [
        'getAllCoursesAdminController',
        'getCourseAdminController', 
        'createCourseController',
        'updateCourseController',
        'deleteCourseController'
      ];
      
      courseFunctions.forEach(func => {
        if (controllerContent.includes(func)) {
          console.log(`✅ ${func} function found`);
        } else {
          console.log(`❌ ${func} function NOT found`);
        }
      });
      
    } catch (error) {
      console.log('❌ Admin controller file not found:', error.message);
    }
    
    // 4. Check admin routes
    console.log('\n🔍 Checking admin routes...');
    try {
      const routesContent = fs.readFileSync('./src/routes/admin.routes.js', 'utf8');
      console.log('✅ Admin routes file exists');
      
      if (routesContent.includes('/courses')) {
        console.log('✅ /courses route found in admin routes');
      } else {
        console.log('❌ /courses route NOT found in admin routes');
      }
      
      if (routesContent.includes('getAllCoursesAdminController')) {
        console.log('✅ getAllCoursesAdminController route found');
      } else {
        console.log('❌ getAllCoursesAdminController route NOT found');
      }
      
    } catch (error) {
      console.log('❌ Admin routes file not found:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testAdminCourses();
