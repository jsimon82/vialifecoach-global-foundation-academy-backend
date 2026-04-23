// Test script to debug email sending issue
import fetch from 'node-fetch';

const debugEmailSending = async () => {
  console.log('🔍 Starting email sending debug...\n');
  
  // Step 1: Test if backend is running
  try {
    console.log('1️⃣ Testing backend connection...');
    const healthResponse = await fetch('http://localhost:5000/api/v1/admin/test');
    console.log('Health check status:', healthResponse.status);
    if (healthResponse.status === 401) {
      console.log('✅ Backend is running (401 = authentication required, which is expected)');
    } else {
      console.log('❌ Backend status unexpected:', healthResponse.status);
    }
  } catch (error) {
    console.log('❌ Backend not running:', error.message);
    return;
  }
  
  // Step 2: Test the test email endpoint (no auth required)
  try {
    console.log('\n2️⃣ Testing test email endpoint...');
    const testEmailResponse = await fetch('http://localhost:5000/api/v1/admin/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'sgahimbare@vialifecoach.org',
        subject: 'Debug Test Email',
        content: 'This is a debug test email'
      })
    });
    
    const testEmailData = await testEmailResponse.json();
    console.log('Test email response:', testEmailData);
    console.log('✅ Test email endpoint works!');
  } catch (error) {
    console.log('❌ Test email endpoint failed:', error.message);
  }
  
  // Step 3: Try to simulate admin login (this would require actual credentials)
  console.log('\n3️⃣ Testing admin authentication...');
  console.log('❌ Cannot test admin auth without credentials');
  console.log('💡 Please check browser console for detailed error messages');
  
  console.log('\n🎯 Debugging Summary:');
  console.log('1. Check browser console for frontend errors');
  console.log('2. Check backend console for server logs');
  console.log('3. Make sure you are logged in as admin');
  console.log('4. Check if access token is being sent');
};

debugEmailSending();
