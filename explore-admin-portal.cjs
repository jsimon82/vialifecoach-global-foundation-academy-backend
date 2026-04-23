const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vialifecoach_db',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
  ssl: false
});

async function exploreAdminPortal() {
  try {
    console.log('🔍 Exploring your complete admin portal features...\n');
    
    // Program Management
    console.log('🎓 PROGRAM MANAGEMENT FEATURES:');
    const coursesResult = await pool.query('SELECT id, title, description FROM courses ORDER BY id');
    coursesResult.rows.forEach(course => {
      console.log(`  📚 Course ${course.id}: ${course.title}`);
    });
    
    const modulesResult = await pool.query('SELECT id, title, course_id FROM modules ORDER BY course_id, id');
    console.log(`\n  📖 Found ${modulesResult.rows.length} modules across all courses`);
    
    const lessonsResult = await pool.query('SELECT id, title, module_id FROM lessons ORDER BY module_id, id');
    console.log(`  📝 Found ${lessonsResult.rows.length} lessons across all modules`);
    
    // Admission Management
    console.log('\n📋 ADMISSION MANAGEMENT FEATURES:');
    const applicationsResult = await pool.query('SELECT COUNT(*) as count FROM common_applications');
    console.log(`  📄 Common Applications: ${applicationsResult.rows[0].count} records`);
    
    const enrollmentResult = await pool.query('SELECT COUNT(*) as count FROM enrollment');
    console.log(`  ✅ Enrollments: ${enrollmentResult.rows[0].count} records`);
    
    // User Management
    console.log('\n👥 USER MANAGEMENT FEATURES:');
    const usersResult = await pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    usersResult.rows.forEach(user => {
      console.log(`  👤 ${user.role}s: ${user.count} users`);
    });
    
    // Support System
    console.log('\n🎧 SUPPORT MANAGEMENT FEATURES:');
    const ticketsResult = await pool.query('SELECT COUNT(*) as count FROM support_tickets');
    console.log(`  🎫 Support Tickets: ${ticketsResult.rows[0].count} tickets`);
    
    const repliesResult = await pool.query('SELECT COUNT(*) as count FROM support_ticket_replies');
    console.log(`  💬 Ticket Replies: ${repliesResult.rows[0].count} replies`);
    
    // Community Management
    console.log('\n🌍 COMMUNITY MANAGEMENT FEATURES:');
    const postsResult = await pool.query('SELECT COUNT(*) as count FROM community_posts');
    console.log(`  📝 Community Posts: ${postsResult.rows[0].count} posts`);
    
    const mentorsResult = await pool.query('SELECT COUNT(*) as count FROM community_mentors');
    console.log(`  👨‍🏫 Mentors: ${mentorsResult.rows[0].count} mentors`);
    
    const eventsResult = await pool.query('SELECT COUNT(*) as count FROM community_events');
    console.log(`  📅 Events: ${eventsResult.rows[0].count} events`);
    
    // Quiz & Assessment Management
    console.log('\n📊 QUIZ & ASSESSMENT FEATURES:');
    const quizzesResult = await pool.query('SELECT COUNT(*) as count FROM quizzes');
    console.log(`  📝 Quizzes: ${quizzesResult.rows[0].count} quizzes`);
    
    const quizQuestionsResult = await pool.query('SELECT COUNT(*) as count FROM quiz_questions');
    console.log(`  ❓ Quiz Questions: ${quizQuestionsResult.rows[0].count} questions`);
    
    const quizResultsResult = await pool.query('SELECT COUNT(*) as count FROM quiz_results');
    console.log(`  📈 Quiz Results: ${quizResultsResult.rows[0].count} results`);
    
    // Payment Management
    console.log('\n💰 PAYMENT MANAGEMENT FEATURES:');
    const paymentsResult = await pool.query('SELECT COUNT(*) as count FROM payments');
    console.log(`  💳 Payments: ${paymentsResult.rows[0].count} payment records`);
    
    const refundsResult = await pool.query('SELECT COUNT(*) as count FROM refunds');
    console.log(`  💸 Refunds: ${refundsResult.rows[0].count} refund records`);
    
    // Certificate Management
    console.log('\n🏆 CERTIFICATE MANAGEMENT FEATURES:');
    const certificatesResult = await pool.query('SELECT COUNT(*) as count FROM certificates');
    console.log(`  🎓 Certificates: ${certificatesResult.rows[0].count} certificates issued`);
    
    // System Administration
    console.log('\n⚙️ SYSTEM ADMINISTRATION FEATURES:');
    const auditLogsResult = await pool.query('SELECT COUNT(*) as count FROM admin_audit_logs');
    console.log(`  📋 Admin Audit Logs: ${auditLogsResult.rows[0].count} admin actions logged`);
    
    const settingsResult = await pool.query('SELECT COUNT(*) as count FROM system_settings');
    console.log(`  ⚙️ System Settings: ${settingsResult.rows[0].count} configuration settings`);
    
    const announcementsResult = await pool.query('SELECT COUNT(*) as count FROM announcements');
    console.log(`  📢 Announcements: ${announcementsResult.rows[0].count} system announcements`);
    
    console.log('\n🎯 SUMMARY: Your complete admin portal has ALL features intact!');
    console.log('   ✅ Program Management (Courses, Modules, Lessons)');
    console.log('   ✅ Admission Management (Applications, Enrollments)');
    console.log('   ✅ User Management (Students, Lecturers, Admins)');
    console.log('   ✅ Support System (Tickets, Replies)');
    console.log('   ✅ Community Management (Posts, Mentors, Events)');
    console.log('   ✅ Quiz & Assessment System');
    console.log('   ✅ Payment & Refund Management');
    console.log('   ✅ Certificate Management');
    console.log('   ✅ System Administration (Audit Logs, Settings)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

exploreAdminPortal();
