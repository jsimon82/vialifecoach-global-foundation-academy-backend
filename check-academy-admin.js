// Check if the academy admin user exists and create it if needed

import { pool } from './src/config/postgres.js';
import bcrypt from 'bcrypt';

async function checkAcademyAdmin() {
  try {
    console.log('🔍 CHECKING ACADEMY ADMIN USER...');
    
    const adminEmail = 'academy@vialifecoach.org';
    const adminPassword = 'Academy@';
    const adminName = 'ViaLifeCoach Academy Admin';
    
    // Check if academy admin user exists
    const existingUser = await pool.query(
      'SELECT id, email, name, role FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('✅ Academy admin user exists:');
      console.log('📧 Email:', existingUser.rows[0].email);
      console.log('👤 Name:', existingUser.rows[0].name);
      console.log('🔑 Role:', existingUser.rows[0].role);
      console.log('🆔 ID:', existingUser.rows[0].id);
      
      // If role is not admin, update it
      if (existingUser.rows[0].role !== 'admin') {
        await pool.query(
          'UPDATE users SET role = $1 WHERE email = $2',
          ['admin', adminEmail]
        );
        console.log('✅ Updated role to admin');
      }
    } else {
      console.log('❌ Academy admin user does not exist. Creating it...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // Create the academy admin user
      const { rows } = await pool.query(`
        INSERT INTO users (email, password_hash, name, role, email_verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, email, name, role
      `,
        [adminEmail, hashedPassword, adminName, 'admin', true]
      );
      
      console.log('✅ Academy admin user created successfully!');
      console.log('📧 Email:', rows[0].email);
      console.log('👤 Name:', rows[0].name);
      console.log('🔑 Role:', rows[0].role);
      console.log('🆔 ID:', rows[0].id);
    }
    
    console.log('\n🎯 LOGIN CREDENTIALS:');
    console.log('📧 Email:', adminEmail);
    console.log('🔐 Password:', adminPassword);
    console.log('\n✅ You can now log in to the admin dashboard!');
    
    // Test the login
    console.log('\n🧪 TESTING LOGIN...');
    try {
      const loginResponse = await fetch('http://localhost:5500/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✅ Login successful!');
        console.log('📊 Login response keys:', Object.keys(loginData).join(', '));
        
        const accessToken = loginData.accessToken || loginData.token;
        if (accessToken) {
          console.log('✅ Access token obtained');
          
          // Test admin course endpoint
          console.log('\n📡 Testing admin course endpoint...');
          const courseResponse = await fetch('http://localhost:5500/api/v1/admin/courses', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }
          });
          
          console.log('📡 Admin courses status:', courseResponse.status);
          if (courseResponse.ok) {
            console.log('✅ Admin course endpoint working!');
            const courseData = await courseResponse.json();
            console.log('📊 Course data type:', typeof courseData);
            console.log('📊 Course data keys:', Object.keys(courseData || {}).join(', '));
          } else {
            const errorText = await courseResponse.text();
            console.log('❌ Admin course endpoint failed:', errorText);
          }
        }
      } else {
        const errorText = await loginResponse.text();
        console.log('❌ Login failed:', errorText);
      }
    } catch (error) {
      console.log('❌ Login test error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('❌ Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

checkAcademyAdmin();
