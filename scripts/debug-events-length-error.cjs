const http = require('http');

console.log('🔍 Debugging Events Length Error');
console.log('================================');

// Test all possible API calls that EventsManagement.tsx might make
const testCases = [
  { url: '/api/v1/events', desc: 'Basic events call' },
  { url: '/api/v1/events?page=1', desc: 'Events with page' },
  { url: '/api/v1/events?limit=10', desc: 'Events with limit' },
  { url: '/api/v1/events?page=1&limit=10', desc: 'Events with pagination' },
  { url: '/api/v1/events?status=upcoming', desc: 'Events with status filter' },
  { url: '/api/v1/events?status=upcoming&limit=5', desc: 'Events with status and limit (dashboard call)' },
  { url: '/api/v1/events?page=1&limit=10', desc: 'Events with pagination (management call)' },
  { url: '/api/v1/events?page=abc&limit=xyz', desc: 'Events with invalid params' },
  { url: '/api/v1/events?status=past', desc: 'Events with past status' },
  { url: '/api/v1/events?page=0&limit=0', desc: 'Events with zero params' }
];

async function testEndpoint(testCase) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: testCase.url,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5174'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            url: testCase.url,
            desc: testCase.desc,
            status: res.statusCode,
            isArray: Array.isArray(parsed),
            length: parsed ? parsed.length : 'undefined',
            type: typeof parsed,
            data: parsed
          });
        } catch (error) {
          resolve({
            url: testCase.url,
            desc: testCase.desc,
            status: res.statusCode,
            error: error.message,
            rawResponse: data
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        url: testCase.url,
        desc: testCase.desc,
        error: error.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url: testCase.url,
        desc: testCase.desc,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('Testing all possible API endpoints...\n');
  
  for (const testCase of testCases) {
    const result = await testEndpoint(testCase);
    
    console.log(`📡 ${result.desc}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Status: ${result.status}`);
    
    if (result.error) {
      console.log(`   ❌ ERROR: ${result.error}`);
      if (result.rawResponse) {
        console.log(`   Raw Response: ${result.rawResponse}`);
      }
    } else {
      console.log(`   ✅ Response Type: ${result.type}`);
      console.log(`   ✅ Is Array: ${result.isArray}`);
      console.log(`   ✅ Length: ${result.length}`);
      
      if (!result.isArray) {
        console.log(`   ❌ CRITICAL: Response is not an array!`);
      }
      
      if (result.length === 'undefined') {
        console.log(`   ❌ CRITICAL: Response has no length property!`);
      }
      
      if (result.isArray && result.length > 0) {
        const firstItem = result.data[0];
        console.log(`   📄 First item keys: ${Object.keys(firstItem).join(', ')}`);
      }
    }
    console.log('');
  }
  
  console.log('🔍 Analysis Complete');
  console.log('==================');
  console.log('If any endpoint shows "Is Array: false" or "Length: undefined",');
  console.log('that is likely causing the frontend error.');
}

runTests().catch(console.error);
