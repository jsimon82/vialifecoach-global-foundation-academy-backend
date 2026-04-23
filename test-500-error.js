// Test to reproduce the 500 error
import fetch from 'node-fetch';

const test500Error = async () => {
  console.log('🔍 Testing to reproduce 500 error...\n');
  
  // Test 1: Valid request (should work)
  try {
    console.log('1️⃣ Testing valid request...');
    const response1 = await fetch('http://localhost:5000/api/v1/admin/applications/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: 'APP3',
        to: 'sgahimbare@vialifecoach.org',
        subject: 'Test Subject',
        content: 'Test Content',
        templateName: 'Test Template',
        sentBy: 'Test Admin'
      })
    });
    
    console.log('Response 1 status:', response1.status);
    const data1 = await response1.json();
    console.log('Response 1 data:', data1);
    
  } catch (error) {
    console.log('❌ Test 1 failed:', error.message);
  }
  
  // Test 2: Missing fields (should return 400)
  try {
    console.log('\n2️⃣ Testing missing fields...');
    const response2 = await fetch('http://localhost:5000/api/v1/admin/applications/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: 'APP3',
        to: 'sgahimbare@vialifecoach.org',
        // Missing subject and content
      })
    });
    
    console.log('Response 2 status:', response2.status);
    const data2 = await response2.json();
    console.log('Response 2 data:', data2);
    
  } catch (error) {
    console.log('❌ Test 2 failed:', error.message);
  }
  
  // Test 3: Invalid JSON (should cause 500)
  try {
    console.log('\n3️⃣ Testing invalid JSON...');
    const response3 = await fetch('http://localhost:5000/api/v1/admin/applications/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json{'
    });
    
    console.log('Response 3 status:', response3.status);
    const data3 = await response3.json();
    console.log('Response 3 data:', data3);
    
  } catch (error) {
    console.log('❌ Test 3 failed:', error.message);
  }
  
  console.log('\n🎯 Now try sending email from frontend and check backend console for:');
  console.log('   - 🔍 Email send request received');
  console.log('   - ✅ Validation passed');
  console.log('   - ✅ Email logged');
  console.log('   - ❌ Error sending email (if 500 error)');
  console.log('   - ❌ Error stack (detailed error trace)');
};

test500Error();
