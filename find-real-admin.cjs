const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vialifecoach_db',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
  ssl: false
});

async function findRealAdmin() {
  try {
    console.log('🔍 Searching for your real admin portal data...');
    
    // Check all tables
    const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 All database tables:');
    tablesResult.rows.forEach(row => console.log(`- ${row.table_name}`));
    
    // Check for users table
    const usersCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    if (usersCheck.rows[0].exists) {
      const usersResult = await pool.query('SELECT id, name, email, role FROM users ORDER BY id');
      console.log(`\n👥 Found ${usersResult.rows.length} users in database:`);
      
      usersResult.rows.forEach(user => {
        console.log(`- User ${user.id}: ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }
    
    // Check for admin users specifically
    if (usersCheck.rows[0].exists) {
      const adminResult = await pool.query('SELECT * FROM users WHERE role LIKE \'%admin%\' OR role = \'owner\' OR role = \'manager\'');
      console.log(`\n🔐 Admin users found: ${adminResult.rows.length}`);
      
      adminResult.rows.forEach(admin => {
        console.log(`- ${admin.name}: ${admin.email} (${admin.role})`);
      });
    }
    
    // Check for courses table
    const coursesCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'courses'
      )
    `);
    
    if (coursesCheck.rows[0].exists) {
      const coursesResult = await pool.query('SELECT id, title FROM courses ORDER BY id');
      console.log(`\n📚 Found ${coursesResult.rows.length} courses in database:`);
      
      coursesResult.rows.forEach(course => {
        console.log(`- Course ${course.id}: ${course.title}`);
      });
    }
    
    // Check for applications or other admin data
    const adminTables = ['applications', 'enrollments', 'support_tickets', 'reports'];
    for (const tableName of adminTables) {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        )
      `);
      
      if (tableCheck.rows[0].exists) {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`\n📊 ${tableName}: ${countResult.rows[0].count} records`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

findRealAdmin();
