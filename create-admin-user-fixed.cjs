const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vialifecoach_db',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
  ssl: false
});

async function createAdminUser() {
  try {
    console.log('🔐 Creating your admin user...');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'academy@vialifecoach.org';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Academy@';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Check if admin user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    
    if (existingUser.rows.length > 0) {
      console.log('📧 Admin user already exists, updating password...');
      await pool.query(
        `UPDATE users SET 
         password_hash = $1, 
         role = $2, 
         verified = $3, 
         status = $4,
         updated_at = NOW() 
         WHERE email = $5`,
        [hashedPassword, 'admin', true, 'active', adminEmail]
      );
    } else {
      console.log('👤 Creating new admin user...');
      await pool.query(
        `INSERT INTO users (
         name, email, password_hash, role, verified, status, 
         created_at, updated_at, force_password_reset
         ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7)`,
        ['Admin User', adminEmail, hashedPassword, 'admin', true, 'active', false]
      );
    }
    
    // Verify the admin user was created
    const adminUser = await pool.query('SELECT id, name, email, role, verified, status FROM users WHERE email = $1', [adminEmail]);
    
    if (adminUser.rows.length > 0) {
      console.log('✅ Admin user created successfully!');
      console.log('📋 Admin Details:');
      console.log(`   ID: ${adminUser.rows[0].id}`);
      console.log(`   Name: ${adminUser.rows[0].name}`);
      console.log(`   Email: ${adminUser.rows[0].email}`);
      console.log(`   Role: ${adminUser.rows[0].role}`);
      console.log(`   Verified: ${adminUser.rows[0].verified ? 'Yes' : 'No'}`);
      console.log(`   Status: ${adminUser.rows[0].status}`);
      console.log('');
      console.log('🔐 Login Credentials:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log('');
      console.log('🎯 Your admin portal is now ready!');
      console.log('🚀 You can now login to your complete admin dashboard!');
      console.log('🌐 URL: http://localhost:5000 (your frontend admin login)');
    } else {
      console.log('❌ Failed to create admin user');
    }
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await pool.end();
  }
}

createAdminUser();
