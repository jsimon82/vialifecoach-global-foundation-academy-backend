// Quick test script to verify admin credentials
import '../src/config/env.js';
import { validateAdminCredentials, getAdminCredentials } from '../src/utils/adminCredentials.js';

const admin = getAdminCredentials();
console.log('Admin credentials from .env:');
console.log('  Email:', admin.email);
console.log('  Password:', admin.password ? '*** (set)' : 'NOT SET');

// Test the credentials you're trying to use
const testEmail = 'academy@vialifecoach.org';
const testPassword = 'Academy@';

const isValid = validateAdminCredentials(testEmail, testPassword);
console.log('\nValidation result:');
console.log('  Input Email:', testEmail);
console.log('  Input Password:', testPassword);
console.log('  Valid:', isValid);

if (!isValid) {
  console.log('\nPossible issues:');
  console.log('1. The .env file might not be loaded correctly');
  console.log('2. There might be whitespace/encoding issues in the .env file');
  console.log('3. The server might need to be restarted');
}
