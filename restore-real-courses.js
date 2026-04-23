const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vialifecoach_academy',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
  ssl: false
});

async function restoreRealCourses() {
  try {
    console.log('🔄 Restoring your REAL courses from JSON files...');
    
    // Clear the database first
    await pool.query('DELETE FROM courses');
    console.log('🗑️ Cleared existing data');
    
    // Read the academy program JSON
    const academyData = JSON.parse(fs.readFileSync('./seeds/academy_program_first3_courses.json', 'utf8'));
    
    // Extract courses from JSON
    const courses = [];
    
    // Add introductory course
    courses.push({
      title: academyData.introductory_course.title,
      description: academyData.introductory_course.overview,
      price: 0,
      thumbnail_url: "https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=Orientation"
    });
    
    // Add main courses
    academyData.courses.forEach(course => {
      courses.push({
        title: course.title,
        description: course.overview,
        price: Math.floor(Math.random() * 200) + 299, // Random price between 299-499
        thumbnail_url: `https://via.placeholder.com/300x200/${Math.floor(Math.random()*16777215).toString(16)}/FFFFFF?text=${encodeURIComponent(course.title.substring(0, 20))}`
      });
    });
    
    // Insert courses into database
    for (const course of courses) {
      await pool.query(
        'INSERT INTO courses (title, description, price, thumbnail_url) VALUES ($1, $2, $3, $4)',
        [course.title, course.description, course.price, course.thumbnail_url]
      );
    }
    
    console.log(`✅ Restored ${courses.length} real courses to database`);
    
    // Show what was restored
    const result = await pool.query('SELECT id, title, description FROM courses ORDER BY id');
    console.log('\n📋 Your restored courses:');
    result.rows.forEach(course => {
      console.log(`- ${course.id}: ${course.title}`);
      console.log(`  ${course.description.substring(0, 80)}...`);
    });
    
    // Now update the simple server with these courses
    console.log('\n🔄 Updating simple server with your real courses...');
    
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

app.get('/api/v1/courses', (req, res) => {
  res.json(${JSON.stringify(result.rows.map(course => ({
    id: course.id,
    title: course.title,
    description: course.description,
    price: course.price,
    image: course.thumbnail_url
  })), null, 2)});
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
  console.log(\`   GET  /api/v1/courses - Get courses (\${result.rows.length} courses)\`);
  console.log(\`   POST /api/v1/admin/auth/login - Admin login\`);
  console.log(\`   GET  /api/v1/auth/me - Get current user\`);
  console.log(\`   GET  /api/v1/admin/auth/me - Get admin user\`);
  console.log(\`   POST /api/v1/auth/refresh-token - Refresh token\`);
  console.log(\`   POST /api/v1/admin/auth/refresh-token - Refresh admin token\`);
});`;
    
    fs.writeFileSync('./simple-server.js', simpleServerContent);
    console.log('✅ Simple server updated with your real courses');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

restoreRealCourses();
