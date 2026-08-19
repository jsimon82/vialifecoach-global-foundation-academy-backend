#!/usr/bin/env node

/**
 * Test Community Routes
 * Test the new community API endpoints to verify they work
 */

import { createServer } from 'http';
import { parse } from 'url';

const server = createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Community Events endpoint
  if (pathname === '/api/v1/community/events' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    const mockEvents = [
      {
        id: 1,
        title: "Web Development Workshop",
        description: "Learn modern web development techniques",
        event_type: "workshop",
        start_at: "2026-05-15T14:00:00Z",
        max_spots: 50,
        host_name: "Tech Team",
        registered_count: 25,
        is_registered: false
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
        is_registered: false
      }
    ];
    
    res.end(JSON.stringify(mockEvents));
    return;
  }

  // Community Success Stories endpoint
  if (pathname === '/api/v1/community/success-stories' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    const mockSuccessStories = [
      {
        id: 1,
        name: "John Doe",
        display_name: "John Doe",
        image_url: "https://via.placeholder.com/150",
        story: "This program helped me land my dream job as a software developer. The mentorship and hands-on projects were invaluable.",
        course: "Full Stack Development",
        role_label: "Software Engineer",
        rating: 5,
        created_at: "2026-04-15T10:00:00Z"
      },
      {
        id: 2,
        name: "Jane Smith",
        display_name: "Jane Smith",
        image_url: "https://via.placeholder.com/150",
        story: "I transitioned from marketing to tech thanks to this amazing program. The support from instructors and peers was incredible.",
        course: "Digital Marketing Tech",
        role_label: "Marketing Technologist",
        rating: 5,
        created_at: "2026-04-10T14:30:00Z"
      }
    ];
    
    res.end(JSON.stringify(mockSuccessStories));
    return;
  }

  // Community Challenges endpoint
  if (pathname === '/api/v1/community/challenges' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    const mockChallenges = [
      {
        id: 1,
        title: "30-Day Coding Challenge",
        description: "Improve your coding skills with daily challenges",
        duration_days: 30,
        badge: "Code Master",
        participants: 150,
        progress: null,
        joined: false
      },
      {
        id: 2,
        title: "Portfolio Building Challenge",
        description: "Create an impressive portfolio in 21 days",
        duration_days: 21,
        badge: "Portfolio Pro",
        participants: 89,
        progress: null,
        joined: false
      }
    ];
    
    res.end(JSON.stringify(mockChallenges));
    return;
  }

  // Community Mentors endpoint
  if (pathname === '/api/v1/community/mentors' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    const mockMentors = [
      {
        id: 1,
        name: "Dr. Sarah Johnson",
        title: "Senior Software Engineer",
        bio: "10+ years of experience in full-stack development",
        image_url: "https://via.placeholder.com/150",
        expertise: ["React", "Node.js", "Python"],
        rating: 4.9
      },
      {
        id: 2,
        name: "Prof. Michael Chen",
        title: "Data Science Expert",
        bio: "Specializing in machine learning and AI",
        image_url: "https://via.placeholder.com/150",
        expertise: ["Machine Learning", "Python", "Statistics"],
        rating: 4.8
      }
    ];
    
    res.end(JSON.stringify(mockMentors));
    return;
  }

  // Registration endpoint
  if (pathname === '/api/v1/registrations' && method === 'POST') {
    res.writeHead(201, { 'Content-Type': 'application/json' });
    
    res.end(JSON.stringify({ 
      success: true, 
      message: "Registration successful",
      data: { id: Date.now(), status: 'registered' }
    }));
    return;
  }

  // Registration stats endpoint
  if (pathname === '/api/v1/registration-stats' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    const safeData = {
      success: true,
      data: {
        registration_stats: {
          total_registrations: 0,
          coordinator_registrations: 0,
          community_registrations: 0,
          dual_registrations: 0
        },
        event_stats: {
          upcoming_events: 0,
          total_capacity: 0,
          total_participants: 0,
          fill_rate: 0
        },
        recent_registrations: [],
        events_summary: []
      }
    };
    
    res.end(JSON.stringify(safeData));
    return;
  }

  // Coordinator login endpoint
  if (pathname === '/api/v1/coordinator/login' && method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    const loginResponse = {
      success: true,
      accessToken: 'mock-token-for-testing',
      user: {
        id: 1,
        name: 'Event Coordinator',
        email: 'support@vialifecoach.org',
        role: 'coordinator',
        department: 'Events Management'
      }
    };
    
    res.end(JSON.stringify(loginResponse));
    return;
  }

  // Default response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Not found' }));
});

const PORT = 5001;
server.listen(PORT, () => {
  console.log(`🚀 Community API server running on port ${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET /api/v1/community/events - Community events`);
  console.log(`   GET /api/v1/community/challenges - Community challenges`);
  console.log(`   GET /api/v1/community/success-stories - Success stories`);
  console.log(`   GET /api/v1/community/mentors - Community mentors`);
  console.log(`   POST /api/v1/registrations - Public registration`);
  console.log(`   GET /api/v1/registration-stats - Registration stats`);
  console.log(`   POST /api/v1/coordinator/login - Coordinator login`);
  console.log(`\n✅ Community routes are now available!`);
});

// Test the endpoints
setTimeout(() => {
  console.log('\n🧪 Testing community endpoints...');
  
  import('node-fetch').then(({ default: fetch }) => {
    // Test events
    fetch('http://localhost:5000/api/v1/community/events')
      .then(res => res.json())
      .then(data => {
        console.log('✅ Events endpoint works:', data.length, 'events returned');
        
        // Test success stories
        return fetch('http://localhost:5000/api/v1/community/success-stories');
      })
      .then(res => res.json())
      .then(data => {
        console.log('✅ Success stories endpoint works:', data.length, 'stories returned');
        
        // Test challenges
        return fetch('http://localhost:5000/api/v1/community/challenges');
      })
      .then(res => res.json())
      .then(data => {
        console.log('✅ Challenges endpoint works:', data.length, 'challenges returned');
        
        // Test mentors
        return fetch('http://localhost:5000/api/v1/community/mentors');
      })
      .then(res => res.json())
      .then(data => {
        console.log('✅ Mentors endpoint works:', data.length, 'mentors returned');
        
        console.log('\n🎉 All community endpoints working!');
        console.log('📋 The frontend will now show events and success stories');
      })
      .catch(err => {
        console.error('❌ Test failed:', err.message);
      });
  });
}, 1000);
