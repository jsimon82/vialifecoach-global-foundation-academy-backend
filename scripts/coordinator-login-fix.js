const http = require('http');

// Create a simple server to fix coordinator login 401 error
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5174');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:5000`);
  const pathname = url.pathname;
  const method = req.method;

  console.log(`${method} ${pathname}`);

  // Coordinator login endpoint
  if (pathname === '/api/v1/coordinator/login' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const loginData = JSON.parse(body);
        console.log('Coordinator login attempt:', loginData);
        
        // Simple authentication check
        if (loginData.email === 'coordinator@vialifecoach.org' && 
            loginData.password === 'coordinator123') {
          
          const response = {
            success: true,
            message: 'Login successful',
            data: {
              token: 'coordinator-token-' + Date.now(),
              user: {
                id: 1,
                email: 'coordinator@vialifecoach.org',
                name: 'Coordinator',
                role: 'coordinator'
              }
            }
          };
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'Invalid credentials'
          }));
        }
      } catch (error) {
        console.error('JSON parse error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Invalid JSON format'
        }));
      }
    });
    return;
  }

  // Events endpoint
  if (pathname === '/api/v1/events' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const events = [
      {
        id: 1,
        title: "Web Development Workshop",
        description: "Learn modern web development techniques",
        event_type: "workshop",
        start_at: "2026-05-15T14:00:00Z",
        max_spots: 50,
        host_name: "Tech Team",
        registered_count: 25,
        created_at: "2026-04-01T10:00:00Z",
        updated_at: "2026-04-01T10:00:00Z"
      },
      {
        id: 2,
        title: "Career Growth Seminar",
        description: "Tips for advancing your career",
        event_type: "webinar",
        start_at: "2026-05-20T16:00:00Z",
        max_spots: 100,
        host_name: "Career Experts",
        registered_count: 45,
        created_at: "2026-04-02T11:00:00Z",
        updated_at: "2026-04-02T11:00:00Z"
      }
    ];
    res.end(JSON.stringify(events));
    return;
  }

  // Challenges endpoint
  if (pathname === '/api/v1/challenges' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const challenges = [
      {
        id: 1,
        title: "30-Day Coding Challenge",
        description: "Complete coding exercises for 30 days straight",
        duration_days: 30,
        badge: "Code Master",
        participants: 150,
        created_at: "2026-04-01T10:00:00Z",
        updated_at: "2026-04-01T10:00:00Z"
      }
    ];
    res.end(JSON.stringify(challenges));
    return;
  }

  // Default response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Coordinator Login Fix Server running on port ${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   POST /api/v1/coordinator/login - Coordinator login`);
  console.log(`   GET /api/v1/events - Events list`);
  console.log(`   GET /api/v1/challenges - Challenges list`);
  console.log(`✅ CORS configured for http://localhost:5174`);
  console.log(`🔑 Coordinator credentials: coordinator@vialifecoach.org / coordinator123`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is already in use. Please stop the existing server first.`);
  } else {
    console.error('❌ Server error:', err);
  }
});
