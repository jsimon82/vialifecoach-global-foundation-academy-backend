import { pool } from './src/config/postgres.js';

(async () => {
  try {
    // Test the status update directly
    const updateQuery = `
      UPDATE common_applications 
      SET application_data = application_data || $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, application_data, created_at, updated_at
    `;
    
    const updateData = {
      status: 'under_review',
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'Admin User'
    };
    
    console.log('Testing status update with data:', updateData);
    
    const result = await pool.query(updateQuery, [JSON.stringify(updateData), 2]);
    console.log('Update result:', result.rows.length, 'rows affected');
    
    if (result.rows.length > 0) {
      console.log('Updated application data:', JSON.stringify(result.rows[0].application_data, null, 2));
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
