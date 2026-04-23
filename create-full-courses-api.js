const fs = require('fs');

// Read the complete course data
const academyData = JSON.parse(fs.readFileSync('./seeds/academy_program_first3_courses.json', 'utf8'));

// Create comprehensive course data with full content
const fullCoursesData = [
  {
    id: 6,
    title: academyData.introductory_course.title,
    description: academyData.introductory_course.overview,
    price: 0,
    thumbnail_url: "https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=Orientation",
    duration: academyData.introductory_course.duration,
    level: "Beginner",
    modules: academyData.introductory_course.modules.map(module => ({
      title: module.title,
      lessons: module.lessons.map(lesson => ({
        title: lesson.title,
        content: lesson.content_markdown,
        duration: "15 minutes"
      }))
    }))
  },
  {
    id: 7,
    title: academyData.courses[0].title,
    description: academyData.courses[0].overview,
    price: 299,
    thumbnail_url: "https://via.placeholder.com/300x200/E74C3C/FFFFFF?text=Confidence",
    duration: academyData.courses[0].duration,
    level: academyData.courses[0].level,
    pillar: academyData.courses[0].pillar,
    objectives: academyData.courses[0].objectives,
    modules: academyData.courses[0].modules.map(module => ({
      title: module.title,
      lessons: module.lessons.map(lesson => ({
        title: lesson.title,
        content: lesson.content_markdown,
        duration: "20 minutes"
      }))
    })),
    final_reflection: academyData.courses[0].final_reflection
  },
  {
    id: 8,
    title: academyData.courses[1].title,
    description: academyData.courses[1].overview,
    price: 349,
    thumbnail_url: "https://via.placeholder.com/300x200/F39C12/FFFFFF?text=Positive+Mindset",
    duration: academyData.courses[1].duration,
    level: academyData.courses[1].level,
    pillar: academyData.courses[1].pillar,
    objectives: academyData.courses[1].objectives,
    modules: academyData.courses[1].modules.map(module => ({
      title: module.title,
      lessons: module.lessons.map(lesson => ({
        title: lesson.title,
        content: lesson.content_markdown,
        duration: "25 minutes"
      }))
    })),
    final_reflection: academyData.courses[1].final_reflection
  },
  {
    id: 9,
    title: academyData.courses[2].title,
    description: academyData.courses[2].overview,
    price: 379,
    thumbnail_url: "https://via.placeholder.com/300x200/27AE60/FFFFFF?text=Action+Now",
    duration: academyData.courses[2].duration,
    level: academyData.courses[2].level,
    pillar: academyData.courses[2].pillar,
    objectives: academyData.courses[2].objectives,
    modules: academyData.courses[2].modules.map(module => ({
      title: module.title,
      lessons: module.lessons.map(lesson => ({
        title: lesson.title,
        content: lesson.content_markdown,
        duration: "25 minutes"
      }))
    })),
    final_reflection: academyData.courses[2].final_reflection
  }
];

// Update the simple server with full course content
const simpleServerContent = `// Simple server without any ES module complications
console.log('Starting simple server...');

// Basic express setup without any complex imports
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Basic CORS - fixed for credentials
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Basic routes
app.get('/test', (req, res) => {
  res.json({ message: 'Simple server is working!', timestamp: new Date().toISOString() });
});

// Full courses endpoint with complete content
app.get('/api/v1/courses', (req, res) => {
  res.json(${JSON.stringify(fullCoursesData, null, 2)});
});

// Individual course endpoint with full details
app.get('/api/v1/courses/:id', (req, res) => {
  const courseId = parseInt(req.params.id);
  const course = fullCoursesData.find(c => c.id === courseId);
  
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  
  res.json(course);
});

// Admin login
app.post('/api/v1/admin/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@vialifecoach.com' && password === 'admin123') {
    res.json({
      success: true,
      message: "Login successful",
      token: "simple-token-" + Date.now(),
      user: {
        id: 1,
        name: 'Admin User',
        email: 'admin@vialifecoach.com',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid credentials"
    });
  }
});

// Auth endpoints for frontend
app.get('/api/v1/auth/me', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 1,
      name: 'Admin User',
      email: 'admin@vialifecoach.com',
      role: 'admin',
      avatar: null
    }
  });
});

app.get('/api/v1/admin/auth/me', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 1,
      name: 'Admin User',
      email: 'admin@vialifecoach.com',
      role: 'admin',
      avatar: null
    }
  });
});

app.post('/api/v1/auth/refresh-token', (req, res) => {
  res.json({
    success: true,
    token: 'simple-token-' + Date.now(),
    user: { id: 1, role: 'admin' }
  });
});

app.post('/api/v1/admin/auth/refresh-token', (req, res) => {
  res.json({
    success: true,
    token: 'simple-token-' + Date.now(),
    user: { id: 1, role: 'admin' }
  });
});

app.listen(PORT, () => {
  console.log(\`🚀 Simple server running on http://localhost:\${PORT}\`);
  console.log('📋 Available endpoints:');
  console.log(\`   GET  /test - Test server\`);
  console.log(\`   GET  /api/v1/courses - Get courses with full content (\${fullCoursesData.length} courses)\`);
  console.log(\`   GET  /api/v1/courses/:id - Get individual course with modules & lessons\`);
  console.log(\`   POST /api/v1/admin/auth/login - Admin login\`);
  console.log(\`   GET  /api/v1/auth/me - Get current user\`);
  console.log(\`   GET  /api/v1/admin/auth/me - Get admin user\`);
  console.log(\`   POST /api/v1/auth/refresh-token - Refresh token\`);
  console.log(\`   POST /api/v1/admin/auth/refresh-token - Refresh admin token\`);
  console.log('');
  console.log('📚 Course Content Available:');
  fullCoursesData.forEach(course => {
    console.log(\`   - \${course.title}: \${course.modules.length} modules, \${course.modules.reduce((total, mod) => total + mod.lessons.length, 0)} lessons\`);
  });
});`;

fs.writeFileSync('./simple-server.js', simpleServerContent);
console.log('✅ Simple server updated with COMPLETE course content including modules and lessons');
console.log('');
console.log('📚 Course Content Summary:');
fullCoursesData.forEach(course => {
  const totalLessons = course.modules.reduce((total, mod) => total + mod.lessons.length, 0);
  console.log(`- ${course.title}: ${course.modules.length} modules, ${totalLessons} lessons`);
  course.modules.forEach(module => {
    console.log(`  • ${module.title}: ${module.lessons.length} lessons`);
  });
});
