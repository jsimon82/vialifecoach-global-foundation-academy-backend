import jwt from 'jsonwebtoken';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ 
  user: 'postgres', 
  host: 'localhost', 
  database: 'vialifecoach_db', 
  password: 'Si82monG@)$', 
  port: 5432 
});

async function generateAdminTokens() {
  const adminEmail = 'academy@vialifecoach.org';
  const ACCESS_SECRET = 'vialifecoach_access_dev_secret_change_this';
  const REFRESH_SECRET = 'vialifecoach_refresh_dev_secret_change_this';
  
  try {
    // Generate new tokens
    const accessToken = jwt.sign(
      { id: 0, email: adminEmail, role: 'admin' },
      ACCESS_SECRET,
      { expiresIn: '1d' }
    );
    
    const refreshToken = jwt.sign(
      { email: adminEmail },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    // Store refresh token in database
    await pool.query(
      `INSERT INTO refresh_tokens (user_email, refresh_token, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_email) DO UPDATE SET refresh_token = EXCLUDED.refresh_token, created_at = EXCLUDED.created_at`,
      [adminEmail, refreshToken]
    );
    
    console.log('=== Admin Tokens Generated Successfully ===');
    console.log('');
    console.log('Access Token:');
    console.log(accessToken);
    console.log('');
    console.log('Refresh Token:');
    console.log(refreshToken);
    console.log('');
    console.log('You can now use these tokens to make API requests.');
    console.log('Example:');
    console.log(`curl -H "Authorization: Bearer ${accessToken}" http://localhost:5500/api/v1/courses`);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

generateAdminTokens();
