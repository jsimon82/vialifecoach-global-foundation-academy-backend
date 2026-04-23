import { pool } from './src/config/postgres.js';

(async () => {
  try {
    console.log('Updating test user email...');
    
    // Update the user email
    const result = await pool.query(`
      UPDATE users 
      SET email = $1, updated_at = CURRENT_TIMESTAMP
      WHERE email = $2
      RETURNING id, email, role
    `, [
      'sgahimbare@vialifecoach.org',
      'saghimbare@vialifecoach.org'
    ]);
    
    if (result.rows.length > 0) {
      console.log('✅ User email updated:', result.rows[0]);
      
      // Also update the application data
      const appResult = await pool.query(`
        UPDATE common_applications 
        SET application_data = application_data || $2, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING id, user_id
      `, [result.rows[0].id, JSON.stringify({
        personalInfo: {
          email: 'sgahimbare@vialifecoach.org'
        },
        accountCreation: {
          email: 'sgahimbare@vialifecoach.org'
        }
      })]);
      
      if (appResult.rows.length > 0) {
        console.log('✅ Application email updated:', appResult.rows[0]);
      }
      
      console.log('🎉 Email update complete!');
      console.log('📧 New Email: sgahimbare@vialifecoach.org');
      console.log('🔑 Password: www234@');
      console.log('👤 Role: user');
    } else {
      console.log('❌ User not found with old email');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error updating email:', error.message);
  }
})();
