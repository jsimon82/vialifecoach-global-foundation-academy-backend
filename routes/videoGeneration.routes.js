const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const SimpleVideoGenerator = require('../services/simpleVideoGenerator');
const confidenceScript = require('../data/confidenceScript');

// Initialize video generator
const videoGenerator = new SimpleVideoGenerator();

// Generate video from script
router.post('/generate-video', async (req, res) => {
    try {
        const { courseTitle, lessonNumber, scriptType } = req.body;
        
        console.log(`🎬 Starting video generation request:`, {
            courseTitle,
            lessonNumber,
            scriptType
        });
        
        let scriptData;
        
        // Select script based on type
        switch (scriptType) {
            case 'confidence':
                scriptData = confidenceScript;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Script type not supported'
                });
        }
        
        // Generate the video
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

// Download generated video
router.get('/download/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const videoPath = path.join(__dirname, '../generated_videos', filename);
        
        if (fs.existsSync(videoPath)) {
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            const fileStream = fs.createReadStream(videoPath);
            fileStream.pipe(res);
        } else {
            res.status(404).json({
                success: false,
                message: 'Video not found'
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

// List generated videos
router.get('/list', (req, res) => {
    try {
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

// Delete generated video
router.delete('/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const videoPath = path.join(__dirname, '../generated_videos', filename);
        
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
            res.json({
                success: true,
                message: 'Video deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Video not found'
            });
        }
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Delete failed'
        });
    }
});

module.exports = router;
