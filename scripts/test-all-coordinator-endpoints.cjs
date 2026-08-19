const http = require('http');

console.log('🔍 Testing ALL Coordinator Endpoints');
console.log('=====================================');

// All possible endpoints EventsManagement.tsx might be calling
const endpoints = [
  // Event endpoints
  { method: 'GET', url: '/api/v1/events', desc: 'GET /api/v1/events' },
  { method: 'GET', url: '/api/v1/events/', desc: 'GET /api/v1/events/' },
  { method: 'GET', url: '/api/v1/coordinator/events', desc: 'GET /api/v1/coordinator/events' },
  { method: 'GET', url: '/api/v1/coordinator/events/', desc: 'GET /api/v1/coordinator/events/' },
  
  // Challenge endpoints  
  { method: 'GET', url: '/api/v1/challenges', desc: 'GET /api/v1/challenges' },
  { method: 'GET', url: '/api/v1/challenges/', desc: 'GET /api/v1/challenges/' },
  { method: 'GET', url: '/api/v1/coordinator/challenges', desc: 'GET /api/v1/coordinator/challenges' },
  { method: 'GET', url: '/api/v1/coordinator/challenges/', desc: 'GET /api/v1/coordinator/challenges/' },
  
  // Registration endpoints
  { method: 'GET', url: '/api/v1/registrations', desc: 'GET /api/v1/registrations' },
  { method: 'GET', url: '/api/v1/registrations/', desc: 'GET /api/v1/registrations/' },
  { method: 'GET', url: '/api/v1/coordinator/registrations', desc: 'GET /api/v1/coordinator/registrations' },
  
  // Stats endpoints
  { method: 'GET', url: '/api/v1/stats', desc: 'GET /api/v1/stats' },
  { method: 'GET', url: '/api/v1/stats/', desc: 'GET /api/v1/stats/' },
  { method: 'GET', url: '/api/v1/registration-stats', desc: 'GET /api/v1/registration-stats' },
  { method: 'GET', url: '/api/v1/registration-stats/', desc: 'GET /api/v1/registration-stats/' },
  
  // Dashboard endpoints
  { method: 'GET', url: '/api/v1/dashboard', desc: 'GET /api/v1/dashboard' },
  { method: 'GET', url: '/api/v1/dashboard/', desc: 'GET /api/v1/dashboard/' },
  { method: 'GET', url: '/api/v1/coordinator/dashboard', desc: 'GET /api/v1/coordinator/dashboard' },
  
  // Common variations
  { method: 'GET', url: '/api/v1/events/list', desc: 'GET /api/v1/events/list' },
  { method: 'GET', url: '/api/v1/events/all', desc: 'GET /api/v1/events/all' },
  { method: 'GET', url: '/api/events', desc: 'GET /api/events' },
  { method: 'GET', url: '/api/events/', desc: 'GET /api/events/' }
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint.url,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5174',
        'Referer': 'http://localhost:5174/'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          url: endpoint.url,
          desc: endpoint.desc,
          status: res.statusCode,
          headers: res.headers,
          data: data,
          hasData: data.length > 0
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        url: endpoint.url,
        desc: endpoint.desc,
        error: error.message
      });
    });

    req.setTimeout(3000, () => {
      req.destroy();
      resolve({
        url: endpoint.url,
        desc: endpoint.desc,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('Testing all possible coordinator endpoints...\n');
  
  const results = [];
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    console.log(`📡 ${result.desc}`);
    console.log(`   Status: ${result.status || 'ERROR'}`);
    
    if (result.error) {
      console.log(`   ❌ ERROR: ${result.error}`);
    } else {
      console.log(`   ✅ Response received (${result.data.length} bytes)`);
      
      // Try to parse and check if it's an array
      try {
        const parsed = JSON.parse(result.data);
        const isArray = Array.isArray(parsed);
        const length = parsed ? parsed.length : 'undefined';
        console.log(`   📊 Type: ${typeof parsed}, Is Array: ${isArray}, Length: ${length}`);
        
        if (!isArray && typeof parsed === 'object' && parsed.data) {
          const dataIsArray = Array.isArray(parsed.data);
          const dataLength = parsed.data ? parsed.data.length : 'undefined';
          console.log(`   📊 Nested data - Type: ${typeof parsed.data}, Is Array: ${dataIsArray}, Length: ${dataLength}`);
        }
      } catch (e) {
        console.log(`   ⚠️  Not valid JSON: ${e.message}`);
      }
    }
    console.log('');
  }
  
  // Summary
  console.log('📊 SUMMARY');
  console.log('==========');
  const successCount = results.filter(r => r.status && r.status === 200).length;
  const errorCount = results.filter(r => r.error || (r.status && r.status !== 200)).length;
  
  console.log(`✅ Successful endpoints: ${successCount}`);
  console.log(`❌ Failed/Missing endpoints: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\n🔍 MISSING ENDPOINTS (might cause frontend errors):');
    results.filter(r => r.error || (r.status && r.status !== 200)).forEach(r => {
      console.log(`   ❌ ${r.desc}: ${r.error || `Status ${r.status}`}`);
    });
  }
}

runTests().catch(console.error);
