// Create an admin user for testing

import { pool } from './src/config/postgres.js';
import bcrypt from 'bcrypt';

async function createAdminUser() {
  try {
    console.log('👤 CREATING ADMIN USER...');
    
    // Check if admin user already exists
    const existingUser = await pool.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      ['admin@vialifecoach.org']
    );
    
    if (existingUser.rows.length > 0) {
      console.log('✅ Admin user already exists:', existingUser.rows[0]);
      
      // Update to admin role if not already
      if (existingUser.rows[0].role !== 'admin') {
        await pool.query(
          'UPDATE users SET role = $1, verified = $2 WHERE email = $3',
          ['admin', true, 'admin@vialifecoach.org']
        );
        console.log('✅ Updated existing user to admin role');
      }
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const { rows } = await pool.query(
        `INSERT INTO users (email, password_hash, name, role, verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id, email, name, role, verified`,
        [
          'admin@vialifecoach.org',
          hashedPassword,
          'ViaLifeCoach Admin',
          'admin',
          true
        ]
      );
      
      console.log('✅ Admin user created:', rows[0]);
    }
    
    // Verify the admin user was created
    const { rows: adminUsers } = await pool.query(
      'SELECT id, email, name, role, verified FROM users WHERE role = $1',
      ['admin']
    );
    
    console.log('\n📊 All admin users:');
    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}.`, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified
      });
    });
    
    console.log('\n🎉 ADMIN USER SETUP COMPLETE!');
    console.log('📧 Email: admin@vialifecoach.org');
    console.log('🔑 Password: admin123');
    console.log('🔑 You can now login and test course publishing!');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('❌ Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

createAdminUser();
