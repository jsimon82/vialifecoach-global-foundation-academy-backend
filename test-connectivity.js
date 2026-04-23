// Test frontend connectivity to debug endpoints
import fetch from 'node-fetch';

const testFrontendConnectivity = async () => {
  console.log('🔍 Testing frontend connectivity...\n');
  
  // Test 1: Debug GET endpoint
  try {
    console.log('1️⃣ Testing debug GET endpoint...');
    const debugResponse = await fetch('http://localhost:5000/api/v1/debug');
    const debugData = await debugResponse.json();
    console.log('✅ Debug GET response:', debugData.message);
  } catch (error) {
    console.log('❌ Debug GET failed:', error.message);
  }
  
  // Test 2: Debug POST endpoint (simulating email send)
  try {
    console.log('\n2️⃣ Testing debug POST endpoint...');
    const postResponse = await fetch('http://localhost:5000/api/v1/debug-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'sgahimbare@vialifecoach.org',
        subject: 'Test Email',
        content: 'Test content'
      })
    });
    const postData = await postResponse.json();
    console.log('✅ Debug POST response:', postData.message);
  } catch (error) {
    console.log('❌ Debug POST failed:', error.message);
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Try these URLs in your browser:');
  console.log('   - http://localhost:5000/api/v1/debug');
  console.log('   - http://localhost:5000/api/v1/debug-post (use POST method)');
  console.log('2. Check browser console when sending email');
  console.log('3. Check backend console for debug logs');
};

testFrontendConnectivity();
