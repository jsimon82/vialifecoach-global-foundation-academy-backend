import { pool } from './src/config/postgres.js';
import bcrypt from 'bcrypt';

(async () => {
  try {
    console.log('Creating test user...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('www234@', 10);
    
    // Insert test user
    const result = await pool.query(`
      INSERT INTO users (name, email, password, role, email_verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO UPDATE SET
        password = $3,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, email, role
    `, [
      'Test User',
      'saghimbare@vialifecoach.org',
      hashedPassword,
      'user',
      true
    ]);
    
    console.log('✅ Test user created/updated:', result.rows[0]);
    
    // Also create a test application for this user
    const applicationData = {
      personalInfo: {
        name: 'Test User',
        email: 'saghimbare@vialifecoach.org',
        phone: '+1234567890',
        age: '25',
        nationality: 'Test Nationality',
        refugeeStatus: 'Test Refugee Status'
      },
      accountCreation: {
        name: 'Test User',
        email: 'saghimbare@vialifecoach.org',
        password: 'www234@'
      },
      educationHistory: {
        institutionName: 'Test University',
        highestEducation: 'Bachelor',
        fieldOfStudy: 'Computer Science',
        graduationYear: '2020',
        gpa: '3.8'
      },
      programSelection: {
        firstChoice: 'Women Refugee Rise Program',
        secondChoice: 'GVB Healing Program'
      },
      personalStatement: {
        motivation: 'I am passionate about helping refugees',
        goals: 'To become a software developer and help my community',
        programFit: 'This program aligns perfectly with my goals'
      }
    };
    
    const appResult = await pool.query(`
      INSERT INTO common_applications (user_id, application_data, created_at, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        application_data = $2,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, user_id
    `, [result.rows[0].id, JSON.stringify(applicationData)]);
    
    console.log('✅ Test application created/updated:', appResult.rows[0]);
    
    await pool.end();
    console.log('🎉 Test user setup complete!');
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  }
})();

