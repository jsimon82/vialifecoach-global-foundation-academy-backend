const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vialifecoach_db',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
  ssl: false
});

async function createTestApplications() {
  try {
    console.log('🔧 Creating test applications for AI review...\n');
    
    // Test Application 1: Strong candidate
    await pool.query(`
      INSERT INTO common_applications (
        full_name, email, phone, education_level, work_experience, 
        skills, motivation, availability, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      'John Smith', 'john.smith@email.com', '+1234567890',
      'master', '5', 'advanced', 
      'I am passionate about learning and dedicated to excellence. I have strong skills in web development and I am eager to grow professionally.',
      'full-time'
    ]);
    
    // Test Application 2: Average candidate
    await pool.query(`
      INSERT INTO common_applications (
        full_name, email, phone, education_level, work_experience, 
        skills, motivation, availability, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      'Jane Doe', 'jane.doe@email.com', '+1234567891',
      'bachelor', '2', 'intermediate', 
      'I am interested in learning new skills.',
      'part-time'
    ]);
    
    // Test Application 3: Weak candidate
    await pool.query(`
      INSERT INTO common_applications (
        full_name, email, phone, education_level, work_experience, 
        skills, motivation, availability, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      'Bob Johnson', 'bob.johnson@email.com', '+1234567892',
      'high_school', '0', 'basic', 
      'Hi',
      'limited'
    ]);
    
    console.log('✅ Created 3 test applications');
    
    // Verify applications
    const { rows } = await pool.query(`
      SELECT id, full_name, email, education_level, work_experience, skills, motivation, availability
      FROM common_applications 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log('\n📋 Test Applications Created:');
    rows.forEach(app => {
      console.log(`  📝 ${app.full_name} (${app.email})`);
      console.log(`     🎓 Education: ${app.education_level}`);
      console.log(`     💼 Experience: ${app.work_experience} years`);
      console.log(`     🔧 Skills: ${app.skills}`);
      console.log(`     💭 Motivation: ${app.motivation.substring(0, 50)}...`);
      console.log(`     ⏰ Availability: ${app.availability}`);
    });
    
    console.log('\n🤖 Ready for AI Review!');
    console.log('   POST /api/v1/admin/applications/review-all');
    console.log('   POST /api/v1/admin/applications/{id}/review');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createTestApplications();
