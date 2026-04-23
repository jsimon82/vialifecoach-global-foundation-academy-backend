// Create an admin user to fix the admin dashboard issue

import { pool } from './src/config/postgres.js';
import bcrypt from 'bcrypt';

async function createAdminUser() {
  try {
    console.log('🔧 CREATING ADMIN USER...');
    
    const adminEmail = 'admin@vialifecoach.org';
    const adminPassword = 'admin123';
    const adminName = 'ViaLifeCoach Admin';
    
    // Check if admin user already exists
    const existingUser = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('ℹ️ Admin user already exists');
      console.log('📧 Email:', existingUser.rows[0].email);
      console.log('🆔 ID:', existingUser.rows[0].id);
      
      // Update the role to admin if it's not already
      await pool.query(
        'UPDATE users SET role = $1 WHERE email = $2',
        ['admin', adminEmail]
      );
      console.log('✅ Updated role to admin');
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // Create the admin user
      const { rows } = await pool.query(`
        INSERT INTO users (email, password_hash, name, role, email_verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, email, name, role
      `,
        [adminEmail, hashedPassword, adminName, 'admin', true]
      );
      
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email:', rows[0].email);
      console.log('👤 Name:', rows[0].name);
      console.log('🔑 Role:', rows[0].role);
      console.log('🆔 ID:', rows[0].id);
      console.log('🔐 Password:', adminPassword);
    }
    
    console.log('\n🎯 LOGIN CREDENTIALS:');
    console.log('📧 Email:', adminEmail);
    console.log('🔐 Password:', adminPassword);
    console.log('\n✅ You can now log in to the admin dashboard with these credentials!');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('❌ Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

createAdminUser();
