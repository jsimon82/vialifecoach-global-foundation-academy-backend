// Comprehensive email debugging test
import fetch from 'node-fetch';

const debugEmailIssue = async () => {
  console.log('🔍 Comprehensive Email Debug Test...\n');
  
  // Step 1: Test if admin auth endpoint works
  try {
    console.log('1️⃣ Testing admin auth endpoint...');
    const authResponse = await fetch('http://localhost:5000/api/v1/admin-test');
    console.log('Admin auth status:', authResponse.status);
    if (authResponse.status === 401) {
      console.log('✅ Admin auth working (requires token as expected)');
    } else {
      const authData = await authResponse.json();
      console.log('❌ Unexpected admin auth response:', authData);
    }
  } catch (error) {
    console.log('❌ Admin auth test failed:', error.message);
  }
  
  // Step 2: Test email endpoint without auth (should fail with 401)
  try {
    console.log('\n2️⃣ Testing email endpoint without auth...');
    const emailResponse = await fetch('http://localhost:5000/api/v1/admin/applications/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: 'APP3',
        to: 'sgahimbare@vialifecoach.org',
        subject: 'Debug Test',
        content: 'Debug content'
      })
    });
    console.log('Email endpoint status:', emailResponse.status);
    const emailData = await emailResponse.json();
    console.log('Email endpoint response:', emailData);
  } catch (error) {
    console.log('❌ Email endpoint test failed:', error.message);
  }
  
  // Step 3: Check if frontend is making the right request
  console.log('\n3️⃣ Frontend Debug Checklist:');
  console.log('   - Open browser developer tools (F12)');
  console.log('   - Go to Console tab');
  console.log('   - Try to send an email');
  console.log('   - Look for these console logs:');
  console.log('     * 🔍 Frontend: Starting email send');
  console.log('     * 🔍 Frontend: Access token exists: true/false');
  console.log('     * 🔍 Frontend: Selected application ID: APP3');
  console.log('     * 🔍 Frontend: Email response status: [number]');
  console.log('     * ❌ Frontend: Failed to send email: [error message]');
  
  console.log('\n4️⃣ Backend Debug Checklist:');
  console.log('   - Check backend console for:');
  console.log('     * 🔍 Email send request received');
  console.log('     * ✅ Email logged');
  console.log('     * ❌ Error sending email');
  
  console.log('\n5️⃣ Common Issues:');
  console.log('   a) Not logged in as admin');
  console.log('   b) Access token expired');
  console.log('   c) Network/CORS issues');
  console.log('   d) Application not selected (selectedApplication?.id missing)');
  console.log('   e) Email data malformed');
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Check browser console for detailed error messages');
  console.log('2. Check backend console for request logs');
  console.log('3. Make sure you are logged in as admin');
  console.log('4. Make sure an application is selected in the modal');
};

debugEmailIssue();
