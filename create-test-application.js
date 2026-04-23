import { pool } from './src/config/postgres.js';

(async () => {
  try {
    console.log('Creating test application for user saghimbare@vialifecoach.org...');
    
    // Get the user ID first
    const userResult = await pool.query(`
      SELECT id FROM users WHERE email = $1
    `, ['saghimbare@vialifecoach.org']);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log('✅ Found user ID:', userId);
    
    // Check if application already exists
    const existingApp = await pool.query(`
      SELECT id FROM common_applications WHERE user_id = $1
    `, [userId]);
    
    if (existingApp.rows.length > 0) {
      console.log('✅ Application already exists for this user');
      console.log('Application ID:', existingApp.rows[0].id);
    } else {
      // Create test application
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
        RETURNING id, user_id
      `, [userId, JSON.stringify(applicationData)]);
      
      console.log('✅ Test application created:', appResult.rows[0]);
    }
    
    await pool.end();
    console.log('🎉 Test setup complete!');
    console.log('📧 Email: saghimbare@vialifecoach.org');
    console.log('🔑 Password: www234@');
    console.log('👤 Role: user');
    console.log('✅ Ready for testing email functionality!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();

