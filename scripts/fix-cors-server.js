#!/usr/bin/env node

/**
 * Fix CORS Server
 * Run community API on port 5000 with proper CORS configuration for credentials
 */

import { createServer } from 'http';
import { parse } from 'url';

const server = createServer((req, res) => {
  // Enable CORS with proper credentials support
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5174');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Community Events endpoint - REMOVED (events only available in coordinator dashboard)
  if (pathname === '/api/v1/community/events' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([])); // Return empty array
    return;
  }

  // Community Success Stories endpoint - REMOVED (success stories only available in admin dashboard)
  if (pathname === '/api/v1/community/success-stories' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([])); // Return empty array
    return;
  }

  // Community Challenges endpoint - REMOVED (challenges only available in coordinator dashboard)
  if (pathname === '/api/v1/community/challenges' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([])); // Return empty array
    return;
  }

  // Community Mentors endpoint - KEEP (mentors are not events/challenges)
  if (pathname === '/api/v1/community/mentors' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    const mockMentors = [
      {
        id: 1,
        name: "Dr. Sarah Johnson",
        title: "Senior Software Engineer",
        bio: "10+ years of experience in full-stack development with expertise in React, Node.js, and cloud architecture.",
        image_url: "https://via.placeholder.com/150",
        expertise: ["React", "Node.js", "Python", "AWS"],
        rating: 4.9
      },
      {
        id: 2,
        name: "Prof. Michael Chen",
        title: "Data Science Expert",
        bio: "Specializing in machine learning and AI with 15 years of experience in both academia and industry.",
        image_url: "https://via.placeholder.com/150",
        expertise: ["Machine Learning", "Python", "Statistics", "TensorFlow"],
        rating: 4.8
      },
      {
        id: 3,
        name: "Lisa Anderson",
        title: "UX/UI Design Lead",
        bio: "Passionate about creating intuitive user experiences with 8 years of design expertise.",
        image_url: "https://via.placeholder.com/150",
        expertise: ["UI Design", "UX Research", "Figma", "Prototyping"],
        rating: 4.7
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
    
    // Get the same events that are shown in community section
    const communityEvents = [
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
      },
      {
        id: 3,
        title: "React Masterclass",
        description: "Advanced React patterns and best practices",
        event_type: "workshop",
        start_at: "2026-05-25T10:00:00Z",
        max_spots: 30,
        host_name: "React Experts",
        registered_count: 18,
        is_registered: false
      }
    ];

    // Transform events to match coordinator dashboard expected format
    const eventsSummary = communityEvents.map(event => ({
      id: event.id,
      title: event.title,
      event_type: event.event_type,
      max_participants: event.max_spots,
      current_participants: event.registered_count,
      start_at: event.start_at,
      host_name: event.host_name,
      fill_percentage: event.max_spots > 0 ? Math.round((event.registered_count / event.max_spots) * 100) : 0
    }));

    const safeData = {
      success: true,
      data: {
        registration_stats: {
          total_registrations: communityEvents.reduce((sum, event) => sum + event.registered_count, 0),
          coordinator_registrations: Math.floor(communityEvents.reduce((sum, event) => sum + event.registered_count, 0) * 0.3),
          community_registrations: Math.floor(communityEvents.reduce((sum, event) => sum + event.registered_count, 0) * 0.5),
          dual_registrations: Math.floor(communityEvents.reduce((sum, event) => sum + event.registered_count, 0) * 0.2)
        },
        event_stats: {
          upcoming_events: communityEvents.length,
          total_capacity: communityEvents.reduce((sum, event) => sum + event.max_spots, 0),
          total_participants: communityEvents.reduce((sum, event) => sum + event.registered_count, 0),
          fill_rate: communityEvents.length > 0 ? Math.round((communityEvents.reduce((sum, event) => sum + event.registered_count, 0) / communityEvents.reduce((sum, event) => sum + event.max_spots, 0)) * 100) : 0
        },
        recent_registrations: [],
        events_summary: eventsSummary
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
      message: 'Login successful',
      accessToken: 'mock-coordinator-token-12345',
      user: {
        id: 1,
        email: 'support@vialifecoach.org',
        role: 'coordinator'
      }
    };
    
    res.end(JSON.stringify(loginResponse));
    return;
  }

  // Analytics visit endpoint
  if (pathname === '/api/v1/analytics/visit' && method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // Health check endpoint
  if (pathname === '/api/v1/health' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      ok: true, 
      service: 'vialifecoach-backend', 
      time: new Date().toISOString() 
    }));
    return;
  }

  // Coordinator Event Management Endpoints

  // Create new event
  if (pathname === '/api/v1/coordinator/events' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const eventData = JSON.parse(body);
        
        const newEvent = {
          id: Date.now(),
          title: eventData.title || "New Event",
          description: eventData.description || "Event description",
          event_type: eventData.event_type || "workshop",
          start_at: eventData.start_at || "2026-06-01T10:00:00Z",
          max_spots: eventData.max_spots || 50,
          host_name: eventData.host_name || "Coordinator",
          registered_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Event created successfully',
          data: newEvent
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Invalid request data',
          error: error.message
        }));
      }
    });
    return;
  }

  // Get all events (for coordinator management)
  if (pathname === '/api/v1/coordinator/events' && method === 'GET') {
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
      },
      {
        id: 3,
        title: "React Masterclass",
        description: "Advanced React patterns and best practices",
        event_type: "workshop",
        start_at: "2026-05-25T10:00:00Z",
        max_spots: 30,
        host_name: "React Experts",
        registered_count: 18,
        created_at: "2026-04-03T12:00:00Z",
        updated_at: "2026-04-03T12:00:00Z"
      }
    ];
    
    res.end(JSON.stringify({
      success: true,
      data: events
    }));
    return;
  }

  // Update event
  if (pathname.startsWith('/api/v1/coordinator/events/') && method === 'PUT') {
    const eventId = pathname.split('/').pop();
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const eventData = JSON.parse(body);
        
        const updatedEvent = {
          id: parseInt(eventId),
          title: eventData.title || "Updated Event Title",
          description: eventData.description || "Updated description",
          event_type: eventData.event_type || "workshop",
          start_at: eventData.start_at || "2026-06-01T10:00:00Z",
          max_spots: eventData.max_spots || 50,
          host_name: eventData.host_name || "Coordinator",
          registered_count: eventData.registered_count || 25,
          updated_at: new Date().toISOString()
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Event updated successfully',
          data: updatedEvent
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Invalid request data',
          error: error.message
        }));
      }
    });
    return;
  }

  // Delete event
  if (pathname.startsWith('/api/v1/coordinator/events/') && method === 'DELETE') {
    const eventId = pathname.split('/').pop();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    res.end(JSON.stringify({
      success: true,
      message: `Event ${eventId} deleted successfully`
    }));
    return;
  }

  // Coordinator Challenge Management Endpoints

  // Create new challenge
  if (pathname === '/api/v1/coordinator/challenges' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const challengeData = JSON.parse(body);
        
        const newChallenge = {
          id: Date.now(),
          title: challengeData.title || "New Challenge",
          description: challengeData.description || "Challenge description",
          duration_days: challengeData.duration_days || 30,
          badge: challengeData.badge || "Challenge Master",
          participants: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Challenge created successfully',
          data: newChallenge
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Invalid request data',
          error: error.message
        }));
      }
    });
    return;
  }

  // Get all challenges (for coordinator management)
  if (pathname === '/api/v1/coordinator/challenges' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    const challenges = [
      {
        id: 1,
        title: "30-Day Coding Challenge",
        description: "Improve your coding skills with daily challenges",
        duration_days: 30,
        badge: "Code Master",
        participants: 150,
        created_at: "2026-04-01T10:00:00Z",
        updated_at: "2026-04-01T10:00:00Z"
      },
      {
        id: 2,
        title: "Portfolio Building Challenge",
        description: "Create an impressive portfolio in 21 days",
        duration_days: 21,
        badge: "Portfolio Pro",
        participants: 89,
        created_at: "2026-04-02T11:00:00Z",
        updated_at: "2026-04-02T11:00:00Z"
      },
      {
        id: 3,
        title: "Algorithm Challenge",
        description: "Master algorithms with weekly challenges",
        duration_days: 14,
        badge: "Algorithm Ninja",
        participants: 67,
        created_at: "2026-04-03T12:00:00Z",
        updated_at: "2026-04-03T12:00:00Z"
      }
    ];
    
    res.end(JSON.stringify({
      success: true,
      data: challenges
    }));
    return;
  }

  // Update challenge
  if (pathname.startsWith('/api/v1/coordinator/challenges/') && method === 'PUT') {
    const challengeId = pathname.split('/').pop();
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const challengeData = JSON.parse(body);
        
        const updatedChallenge = {
          id: parseInt(challengeId),
          title: challengeData.title || "Updated Challenge Title",
          description: challengeData.description || "Updated description",
          duration_days: challengeData.duration_days || 30,
          badge: challengeData.badge || "Challenge Master",
          participants: challengeData.participants || 150,
          updated_at: new Date().toISOString()
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Challenge updated successfully',
          data: updatedChallenge
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Invalid request data',
          error: error.message
        }));
      }
    });
    return;
  }

  // Delete challenge
  if (pathname.startsWith('/api/v1/coordinator/challenges/') && method === 'DELETE') {
    const challengeId = pathname.split('/').pop();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    res.end(JSON.stringify({
      success: true,
      message: `Challenge ${challengeId} deleted successfully`
    }));
    return;
  }

  // General Events endpoints (for frontend coordinator service)

  // Get challenges with pagination and filtering
  if (pathname === '/api/v1/challenges' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    try {
      const url = new URL(req.url, `http://localhost:5000`);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      
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
        },
        {
          id: 2,
          title: "React Portfolio Challenge",
          description: "Build a complete React portfolio in 2 weeks",
          duration_days: 14,
          badge: "React Expert",
          participants: 89,
          created_at: "2026-04-02T11:00:00Z",
          updated_at: "2026-04-02T11:00:00Z"
        },
        {
          id: 3,
          title: "API Design Challenge",
          description: "Design and implement RESTful APIs",
          duration_days: 21,
          badge: "API Architect",
          participants: 67,
          created_at: "2026-04-03T12:00:00Z",
          updated_at: "2026-04-03T12:00:00Z"
        }
      ];
      
      // Ensure challenges is always an array
      const safeChallenges = Array.isArray(challenges) ? challenges : [];
      
      // Pagination with safety checks
      const safePage = isNaN(page) || page < 1 ? 1 : page;
      const safeLimit = isNaN(limit) || limit < 1 ? 10 : limit;
      const startIndex = (safePage - 1) * safeLimit;
      const endIndex = startIndex + safeLimit;
      const paginatedChallenges = safeChallenges.slice(startIndex, endIndex);
      
      // Ensure final result is always an array
      const finalChallenges = Array.isArray(paginatedChallenges) ? paginatedChallenges : [];
      
      res.end(JSON.stringify(finalChallenges));
    } catch (error) {
      // Return empty array on any error
      res.end(JSON.stringify([]));
    }
    return;
  }

  // Get events with pagination and filtering
  if (pathname === '/api/v1/events' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    try {
      const url = new URL(req.url, `http://localhost:5000`);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const status = url.searchParams.get('status'); // upcoming, past, all
      
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
        },
        {
          id: 3,
          title: "React Masterclass",
          description: "Advanced React patterns and best practices",
          event_type: "workshop",
          start_at: "2026-05-25T10:00:00Z",
          max_spots: 30,
          host_name: "React Experts",
          registered_count: 18,
          created_at: "2026-04-03T12:00:00Z",
          updated_at: "2026-04-03T12:00:00Z"
        }
      ];
      
      // Ensure events is always an array
      const safeEvents = Array.isArray(events) ? events : [];
      
      // Filter by status if provided
      let filteredEvents = safeEvents;
      if (status === 'upcoming') {
        filteredEvents = safeEvents.filter(event => new Date(event.start_at) > new Date());
      } else if (status === 'past') {
        filteredEvents = safeEvents.filter(event => new Date(event.start_at) <= new Date());
      }
      
      // Ensure filteredEvents is always an array
      const safeFilteredEvents = Array.isArray(filteredEvents) ? filteredEvents : [];
      
      // Pagination with safety checks
      const safePage = isNaN(page) || page < 1 ? 1 : page;
      const safeLimit = isNaN(limit) || limit < 1 ? 10 : limit;
      const startIndex = (safePage - 1) * safeLimit;
      const endIndex = startIndex + safeLimit;
      const paginatedEvents = safeFilteredEvents.slice(startIndex, endIndex);
      
      // Ensure final result is always an array
      const finalEvents = Array.isArray(paginatedEvents) ? paginatedEvents : [];
      
      res.end(JSON.stringify(finalEvents));
    } catch (error) {
      // Return empty array on any error
      res.end(JSON.stringify([]));
    }
    return;
  }

  // Create event (general endpoint)
  if (pathname === '/api/v1/events' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const eventData = JSON.parse(body);
        
        const newEvent = {
          id: Date.now(),
          title: eventData.title || "New Event",
          description: eventData.description || "Event description",
          event_type: eventData.event_type || "workshop",
          start_at: eventData.start_at || "2026-06-01T10:00:00Z",
          max_spots: eventData.max_spots || 50,
          host_name: eventData.host_name || "Coordinator",
          registered_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Event created successfully',
          data: newEvent
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Invalid request data',
          error: error.message
        }));
      }
    });
    return;
  }

  // Update event (general endpoint)
  if (pathname.startsWith('/api/v1/events/') && method === 'PUT') {
    const eventId = pathname.split('/').pop();
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const eventData = JSON.parse(body);
        
        const updatedEvent = {
          id: parseInt(eventId),
          title: eventData.title || "Updated Event Title",
          description: eventData.description || "Updated description",
          event_type: eventData.event_type || "workshop",
          start_at: eventData.start_at || "2026-06-01T10:00:00Z",
          max_spots: eventData.max_spots || 50,
          host_name: eventData.host_name || "Coordinator",
          registered_count: eventData.registered_count || 25,
          updated_at: new Date().toISOString()
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Event updated successfully',
          data: updatedEvent
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Invalid request data',
          error: error.message
        }));
      }
    });
    return;
  }

  // Delete event (general endpoint)
  if (pathname.startsWith('/api/v1/events/') && method === 'DELETE') {
    const eventId = pathname.split('/').pop();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    
    res.end(JSON.stringify({
      success: true,
      message: `Event ${eventId} deleted successfully`
    }));
    return;
  }

  // Default response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Not found' }));
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 CORS-Fixed API server running on port ${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET /api/v1/community/events - Community events`);
  console.log(`   GET /api/v1/community/challenges - Community challenges`);
  console.log(`   GET /api/v1/community/success-stories - Success stories`);
  console.log(`   GET /api/v1/community/mentors - Community mentors`);
  console.log(`   POST /api/v1/registrations - Public registration`);
  console.log(`   GET /api/v1/registration-stats - Registration stats`);
  console.log(`   POST /api/v1/coordinator/login - Coordinator login`);
  console.log(`   POST /api/v1/analytics/visit - Analytics tracking`);
  console.log(`\n✅ CORS configured for credentials mode`);
  console.log(`🔧 Origin: http://localhost:5174`);
});

// Test the endpoints
setTimeout(() => {
  console.log('\n🧪 Testing CORS-fixed endpoints...');
  
  import('node-fetch').then(({ default: fetch }) => {
    // Test events with proper CORS headers
    fetch('http://localhost:5000/api/v1/community/events', {
      headers: {
        'Origin': 'http://localhost:5174',
        'Referer': 'http://localhost:5174/'
      }
    })
      .then(res => {
        console.log('✅ Events CORS test:', res.status, res.headers.get('access-control-allow-origin'));
        return res.json();
      })
      .then(data => {
        console.log('✅ Events endpoint works:', data.length, 'events returned');
        
        // Test success stories
        return fetch('http://localhost:5000/api/v1/community/success-stories', {
          headers: {
            'Origin': 'http://localhost:5174',
            'Referer': 'http://localhost:5174/'
          }
        });
      })
      .then(res => {
        console.log('✅ Success stories CORS test:', res.status, res.headers.get('access-control-allow-origin'));
        return res.json();
      })
      .then(data => {
        console.log('✅ Success stories endpoint works:', data.length, 'stories returned');
        
        console.log('\n🎉 CORS issue fixed!');
        console.log('📋 Frontend should now be able to access community endpoints');
      })
      .catch(err => {
        console.error('❌ Test failed:', err.message);
      });
  });
}, 1000);
