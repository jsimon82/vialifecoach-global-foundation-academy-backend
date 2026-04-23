// Test exact frontend email sending logic
import fetch from 'node-fetch';

const testFrontendEmailLogic = async () => {
  console.log('🔍 Testing Frontend Email Logic...\n');
  
  // This simulates exactly what the frontend should be doing
  const accessToken = 'YOUR_ACCESS_TOKEN_HERE'; // You need to get this from browser
  
  const emailData = {
    to: 'sgahimbare@vialifecoach.org',
    subject: 'Test Email from Debug Script',
    content: 'This is a test email content',
    templateName: 'Test Template'
  };
  
  const requestBody = {
    applicationId: 'APP3',
    to: emailData.to,
    subject: emailData.subject,
    content: emailData.content,
    templateName: emailData.templateName,
    sentBy: 'Admin User'
  };
  
  console.log('🔍 Simulating frontend request...');
  console.log('Request URL:', 'http://localhost:5000/api/v1/admin/applications/send-email');
  console.log('Request method:', 'POST');
  console.log('Request headers:', {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  });
  console.log('Request body:', requestBody);
  
  console.log('\n❗ To get the actual access token:');
  console.log('1. Open browser developer tools');
  console.log('2. Go to Application tab → Local Storage');
  console.log('3. Look for access_token or similar key');
  console.log('4. Copy the token value');
  console.log('5. Replace YOUR_ACCESS_TOKEN_HERE above');
  
  console.log('\n🎯 Debug Steps:');
  console.log('1. First try sending email from frontend');
  console.log('2. Check browser console for errors');
  console.log('3. Check if you see these logs:');
  console.log('   - 🔍 Frontend: Starting email send');
  console.log('   - 🔍 Frontend: Access token exists: [true/false]');
  console.log('   - 🔍 Frontend: Selected application ID: [ID]');
  console.log('   - 🔍 Frontend: Email response status: [status]');
  console.log('4. Check backend console for request logs');
  
  // Try the request without token first (should fail with 401)
  try {
    console.log('\n2️⃣ Testing without access token...');
    const response = await fetch('http://localhost:5000/api/v1/admin/applications/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // No Authorization header
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.status === 401) {
      console.log('✅ Backend correctly rejecting unauthenticated requests');
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
};

testFrontendEmailLogic();
