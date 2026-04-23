require('dotenv').config();

console.log('🔍 Testing environment variables...');
console.log('ACCESS_TOKEN_SECRET:', process.env.ACCESS_TOKEN_SECRET);
console.log('REFRESH_TOKEN_SECRET:', process.env.REFRESH_TOKEN_SECRET);
console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);
console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD);

const jwt = require('jsonwebtoken');

try {
  const token = jwt.sign(
    { email: 'test' }, 
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
  console.log('✅ Token generation works:', token);
} catch (error) {
  console.error('❌ Token generation failed:', error.message);
}
