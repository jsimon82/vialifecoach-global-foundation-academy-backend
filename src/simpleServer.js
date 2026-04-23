const express = require('express');
const cors = require('cors');
const SimpleVideoGenerator = require('../services/simpleVideoGenerator');
const confidenceScript = require('../data/confidenceScript');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Simple server is working!' });
});

// Video generation routes
app.post('/api/v1/video-generation/generate-video', async (req, res) => {
  try {
    const { courseTitle, lessonNumber, scriptType } = req.body;
    
    console.log(`🎬 Starting video generation request:`, {
      courseTitle,
      lessonNumber,
      scriptType
    });
    
    let scriptData;
    if (scriptType === 'confidence') {
      scriptData = confidenceScript;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Script type not supported'
      });
    }
    
    const videoGenerator = new SimpleVideoGenerator();
    const result = await videoGenerator.generateVideoFromScript(
      scriptData,
      courseTitle,
      lessonNumber
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Video generated successfully',
        data: {
          videoPath: result.videoPath,
          duration: result.duration,
          courseTitle,
          lessonNumber,
          downloadUrl: `/api/v1/video-generation/download/${courseTitle}_${lessonNumber}.mp4`
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Video generation failed',
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// List videos
app.get('/api/v1/video-generation/list', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const videosDir = path.join(__dirname, '../generated_videos');
    
    if (!fs.existsSync(videosDir)) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const files = fs.readdirSync(videosDir)
      .filter(file => file.endsWith('.mp4'))
      .map(file => {
        const filePath = path.join(videosDir, file);
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
    console.error('List videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list videos'
    });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Simple Vialifecoach Academy Server running on http://localhost:${PORT}`);
  console.log(`🎬 Video generation API ready at: http://localhost:${PORT}/api/v1/video-generation`);
});
