const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Create output directory
const outputDir = path.join(__dirname, 'generated_videos');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Vialifecoach Academy Video Server is working!' });
});

// Video generation route
app.post('/api/v1/video-generation/generate-video', async (req, res) => {
  try {
    const { courseTitle, lessonNumber, scriptType } = req.body;
    
    console.log(`🎬 Starting video generation:`, {
      courseTitle,
      lessonNumber,
      scriptType
    });
    
    // Create a simple HTML slide
    const slideHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #1F4E8C 0%, #2C5282 100%);
            font-family: Arial, sans-serif;
            overflow: hidden;
        }
        .slide {
            width: 1920px;
            height: 1080px;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            text-align: center;
        }
        .title {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 30px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        .content {
            font-size: 32px;
            max-width: 80%;
            line-height: 1.4;
            margin-bottom: 40px;
        }
        .branding {
            position: absolute;
            bottom: 40px;
            font-size: 20px;
            color: #FFD700;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="slide">
        <div class="title">The Confidence Code: Building Unstoppable Self-Belief</div>
        <div class="content">Lesson 1.1: How Confidence Begins in the Mind</div>
        <div class="branding">Vialifecoach Academy</div>
    </div>
</body>
</html>`;
    
    // Save slide
    const slidePath = path.join(outputDir, `${courseTitle}_${lessonNumber}.html`);
    fs.writeFileSync(slidePath, slideHTML);
    
    console.log(`✅ Generated slide: ${slidePath}`);
    
    res.json({
      success: true,
      message: 'Demo slide generated successfully',
      data: {
        slidePath: slidePath,
        courseTitle,
        lessonNumber,
        downloadUrl: `/api/v1/video-generation/download/${courseTitle}_${lessonNumber}.html`
      }
    });
    
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// List generated files
app.get('/api/v1/video-generation/list', (req, res) => {
  try {
    if (!fs.existsSync(outputDir)) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const files = fs.readdirSync(outputDir)
      .map(file => {
        const filePath = path.join(outputDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          downloadUrl: `/api/v1/video-generation/download/${file}`
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    
    res.json({
      success: true,
      data: files
    });
    
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list files'
    });
  }
});

// Download file
app.get('/api/v1/video-generation/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(outputDir, decodeURIComponent(filename));
    
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } else {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: 'Download failed'
    });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Vialifecoach Academy Video Server running on http://localhost:${PORT}`);
  console.log(`🎬 API ready at: http://localhost:${PORT}/api/v1/video-generation`);
  console.log(`📁 Test with: curl -X POST http://localhost:${PORT}/api/v1/video-generation/generate-video -H "Content-Type: application/json" -d '{"courseTitle": "The Confidence Code", "lessonNumber": "1.1", "scriptType": "confidence"}'`);
});
